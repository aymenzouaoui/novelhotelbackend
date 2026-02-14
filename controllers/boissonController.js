const Boisson = require("../models/Boisson");

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

function resolveBoissonForLang(boisson, lang) {
  if (!boisson || !lang || !SUPPORTED_LANGS.includes(lang)) return boisson;
  const doc = boisson.toObject ? boisson.toObject() : { ...boisson };
  const t = doc.translations && doc.translations[lang];
  if (!t) return doc;
  return {
    ...doc,
    title: (t.title && String(t.title).trim()) ? t.title : doc.title,
    description: (t.description != null && String(t.description) !== "") ? t.description : doc.description,
  };
}

// CREATE
exports.createBoisson = async (req, res) => {
  try {
    const { title, price, quantity, description, category, order, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);
    const image = req.file ? req.file.path : "";
    const orderNum = typeof order === "number" && !isNaN(order) ? order : (typeof order === "string" && order !== "" && !isNaN(Number(order)) ? Number(order) : 0);

    const boisson = new Boisson({
      title,
      price,
      quantity,
      description,
      category,
      image,
      order: orderNum,
      translations: {
        fr: (translations && translations.fr)
          ? { title: String(translations.fr.title ?? "").trim(), description: translations.fr.description != null ? String(translations.fr.description) : "" }
          : { title: "", description: "" },
        ar: (translations && translations.ar)
          ? { title: String(translations.ar.title ?? "").trim(), description: translations.ar.description != null ? String(translations.ar.description) : "" }
          : { title: "", description: "" },
      },
    });
    await boisson.save();

    const io = req.app.get("io");
    io.emit("boissonCreated", boisson);

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(201).json(lang ? resolveBoissonForLang(boisson, lang) : boisson);
  } catch (err) {
    console.error("❌ Error creating boisson:", err.message);
    res.status(500).json({ message: err.message });
  }
};
exports.getAllBoissons = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const boissons = await Boisson.find().populate("category", "name").sort({ order: 1 });
    const payload = lang ? boissons.map((b) => resolveBoissonForLang(b, lang)) : boissons;
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBoissonById = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const boisson = await Boisson.findById(req.params.id).populate("category", "name");
    if (!boisson) return res.status(404).json({ message: "Boisson not found" });
    res.status(200).json(lang ? resolveBoissonForLang(boisson, lang) : boisson);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
exports.updateBoisson = async (req, res) => {
  try {
    const { title, price, quantity, description, category, order, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);
    const updateFields = { title, price, quantity, description, category };

    if (req.file) {
      updateFields.image = req.file.path;
    }
    if (order !== undefined) {
      const orderNum = typeof order === "number" && !isNaN(order) ? order : (typeof order === "string" && order !== "" && !isNaN(Number(order)) ? Number(order) : 0);
      updateFields.order = orderNum;
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

    const boisson = await Boisson.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });
    if (!boisson) return res.status(404).json({ message: "Boisson not found" });

    const io = req.app.get("io");
    io.emit("boissonUpdated", boisson);

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(200).json(lang ? resolveBoissonForLang(boisson, lang) : boisson);
  } catch (err) {
    console.error("❌ Error updating boisson:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBoisson = async (req, res) => {
  try {
    const boisson = await Boisson.findByIdAndDelete(req.params.id);
    if (!boisson) return res.status(404).json({ message: "Boisson not found" });

    const io = req.app.get("io");
    io.emit("boissonDeleted", boisson._id);

    res.status(200).json({ message: "Boisson deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
