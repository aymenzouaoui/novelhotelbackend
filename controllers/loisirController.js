  const Loisir = require("../models/Loisir");

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

  function resolveLoisirForLang(loisir, lang) {
    if (!loisir || !lang || !SUPPORTED_LANGS.includes(lang)) return loisir;
    const doc = loisir.toObject ? loisir.toObject() : { ...loisir };
    const t = doc.translations && doc.translations[lang];
    if (!t) return doc;
    return {
      ...doc,
      name: (t.name && String(t.name).trim()) ? t.name : doc.name,
      description: (t.description != null && String(t.description) !== "") ? t.description : doc.description,
    };
  }

  exports.createLoisir = async (req, res) => {
    try {
      const { name, description, ouverture, fermeture, translations: rawTranslations } = req.body;
      const translations = parseTranslations(rawTranslations);
      const image = req.file ? req.file.path : "";

      const loisir = new Loisir({
        name,
        description,
        image,
        ouverture: ouverture ? new Date(ouverture) : null,
        fermeture: fermeture ? new Date(fermeture) : null,
        translations: {
          fr: (translations && translations.fr)
            ? { name: String(translations.fr.name ?? "").trim(), description: translations.fr.description != null ? String(translations.fr.description) : "" }
            : { name: "", description: "" },
          ar: (translations && translations.ar)
            ? { name: String(translations.ar.name ?? "").trim(), description: translations.ar.description != null ? String(translations.ar.description) : "" }
            : { name: "", description: "" },
        },
      });

      await loisir.save();

      const io = req.app.get("io");
      io.emit("loisirCreated", loisir);

      const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
      res.status(201).json(lang ? resolveLoisirForLang(loisir, lang) : loisir);
    } catch (err) {
      console.error("❌ Error creating loisir:", err.message);
      res.status(500).json({ message: err.message });
    }
  };

  exports.getAllLoisirs = async (req, res) => {
    try {
      const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
      const loisirs = await Loisir.find();
      const payload = lang ? loisirs.map((l) => resolveLoisirForLang(l, lang)) : loisirs;
      res.status(200).json(payload);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  exports.getLoisirById = async (req, res) => {
    try {
      const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
      const loisir = await Loisir.findById(req.params.id);
      if (!loisir) return res.status(404).json({ message: "Loisir not found" });
      res.status(200).json(lang ? resolveLoisirForLang(loisir, lang) : loisir);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  exports.updateLoisir = async (req, res) => {
    try {
      const { name, description, ouverture, fermeture, translations: rawTranslations } = req.body;
      const translations = parseTranslations(rawTranslations);

      const updateFields = {
        name,
        description,
        ouverture: ouverture ? new Date(ouverture) : null,
        fermeture: fermeture ? new Date(fermeture) : null,
      };

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

      const loisir = await Loisir.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });
      if (!loisir) return res.status(404).json({ message: "Loisir not found" });

      const io = req.app.get("io");
      io.emit("loisirUpdated", loisir);

      const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
      res.status(200).json(lang ? resolveLoisirForLang(loisir, lang) : loisir);
    } catch (err) {
      console.error("❌ Error updating loisir:", err.message);
      res.status(500).json({ message: err.message });
    }
  };


  exports.deleteLoisir = async (req, res) => {
    try {
      const loisir = await Loisir.findByIdAndDelete(req.params.id);
      if (!loisir) return res.status(404).json({ message: "Loisir not found" });

      const io = req.app.get("io");
      io.emit("loisirDeleted", loisir._id);

      res.status(200).json({ message: "Loisir deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
