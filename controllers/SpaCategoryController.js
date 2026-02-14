const SpaCategory = require("../models/SpaCategory");

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

function resolveSpaCategoryForLang(category, lang) {
  if (!category || !lang || !SUPPORTED_LANGS.includes(lang)) return category;
  const doc = category.toObject ? category.toObject() : { ...category };
  const t = doc.translations && doc.translations[lang];
  if (t && t.title && String(t.title).trim()) doc.title = t.title;
  if (doc.services && Array.isArray(doc.services)) {
    doc.services = doc.services.map((srv) => {
      const s = { ...srv };
      const srvT = srv.translations && srv.translations[lang];
      if (srvT) {
        if (srvT.name && String(srvT.name).trim()) s.name = srvT.name;
        if (srvT.description != null && String(srvT.description) !== "") s.description = srvT.description;
      }
      return s;
    });
  }
  return doc;
}

// Create a new Spa Category
exports.createSpaCategory = async (req, res) => {
  try {
    const { title, services, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);
    const image = req.file ? req.file.path : "";

    let parsedServices = [];
    if (services) {
      parsedServices = typeof services === "string" ? JSON.parse(services) : services;
    }

    const spaCategory = new SpaCategory({
      title,
      services: parsedServices,
      image,
      translations: {
        fr: (translations && translations.fr) ? { title: String(translations.fr.title ?? "").trim() } : { title: "" },
        ar: (translations && translations.ar) ? { title: String(translations.ar.title ?? "").trim() } : { title: "" },
      },
    });

    await spaCategory.save();

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(201).json(lang ? resolveSpaCategoryForLang(spaCategory, lang) : spaCategory);
  } catch (err) {
    console.error("❌ Error creating spa category:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get all Spa Categories
exports.getAllSpaCategories = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const categories = await SpaCategory.find();
    const payload = lang ? categories.map((c) => resolveSpaCategoryForLang(c, lang)) : categories;
    res.status(200).json(payload);
  } catch (err) {
    console.error("❌ Error fetching spa categories:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get a Spa Category by ID
exports.getSpaCategoryById = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const category = await SpaCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Spa category not found" });
    res.status(200).json(lang ? resolveSpaCategoryForLang(category, lang) : category);
  } catch (err) {
    console.error("❌ Error fetching spa category:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Update a Spa Category
exports.updateSpaCategory = async (req, res) => {
  try {
    const { title, services, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);
    const updateFields = { title };

    if (services) {
      updateFields.services = typeof services === "string" ? JSON.parse(services) : services;
    }
    if (req.file) {
      updateFields.image = req.file.path;
    }
    if (translations && typeof translations === "object") {
      if (translations.fr != null) updateFields["translations.fr"] = { title: String(translations.fr.title ?? "").trim() };
      if (translations.ar != null) updateFields["translations.ar"] = { title: String(translations.ar.title ?? "").trim() };
    }

    const category = await SpaCategory.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });
    if (!category) return res.status(404).json({ message: "Spa category not found" });

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(200).json(lang ? resolveSpaCategoryForLang(category, lang) : category);
  } catch (err) {
    console.error("❌ Error updating spa category:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Delete a Spa Category
exports.deleteSpaCategory = async (req, res) => {
  try {
    const category = await SpaCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Spa category not found" });

    res.status(200).json({ message: "Spa category deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting spa category:", err.message);
    res.status(500).json({ message: err.message });
  }
};
