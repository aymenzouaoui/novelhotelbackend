const RoomService = require("../models/RoomService");

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

function resolveRoomServiceForLang(roomService, lang) {
  if (!roomService || !lang || !SUPPORTED_LANGS.includes(lang)) return roomService;
  const doc = roomService.toObject ? roomService.toObject() : { ...roomService };
  const t = doc.translations && doc.translations[lang];
  if (!t) return doc;
  return {
    ...doc,
    name: (t.name && String(t.name).trim()) ? t.name : doc.name,
    description: (t.description != null && String(t.description) !== "") ? t.description : doc.description,
  };
}

exports.createRoomService = async (req, res) => {
  try {
    const { name, description, menus = [], translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);

    const roomService = new RoomService({
      name,
      description,
      menus,
      translations: {
        fr: (translations && translations.fr)
          ? { name: String(translations.fr.name ?? "").trim(), description: translations.fr.description != null ? String(translations.fr.description) : "" }
          : { name: "", description: "" },
        ar: (translations && translations.ar)
          ? { name: String(translations.ar.name ?? "").trim(), description: translations.ar.description != null ? String(translations.ar.description) : "" }
          : { name: "", description: "" },
      },
    });
    await roomService.save();

    const io = req.app.get("io");
    io.emit("roomServiceCreated", roomService);

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(201).json(lang ? resolveRoomServiceForLang(roomService, lang) : roomService);
  } catch (err) {
    console.error("❌ Error creating Room Service:", err.message);
    res.status(500).json({ message: err.message });
  }
};


exports.getAllRoomServices = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const services = await RoomService.find().populate("menus");
    const payload = lang ? services.map((s) => resolveRoomServiceForLang(s, lang)) : services;
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRoomServiceById = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const service = await RoomService.findById(req.params.id).populate("menus");
    if (!service) return res.status(404).json({ message: "Room Service not found" });
    res.status(200).json(lang ? resolveRoomServiceForLang(service, lang) : service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRoomService = async (req, res) => {
  try {
    const { name, description, menus, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);
    const updateFields = { name, description };

    if (menus) {
      updateFields.menus = menus;
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

    const service = await RoomService.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).populate("menus");

    if (!service) return res.status(404).json({ message: "Room Service not found" });

    const io = req.app.get("io");
    io.emit("roomServiceUpdated", service);

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(200).json(lang ? resolveRoomServiceForLang(service, lang) : service);
  } catch (err) {
    console.error("❌ Error updating Room Service:", err.message);
    res.status(500).json({ message: err.message });
  }
};


exports.deleteRoomService = async (req, res) => {
  try {
    const service = await RoomService.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: "Room Service not found" });

    const io = req.app.get("io");
    io.emit("roomServiceDeleted", service._id);

    res.status(200).json({ message: "Room Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// PUT /room-services/:id/add-menu
exports.addMenuToRoomService = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const { menuId } = req.body;
    const service = await RoomService.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { menus: menuId } },
      { new: true }
    ).populate("menus");

    if (!service) return res.status(404).json({ message: "Room Service not found" });

    res.status(200).json(lang ? resolveRoomServiceForLang(service, lang) : service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
