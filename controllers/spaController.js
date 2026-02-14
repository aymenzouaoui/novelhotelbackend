const Spa = require("../models/Spa");

const SUPPORTED_LANGS = ["fr", "ar"];

function resolveSpaForLang(spa, lang) {
  if (!spa || !lang || !SUPPORTED_LANGS.includes(lang)) return spa;
  const doc = spa.toObject ? spa.toObject() : { ...spa };
  if (!doc.categories || !Array.isArray(doc.categories)) return doc;
  doc.categories = doc.categories.map((cat) => {
    const c = { ...cat };
    const catT = cat.translations && cat.translations[lang];
    if (catT && catT.title && String(catT.title).trim()) c.title = catT.title;
    if (c.services && Array.isArray(c.services)) {
      c.services = c.services.map((srv) => {
        const s = { ...srv };
        const srvT = srv.translations && srv.translations[lang];
        if (srvT) {
          if (srvT.name && String(srvT.name).trim()) s.name = srvT.name;
          if (srvT.description != null && String(srvT.description) !== "") s.description = srvT.description;
        }
        return s;
      });
    }
    return c;
  });
  return doc;
}

// ✅ Create Spa (with categories, services, and category images)
exports.createSpa = async (req, res) => {
  try {
    let { categories } = req.body;

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ message: "Categories are required and must be an array" });
    }

    // Handle images for categories (req.files)
    if (req.files && req.files.length > 0) {
      categories = categories.map((cat, index) => {
        return {
          ...cat,
          image: req.files[index] ? req.files[index].path : cat.image || ""
        };
      });
    }

    // Ensure each service has a reservable boolean
    categories.forEach(category => {
      if (Array.isArray(category.services)) {
        category.services.forEach(service => {
          if (service.reservable === undefined) service.reservable = true;
        });
      }
    });

    const spa = new Spa({ categories });
    await spa.save();

    const io = req.app.get("io");
    io.emit("spaCreated", spa);

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(201).json(lang ? resolveSpaForLang(spa, lang) : spa);
  } catch (err) {
    console.error("❌ Error creating spa:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get all Spa documents
exports.getAllSpas = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const spas = await Spa.find();
    const payload = lang ? spas.map((s) => resolveSpaForLang(s, lang)) : spas;
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get Spa by ID
exports.getSpaById = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const spa = await Spa.findById(req.params.id);
    if (!spa) return res.status(404).json({ message: "Spa not found" });
    res.status(200).json(lang ? resolveSpaForLang(spa, lang) : spa);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update Spa (replace categories & images)
exports.updateSpa = async (req, res) => {
  try {
    let { categories } = req.body;

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ message: "Categories are required and must be an array" });
    }

    // Handle images for updated categories
    if (req.files && req.files.length > 0) {
      categories = categories.map((cat, index) => {
        return {
          ...cat,
          image: req.files[index] ? req.files[index].path : cat.image || ""
        };
      });
    }

    // Ensure each service has a reservable boolean
    categories.forEach(category => {
      if (Array.isArray(category.services)) {
        category.services.forEach(service => {
          if (service.reservable === undefined) service.reservable = true;
        });
      }
    });

    const spa = await Spa.findByIdAndUpdate(
      req.params.id,
      { categories },
      { new: true }
    );

    if (!spa) return res.status(404).json({ message: "Spa not found" });

    const io = req.app.get("io");
    io.emit("spaUpdated", spa);

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(200).json(lang ? resolveSpaForLang(spa, lang) : spa);
  } catch (err) {
    console.error("❌ Error updating spa:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete Spa
exports.deleteSpa = async (req, res) => {
  try {
    const spa = await Spa.findByIdAndDelete(req.params.id);
    if (!spa) return res.status(404).json({ message: "Spa not found" });

    const io = req.app.get("io");
    io.emit("spaDeleted", spa._id);

    res.status(200).json({ message: "Spa deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
