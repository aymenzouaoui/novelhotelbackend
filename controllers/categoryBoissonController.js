const CategoryBoisson = require("../models/CategoryBoisson");

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

function resolveCategoryForLang(category, lang) {
  if (!category || !lang || !SUPPORTED_LANGS.includes(lang)) return category;
  const doc = category.toObject ? category.toObject() : { ...category };
  const t = doc.translations && doc.translations[lang];
  if (!t) return doc;
  return {
    ...doc,
    name: (t.name && String(t.name).trim()) ? t.name : doc.name,
    description: (t.description != null && String(t.description) !== "") ? t.description : doc.description,
  };
}

exports.createCategory = async (req, res) => {
  try {
    const { name, description, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);
    const image = req.file ? req.file.path : "";
 console.log("eeee",req.body);
    const category = new CategoryBoisson({
      name,
      description,
      image,
      translations: {
        fr: (translations && translations.fr)
          ? { name: String(translations.fr.name ?? "").trim(), description: translations.fr.description != null ? String(translations.fr.description) : "" }
          : { name: "", description: "" },
        ar: (translations && translations.ar)
          ? { name: String(translations.ar.name ?? "").trim(), description: translations.ar.description != null ? String(translations.ar.description) : "" }
          : { name: "", description: "" },
      },
    });
    await category.save();

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(201).json(lang ? resolveCategoryForLang(category, lang) : category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const categories = await CategoryBoisson.find();
    const payload = lang ? categories.map((c) => resolveCategoryForLang(c, lang)) : categories;
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const category = await CategoryBoisson.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.status(200).json(lang ? resolveCategoryForLang(category, lang) : category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);

    const updateFields = { name, description };
    if (req.file) {
      updateFields.image = req.file.path;
    }
    if (translations && typeof translations === "object") {
      if (translations.fr != null) {
        updateFields["translations.fr"] = {
          name: String(translations.fr.name ?? "").trim(),
          description: translations.fr.description != null ? String(translations.fr.description) : "",
        };
      }
      if (translations.ar != null) {
        updateFields["translations.ar"] = {
          name: String(translations.ar.name ?? "").trim(),
          description: translations.ar.description != null ? String(translations.ar.description) : "",
        };
      }
    }

    const category = await CategoryBoisson.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!category) return res.status(404).json({ message: "Category not found" });

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(200).json(lang ? resolveCategoryForLang(category, lang) : category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.deleteCategory = async (req, res) => {
  try {
    const category = await CategoryBoisson.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
