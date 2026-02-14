const SkyLounge = require("../models/SkyLounge");

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

function resolveSkyLoungeForLang(skyLounge, lang) {
  if (!skyLounge || !lang || !SUPPORTED_LANGS.includes(lang)) return skyLounge;
  const doc = skyLounge.toObject ? skyLounge.toObject() : { ...skyLounge };
  const t = doc.translations && doc.translations[lang];
  if (!t) return doc;
  return {
    ...doc,
    name: (t.name && String(t.name).trim()) ? t.name : doc.name,
    description: (t.description != null && String(t.description) !== "") ? t.description : doc.description,
  };
}

exports.createSkyLounge = async (req, res) => {
  try {
    const { name, description, reservable, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);
    const image = req.file ? req.file.path : "";

    const skyLounge = new SkyLounge({
      name,
      description,
      image,
      reservable: reservable !== undefined ? reservable : true,
      translations: {
        fr: (translations && translations.fr)
          ? { name: String(translations.fr.name ?? "").trim(), description: translations.fr.description != null ? String(translations.fr.description) : "" }
          : { name: "", description: "" },
        ar: (translations && translations.ar)
          ? { name: String(translations.ar.name ?? "").trim(), description: translations.ar.description != null ? String(translations.ar.description) : "" }
          : { name: "", description: "" },
      },
    });
    await skyLounge.save();

    const io = req.app.get("io");
    io.emit("skyLoungeCreated", skyLounge);

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(201).json(lang ? resolveSkyLoungeForLang(skyLounge, lang) : skyLounge);
  } catch (err) {
    console.error("❌ Error creating Sky Lounge:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllSkyLounges = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const skyLounges = await SkyLounge.find().populate("menus");
    const payload = lang ? skyLounges.map((s) => resolveSkyLoungeForLang(s, lang)) : skyLounges;
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSkyLoungeById = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const skyLounge = await SkyLounge.findById(req.params.id).populate("menus");
    if (!skyLounge) return res.status(404).json({ message: "Sky Lounge not found" });
    res.status(200).json(lang ? resolveSkyLoungeForLang(skyLounge, lang) : skyLounge);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSkyLounge = async (req, res) => {
  try {
    const { name, description, reservable, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);
    const updateFields = { name, description };

    if (req.file) updateFields.image = req.file.path;
    if (reservable !== undefined) updateFields.reservable = reservable;
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

    const skyLounge = await SkyLounge.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });
    if (!skyLounge) return res.status(404).json({ message: "Sky Lounge not found" });

    const io = req.app.get("io");
    io.emit("skyLoungeUpdated", skyLounge);

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(200).json(lang ? resolveSkyLoungeForLang(skyLounge, lang) : skyLounge);
  } catch (err) {
    console.error("❌ Error updating Sky Lounge:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteSkyLounge = async (req, res) => {
  try {
    const skyLounge = await SkyLounge.findByIdAndDelete(req.params.id);
    if (!skyLounge) return res.status(404).json({ message: "Sky Lounge not found" });

    const io = req.app.get("io");
    io.emit("skyLoungeDeleted", skyLounge._id);

    res.status(200).json({ message: "Sky Lounge deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addMenuToSkyLounge = async (req, res) => {
  try {
    const { menuId } = req.body;

    const skyLounge = await SkyLounge.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { menus: menuId } },
      { new: true }
    ).populate("menus");

    if (!skyLounge) return res.status(404).json({ message: "Sky Lounge not found" });

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(200).json(lang ? resolveSkyLoungeForLang(skyLounge, lang) : skyLounge);
  } catch (err) {
    console.error("❌ Error adding menu to Sky Lounge:", err.message);
    res.status(500).json({ message: err.message });
  }
};
