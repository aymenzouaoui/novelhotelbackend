const OffreSpeciale = require("../models/OffreSpeciale");

const SUPPORTED_LANGS = ["fr", "ar"];

function parseTranslations(translations) {
  if (!translations) return null;
  if (typeof translations === "object") return translations;
  if (typeof translations !== "string") return null;
  try {
    return JSON.parse(translations);
  } catch {
    return null;
  }
}

function resolveOffreForLang(offre, lang) {
  if (!offre || !lang || !SUPPORTED_LANGS.includes(lang)) return offre;
  const doc = offre.toObject ? offre.toObject() : { ...offre };
  const t = doc.translations && doc.translations[lang];
  if (!t) return doc;
  return {
    ...doc,
    title: (t.title && String(t.title).trim()) ? t.title : doc.title,
    description: (t.description != null && String(t.description) !== "") ? t.description : doc.description,
  };
}

// Helper function to detect media type from file extension
function detectMediaType(filename) {
  if (!filename) return null;
  const ext = filename.toLowerCase().split('.').pop();
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];
  
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  return null;
}

exports.createOffre = async (req, res) => {
  try {
    // 🔍 LOG: Request body and files
    console.log("📥 CREATE OFFRE - Request body:", {
      title:req.body
      
    });
    
    console.log("📁 CREATE OFFRE - Request files:", req.files ? Object.keys(req.files) : "No files");
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        console.log(`  - ${key}:`, req.files[key].map(f => ({ name: f.originalname, size: f.size })));
      });
    }

    const { title, description, discountPercentage, startDate, endDate, active, mediaType: bodyMediaType, existingImages, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);
    
    let images = [];
    let video = "";
    let media = "";
    let finalMediaType = null;

    if (req.files) {
      if (req.files["images"] && req.files["images"].length > 0) {
        images = req.files["images"].map((f) => f.path);
        media = images[0] || "";
        finalMediaType = "image";
        console.log(`✅ Using 'images' field - ${req.files["images"].length} files received:`);
        req.files["images"].forEach((f, idx) => {
          console.log(`   [${idx + 1}] ${f.originalname} -> ${f.path}`);
        });
        console.log(`✅ All ${images.length} images paths:`, images);
      } else if (req.files["video"] && req.files["video"].length > 0) {
        const videoFile = req.files["video"][0];
        video = videoFile.path;
        media = video;
        finalMediaType = "video";
        console.log("✅ Using 'video' field:", videoFile.originalname);
      } else if (req.files["media"] && req.files["media"].length > 0) {
        const file = req.files["media"][0];
        media = file.path;
        finalMediaType = detectMediaType(file.originalname);
        if (finalMediaType === "image") {
          images = [media];
        } else if (finalMediaType === "video") {
          video = media;
        }
        console.log("✅ Using 'media' field:", file.originalname);
      } else if (req.files["image"] && req.files["image"].length > 0) {
        const file = req.files["image"][0];
        media = file.path;
        finalMediaType = detectMediaType(file.originalname) || "image";
        images = [media];
        console.log("✅ Using 'image' field:", file.originalname);
      }
    }

    // If body explicitly says video/images, trust it when no file-type ambiguity
    if (!finalMediaType && bodyMediaType) {
      if (bodyMediaType === "video") finalMediaType = "video";
      if (bodyMediaType === "images") finalMediaType = "image";
    }

    console.log("📤 CREATE OFFRE - Final values:", {
      media,
      mediaType: finalMediaType,
      imagesCount: images.length,
      images: images, // Show all image URLs
      hasVideo: !!video,
    });

    const offre = new OffreSpeciale({
      title,
      description,
      discountPercentage,
      startDate,
      endDate,
      active,
      media,
      mediaType: finalMediaType,
      images,
      video,
      image: media && finalMediaType === "image" ? media : "",
      translations: {
        fr: (translations && translations.fr)
          ? { title: String(translations.fr.title ?? "").trim(), description: translations.fr.description != null ? String(translations.fr.description) : "" }
          : { title: "", description: "" },
        ar: (translations && translations.ar)
          ? { title: String(translations.ar.title ?? "").trim(), description: translations.ar.description != null ? String(translations.ar.description) : "" }
          : { title: "", description: "" },
      },
    });

    console.log("💾 CREATE OFFRE - Saving offre with images array:", offre.images);
    await offre.save();
    console.log("✅ CREATE OFFRE - Saved offre, verifying images in DB:", offre.images);

    const io = req.app.get("io");
    io.emit("offreCreated", offre);

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    console.log("✅ CREATE OFFRE - Success, offre ID:", offre._id);
    res.status(201).json(lang ? resolveOffreForLang(offre, lang) : offre);
  } catch (err) {
    console.error("❌ Error creating offer:", err.message);
    console.error("❌ Error stack:", err.stack);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllOffres = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const offres = await OffreSpeciale.find();
    const payload = lang ? offres.map((o) => resolveOffreForLang(o, lang)) : offres;
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOffreById = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const offre = await OffreSpeciale.findById(req.params.id);
    if (!offre) return res.status(404).json({ message: "Offre not found" });
    res.status(200).json(lang ? resolveOffreForLang(offre, lang) : offre);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOffre = async (req, res) => {
  try {
    // 🔍 LOG: Request body and files
    console.log("📥 UPDATE OFFRE - ID:", req.params.id);
    console.log("📥 UPDATE OFFRE - Request body:", {
      title: req.body.title,
      description: req.body.description,
      discountPercentage: req.body.discountPercentage,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      active: req.body.active,
      mediaType: req.body.mediaType,
      existingImages: req.body.existingImages
    });
    
    console.log("📁 UPDATE OFFRE - Request files:", req.files ? Object.keys(req.files) : "No files");
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        console.log(`  - ${key}:`, req.files[key].map(f => ({ name: f.originalname, size: f.size })));
      });
    }

    const { title, description, discountPercentage, startDate, endDate, active, mediaType: bodyMediaType, existingImages, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);
    
    const updateFields = {
      title,
      description,
      discountPercentage,
      startDate,
      endDate,
      active,
    };

    let images = [];
    let video = "";
    let media = "";
    let finalMediaType = null;

    // Start from existingImages (JSON from frontend) if provided
    if (existingImages) {
      try {
        const parsed = JSON.parse(existingImages);
        if (Array.isArray(parsed)) {
          images = parsed;
        }
      } catch (e) {
        console.warn("⚠️ Failed to parse existingImages:", e.message);
      }
    }

    if (req.files) {
      if (req.files["images"] && req.files["images"].length > 0) {
        const newImages = req.files["images"].map((f) => f.path);
        images = [...images, ...newImages];
        media = images[0] || "";
        finalMediaType = "image";
        console.log("✅ Using 'images' field, files:", req.files["images"].map(f => f.originalname));
        // When new images are uploaded, clear any video
        video = "";
      } else if (req.files["video"] && req.files["video"].length > 0) {
        const videoFile = req.files["video"][0];
        video = videoFile.path;
        media = video;
        finalMediaType = "video";
        console.log("✅ Using 'video' field:", videoFile.originalname);
        // When a video is uploaded, clear images
        images = [];
      } else if (req.files["media"] && req.files["media"].length > 0) {
        const file = req.files["media"][0];
        media = file.path;
        finalMediaType = detectMediaType(file.originalname);
        if (finalMediaType === "image") {
          images = [media];
          video = "";
        } else if (finalMediaType === "video") {
          video = media;
          images = [];
        }
        console.log("✅ Using 'media' field:", file.originalname);
      } else if (req.files["image"] && req.files["image"].length > 0) {
        const file = req.files["image"][0];
        media = file.path;
        finalMediaType = detectMediaType(file.originalname) || "image";
        images = [media];
        video = "";
        console.log("✅ Using 'image' field:", file.originalname);
      }
    }

    // If body explicitly says video/images, trust it when no file-type ambiguity
    if (!finalMediaType && bodyMediaType) {
      if (bodyMediaType === "video") finalMediaType = "video";
      if (bodyMediaType === "images") finalMediaType = "image";
    }

    if (images.length > 0 || video || media) {
      updateFields.media = media || (images[0] || video || "");
      updateFields.mediaType = finalMediaType;
      updateFields.images = images;
      updateFields.video = video;
      // Keep image for backward compatibility if it's an image
      if (finalMediaType === "image" && images.length > 0) {
        updateFields.image = images[0];
      } else if (finalMediaType === "video") {
        updateFields.image = "";
      }
      console.log("📤 UPDATE OFFRE - Media updated:", {
        media: updateFields.media,
        mediaType: finalMediaType,
        imagesCount: images.length,
        hasVideo: !!video,
      });
    } else {
      console.log("📤 UPDATE OFFRE - No new media, keeping existing images/video");
    }

    if (translations && typeof translations === "object") {
      if (translations.fr != null) {
        updateFields["translations.fr"] = {
          title: String(translations.fr.title ?? "").trim(),
          description: translations.fr.description != null ? String(translations.fr.description) : "",
        };
      }
      if (translations.ar != null) {
        updateFields["translations.ar"] = {
          title: String(translations.ar.title ?? "").trim(),
          description: translations.ar.description != null ? String(translations.ar.description) : "",
        };
      }
    }

    const offre = await OffreSpeciale.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });
    if (!offre) return res.status(404).json({ message: "Offre not found" });

    const io = req.app.get("io");
    io.emit("offreUpdated", offre);

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    console.log("✅ UPDATE OFFRE - Success, offre ID:", offre._id);
    res.status(200).json(lang ? resolveOffreForLang(offre, lang) : offre);
  } catch (err) {
    console.error("❌ Error updating offer:", err.message);
    console.error("❌ Error stack:", err.stack);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteOffre = async (req, res) => {
  try {
    const offre = await OffreSpeciale.findByIdAndDelete(req.params.id);
    if (!offre) return res.status(404).json({ message: "Offre not found" });

    // 🟠 Emit deletion
    const io = req.app.get("io");
    io.emit("offreDeleted", offre._id);

    res.status(200).json({ message: "Offre deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
