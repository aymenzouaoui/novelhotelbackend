const fs = require("fs");
const multer = require("multer");
const path = require("path");
const Client = require("ssh2-sftp-client");
const sharp = require("sharp");
require("dotenv").config();

// SFTP config
const sftpConfig = {
  host: process.env.OVH_HOST,
  port: Number(process.env.OVH_PORT) || 22,
  username: process.env.OVH_USER,
  password: process.env.OVH_PASS,
};

// Public base URL for your uploads
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "https://novotef.com/uploads/events";

// Local tmp folder (needed for Vercel/OVH)
const localTmp = path.join("/tmp", "uploads");
if (!fs.existsSync(localTmp)) {
  fs.mkdirSync(localTmp, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, localTmp),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// --- Helper: compress large images (>8MB) ---
async function compressIfLarge(file) {
  const stats = fs.statSync(file.path);
  if (stats.size > 8 * 1024 * 1024) {
    console.log(`⚡ Compressing large image: ${file.originalname}`);
    const ext = path.extname(file.originalname).toLowerCase();
    const optimizedPath = file.path.replace(ext, `-optimized${ext}`);
    await sharp(file.path)
      .resize({ width: 1920, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(optimizedPath);
    fs.unlinkSync(file.path);
    file.path = optimizedPath;
  }
  return file;
}

// --- Helper: upload file(s) to SFTP ---
async function uploadToSFTP(files) {
  const sftp = new Client();
  await sftp.connect(sftpConfig);
  await sftp.mkdir(process.env.OVH_UPLOAD_PATH, true);

  const allFiles = Array.isArray(files) ? files : [files];
  await Promise.all(
    allFiles.map(async (file) => {
      await compressIfLarge(file);
      const filename = file.filename;
      const remotePath = `${process.env.OVH_UPLOAD_PATH}/${filename}`;
      await sftp.put(file.path, remotePath);
      file.url = `${PUBLIC_BASE_URL}/${filename}`;
      file.path = file.url;
    })
  );

  await sftp.end();
}

// --- Override .single() ---
const originalSingle = upload.single.bind(upload);
upload.single = function (fieldName) {
  const middleware = originalSingle(fieldName);
  return async function (req, res, next) {
    middleware(req, res, async (err) => {
      if (err) return next(err);
      if (!req.file) return next();
      try {
        await uploadToSFTP(req.file);
        console.log("✅ Single file uploaded to OVH:", req.file.url);
        next();
      } catch (err) {
        console.error("❌ SFTP upload error:", err.message);
        return next(err);
      }
    });
  };
};

// --- Override .array() ---
const originalArray = upload.array.bind(upload);
upload.array = function (fieldName, maxCount) {
  const middleware = originalArray(fieldName, maxCount);
  return async function (req, res, next) {
    middleware(req, res, async (err) => {
      if (err) return next(err);
      if (!req.files || req.files.length === 0) return next();
      try {
        await uploadToSFTP(req.files);
        console.log("✅ Array of files uploaded to OVH");
        next();
      } catch (err) {
        console.error("❌ SFTP upload error:", err.message);
        return next(err);
      }
    });
  };
};

// --- Override .fields() ---
const originalFields = upload.fields.bind(upload);
upload.fields = function (fields) {
  const middleware = originalFields(fields);
  return async function (req, res, next) {
    middleware(req, res, async (err) => {
      if (err) return next(err);
      if (!req.files) return next();

      try {
        for (const fieldName in req.files) {
          await uploadToSFTP(req.files[fieldName]);
        }
        console.log("✅ All fields uploaded to OVH");
        next();
      } catch (err) {
        console.error("❌ SFTP upload error:", err.message);
        return next(err);
      }
    });
  };
};

module.exports = upload;
