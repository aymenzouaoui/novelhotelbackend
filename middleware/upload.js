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

// Validate SFTP configuration
function validateSFTPConfig() {
  const required = ['OVH_HOST', 'OVH_USER', 'OVH_PASS', 'OVH_UPLOAD_PATH'];
  const missing = required.filter(key => !process.env[key] || process.env[key].includes('your-'));
  
  if (missing.length > 0) {
    throw new Error(
      `❌ Missing or invalid SFTP configuration. Please set the following environment variables:\n` +
      `   ${missing.join(', ')}\n` +
      `   Current OVH_HOST: ${process.env.OVH_HOST || 'not set'}\n` +
      `   Make sure to replace placeholder values with your actual OVH credentials.`
    );
  }
}

// Public base URL for your uploads
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "https://novotel-tunis.com/uploads/events";

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

// Configure multer with file size limits (unlimited for PDFs, 50MB for images)
// Set to 1GB to effectively allow unlimited PDF uploads
const upload = multer({ 
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB per file (effectively unlimited for PDFs)
    fieldSize: 1024 * 1024 * 1024, // 1GB for non-file fields
  }
});

// --- Helper: compress large images (>8MB) ---
async function compressIfLarge(file) {
  const stats = fs.statSync(file.path);
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Only compress image files, skip PDFs and other non-image formats
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.svg'];
  const isImage = imageExtensions.includes(ext);
  
  if (stats.size > 8 * 1024 * 1024 && isImage) {
    console.log(`⚡ Compressing large image: ${file.originalname}`);
    const optimizedPath = file.path.replace(ext, `-optimized${ext}`);
    try {
      await sharp(file.path)
        .resize({ width: 1920, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(optimizedPath);
      fs.unlinkSync(file.path);
      file.path = optimizedPath;
    } catch (err) {
      console.warn(`⚠️ Could not compress image ${file.originalname}: ${err.message}`);
      // If compression fails, keep the original file
    }
  } else if (stats.size > 8 * 1024 * 1024 && !isImage) {
    console.log(`ℹ️ Skipping compression for non-image file: ${file.originalname} (${ext})`);
  }
  
  return file;
}

// Normalize upload path - convert absolute paths to relative
function normalizeUploadPath(path) {
  if (!path) return path;
  
  // If path starts with /, it's absolute - convert to relative
  if (path.startsWith('/')) {
    // Remove leading slash
    const relativePath = path.substring(1);
    // For OVH, common structure is www/uploads/events
    if (relativePath.startsWith('uploads/')) {
      return `www/${relativePath}`;
    }
    return relativePath;
  }
  
  // Remove ./ prefix if present (some SFTP clients prefer without it)
  if (path.startsWith('./')) {
    return path.substring(2);
  }
  
  return path;
}

// --- Helper: upload file(s) to SFTP ---
async function uploadToSFTP(files) {
  // Validate configuration before attempting connection
  validateSFTPConfig();
  
  const sftp = new Client();
  await sftp.connect(sftpConfig);
  
  // Normalize the upload path
  const originalPath = process.env.OVH_UPLOAD_PATH;
  let uploadPath = normalizeUploadPath(originalPath);
  
  if (originalPath !== uploadPath) {
    console.log(`📝 Normalized path: "${originalPath}" → "${uploadPath}"`);
  }
  
  // Try to ensure directory exists, but handle permission errors gracefully
  try {
    // Check if directory exists first
    try {
      await sftp.stat(uploadPath);
      console.log(`✅ Directory exists: ${uploadPath}`);
    } catch (statErr) {
      // Directory doesn't exist, try to create it
      try {
        await sftp.mkdir(uploadPath, true);
        console.log(`✅ Directory created: ${uploadPath}`);
      } catch (mkdirErr) {
        // If we can't create it due to permissions, log a warning but continue
        // The directory might already exist (created by admin) or we'll fail on upload if it doesn't
        if (mkdirErr.message.includes('Permission denied')) {
          console.warn(`⚠️ Cannot create directory "${uploadPath}" - Permission denied`);
          console.warn(`⚠️ Continuing anyway - directory might already exist or upload will fail if path is invalid`);
        } else {
          // For other errors, log but still try to continue
          console.warn(`⚠️ Could not create directory "${uploadPath}": ${mkdirErr.message}`);
          console.warn(`⚠️ Continuing anyway - will attempt upload`);
        }
      }
    }
  } catch (err) {
    // Only throw if it's not a directory creation issue
    if (!err.message.includes('Permission denied') && !err.message.includes('mkdir')) {
      await sftp.end().catch(() => {});
      throw err;
    }
  }

  // Verify directory exists before attempting upload
  // Try multiple path variations to find the correct one
  let verifiedPath = null;
  const pathVariations = [
    uploadPath,
    `./${uploadPath}`,
    `./www/${uploadPath.replace('www/', '')}`,
    uploadPath.replace('www/', ''),
  ].filter((p, i, arr) => arr.indexOf(p) === i); // Remove duplicates
  
  for (const testPath of pathVariations) {
    try {
      await sftp.stat(testPath);
      verifiedPath = testPath;
      console.log(`✅ Directory found: ${testPath}`);
      break;
    } catch (statErr) {
      // Continue trying other paths
    }
  }
  
  if (!verifiedPath) {
    await sftp.end().catch(() => {});
    throw new Error(
      `❌ Directory does not exist: "${uploadPath}"\n` +
      `   Tried paths: ${pathVariations.join(', ')}\n` +
      `   The upload directory must exist on the SFTP server.\n` +
      `   Please either:\n` +
      `   1. Create the directory manually via FTP/SFTP client\n` +
      `   2. Update OVH_UPLOAD_PATH in Vercel environment variables to: "www/uploads/events"\n` +
      `   3. Ask your hosting provider to create the directory\n` +
      `   Home directory: /home/${sftpConfig.username}\n` +
      `   Recommended path: "www/uploads/events" (relative to home directory)`
    );
  }
  
  // Use the verified path for uploads
  uploadPath = verifiedPath;

  const allFiles = Array.isArray(files) ? files : [files];
  await Promise.all(
    allFiles.map(async (file) => {
      await compressIfLarge(file);
      const filename = file.filename;
      const remotePath = `${uploadPath}/${filename}`;
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
      // Handle multer errors with CORS headers
      if (err) {
        const origin = req.headers.origin;
        if (origin) {
          res.header('Access-Control-Allow-Origin', origin);
          res.header('Access-Control-Allow-Credentials', 'true');
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        return next(err);
      }
      if (!req.file) return next();
      try {
        await uploadToSFTP(req.file);
        console.log("✅ Single file uploaded to OVH:", req.file.url);
        next();
      } catch (err) {
        console.error("❌ SFTP upload error:", err.message);
        // Set CORS headers on SFTP errors
        const origin = req.headers.origin;
        if (origin) {
          res.header('Access-Control-Allow-Origin', origin);
          res.header('Access-Control-Allow-Credentials', 'true');
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
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
      // Handle multer errors with CORS headers
      if (err) {
        const origin = req.headers.origin;
        if (origin) {
          res.header('Access-Control-Allow-Origin', origin);
          res.header('Access-Control-Allow-Credentials', 'true');
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        return next(err);
      }
      if (!req.files || req.files.length === 0) return next();
      try {
        await uploadToSFTP(req.files);
        console.log("✅ Array of files uploaded to OVH");
        next();
      } catch (err) {
        console.error("❌ SFTP upload error:", err.message);
        // Set CORS headers on SFTP errors
        const origin = req.headers.origin;
        if (origin) {
          res.header('Access-Control-Allow-Origin', origin);
          res.header('Access-Control-Allow-Credentials', 'true');
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
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
      // Handle multer errors with CORS headers
      if (err) {
        // Set CORS headers before passing error
        const origin = req.headers.origin;
        if (origin) {
          res.header('Access-Control-Allow-Origin', origin);
          res.header('Access-Control-Allow-Credentials', 'true');
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        return next(err);
      }
      if (!req.files) return next();

      try {
        for (const fieldName in req.files) {
          await uploadToSFTP(req.files[fieldName]);
        }
        console.log("✅ All fields uploaded to OVH");
        next();
      } catch (err) {
        console.error("❌ SFTP upload error:", err.message);
        // Set CORS headers on SFTP errors
        const origin = req.headers.origin;
        if (origin) {
          res.header('Access-Control-Allow-Origin', origin);
          res.header('Access-Control-Allow-Credentials', 'true');
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        return next(err);
      }
    });
  };
};

module.exports = upload;
