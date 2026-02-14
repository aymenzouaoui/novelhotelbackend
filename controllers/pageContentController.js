const PageContent = require("../models/PageContent");

// Langues supportées : fr, ar
const SUPPORTED_LANGS = ["fr", "ar"];

// Helper : renvoie le contenu avec pageName/description résolus selon la langue (fr | ar)
function resolveContentForLang(content, lang) {
  if (!content || !lang || !SUPPORTED_LANGS.includes(lang)) return content;
  const doc = content.toObject ? content.toObject() : { ...content };
  const t = doc.translations && doc.translations[lang];
  if (!t) return doc;
  return {
    ...doc,
    pageName: (t.pageName && String(t.pageName).trim()) ? t.pageName : doc.pageName,
    description: (t.description != null && String(t.description) !== "") ? t.description : doc.description,
  };
}

// Parse translations si envoyé en string (multipart/form-data)
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

// CREATE — crée toujours un nouveau document (plusieurs contenus par pageName autorisés)
exports.createPageContent = async (req, res) => {
  try {
    const { pageName, description, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);
    const image = req.file ? req.file.path : "";

    if (!pageName || String(pageName).trim() === "") {
      return res.status(400).json({ message: "pageName est obligatoire" });
    }

    const pageContent = new PageContent({
      pageName: String(pageName).trim(),
      description: description != null ? String(description) : "",
      image: image || "",
      translations: {
        fr: (translations && translations.fr) ? {
          pageName: translations.fr.pageName != null ? String(translations.fr.pageName) : "",
          description: translations.fr.description != null ? String(translations.fr.description) : "",
        } : { pageName: "", description: "" },
        ar: (translations && translations.ar) ? {
          pageName: translations.ar.pageName != null ? String(translations.ar.pageName) : "",
          description: translations.ar.description != null ? String(translations.ar.description) : "",
        } : { pageName: "", description: "" },
      },
    });
    await pageContent.save();

    const lang = req.query.lang;
    const payload = lang ? resolveContentForLang(pageContent, lang) : pageContent;
    res.status(201).json(payload);
  } catch (err) {
    console.error("❌ Error creating page content:", err.message);
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors || {}).map((e) => e.message).join(", ");
      return res.status(400).json({ message: message || err.message });
    }
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Un contenu avec ce nom de page existe déjà. Supprimez l’index unique pageName dans MongoDB si vous voulez autoriser les doublons.",
      });
    }
    res.status(500).json({ message: err.message || "Erreur serveur" });
  }
};
// GET ALL
exports.getAllPageContents = async (req, res) => {
  try {
    const contents = await PageContent.find();
    const lang = req.query.lang;
    const payload = lang ? contents.map((c) => resolveContentForLang(c, lang)) : contents;
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET BY ID
exports.getPageContentById = async (req, res) => {
  try {
    const content = await PageContent.findById(req.params.id);
    if (!content) return res.status(404).json({ message: "Page content not found" });
    const lang = req.query.lang;
    const payload = lang ? resolveContentForLang(content, lang) : content;
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET BY PAGE NAME
exports.getPageContentByPageName = async (req, res) => {
  try {
    const content = await PageContent.findOne({ pageName: req.params.pageName });
    if (!content) return res.status(404).json({ message: "Page content not found" });
    const lang = req.query.lang;
    const payload = lang ? resolveContentForLang(content, lang) : content;
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE — accepte aussi translations (objet ou string JSON)
exports.updatePageContent = async (req, res) => {
  try {
    const { description, removeImage, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);

    const updateFields = {};
    if (description !== undefined) updateFields.description = description;

    if (req.file) {
      updateFields.image = req.file.path;
    } else if (removeImage === "true") {
      updateFields.image = "";
    }

    if (translations && typeof translations === "object") {
      if (translations.fr != null) {
        updateFields["translations.fr"] = {
          pageName: String(translations.fr.pageName ?? "").trim(),
          description: translations.fr.description != null ? String(translations.fr.description) : "",
        };
      }
      if (translations.ar != null) {
        updateFields["translations.ar"] = {
          pageName: String(translations.ar.pageName ?? "").trim(),
          description: translations.ar.description != null ? String(translations.ar.description) : "",
        };
      }
    }

    const content = await PageContent.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    if (!content) return res.status(404).json({ message: "Page content not found" });

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(200).json(lang ? resolveContentForLang(content, lang) : content);
  } catch (err) {
    console.error("❌ Error updating page content:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// DELETE
exports.deletePageContent = async (req, res) => {
  try {
    const content = await PageContent.findByIdAndDelete(req.params.id);
    if (!content) return res.status(404).json({ message: "Page content not found" });

    res.status(200).json({ message: "Page content deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
