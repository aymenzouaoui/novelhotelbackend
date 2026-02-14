const Menu = require("../models/Menu");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

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

function resolveMenuForLang(menu, lang) {
  if (!menu || !lang || !SUPPORTED_LANGS.includes(lang)) return menu;
  const doc = menu.toObject ? menu.toObject() : { ...menu };
  const t = doc.translations && doc.translations[lang];
  if (t && t.title && String(t.title).trim()) doc.title = t.title;
  if (doc.items && Array.isArray(doc.items)) {
    doc.items = doc.items.map((item) => {
      const it = { ...item };
      const itemT = item.translations && item.translations[lang];
      if (itemT) {
        if (itemT.name && String(itemT.name).trim()) it.name = itemT.name;
        if (itemT.description != null && String(itemT.description) !== "") it.description = itemT.description;
      }
      return it;
    });
  }
  return doc;
}

exports.createMenu = async (req, res) => {
  try {
    const { title, items, restaurant, roomService, skyLounge, order, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);

    let parsedItems = [];
    if (items) {
      try {
        parsedItems = JSON.parse(items);
      } catch (parseErr) {
        console.error("❌ Failed to parse items:", parseErr.message);
      }
    }

    const images = req.files ? req.files.map(file => file.path) : [];
    const orderNum = typeof order === "number" && !isNaN(order) ? order : (typeof order === "string" && order !== "" && !isNaN(Number(order)) ? Number(order) : 0);

    const menu = new Menu({
      title,
      items: parsedItems,
      images,
      restaurant,
      roomService,
      skyLounge,
      order: orderNum,
      translations: {
        fr: (translations && translations.fr) ? { title: String(translations.fr.title ?? "").trim() } : { title: "" },
        ar: (translations && translations.ar) ? { title: String(translations.ar.title ?? "").trim() } : { title: "" },
      },
    });

    await menu.save();

    const io = req.app.get("io");
    io.emit("menuCreated", menu);

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(201).json(lang ? resolveMenuForLang(menu, lang) : menu);
  } catch (err) {
    console.error("❌ Menu creation error:", err.message);
    res.status(500).json({ message: err.message });
  }
};



exports.getAllMenus = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const menus = await Menu.find().populate("restaurant", "name").sort({ order: 1 });
    const payload = lang ? menus.map((m) => resolveMenuForLang(m, lang)) : menus;
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMenuById = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const menu = await Menu.findById(req.params.id).populate("restaurant", "name");
    if (!menu) return res.status(404).json({ message: "Menu not found" });
    res.status(200).json(lang ? resolveMenuForLang(menu, lang) : menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    const { title, items, restaurant, roomService, skyLounge, existingImages, order, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);
    const parsedItems = items ? JSON.parse(items) : [];
    const orderNum = typeof order === "number" && !isNaN(order) ? order : (typeof order === "string" && order !== "" && !isNaN(Number(order)) ? Number(order) : undefined);

    const currentMenu = await Menu.findById(req.params.id);
    if (!currentMenu) return res.status(404).json({ message: "Menu not found" });

    let finalImages = [];
    if (existingImages) {
      try {
        finalImages = [...JSON.parse(existingImages)];
      } catch {
        finalImages = [];
      }
    }
    if (req.files && req.files.length > 0) {
      finalImages = [...finalImages, ...req.files.map(file => file.path)];
    }

    const updateFields = {
      title,
      items: parsedItems,
      restaurant,
      roomService,
      skyLounge,
      images: finalImages,
    };
    if (orderNum !== undefined) updateFields.order = orderNum;
    if (translations && typeof translations === "object") {
      if (translations.fr != null) updateFields["translations.fr"] = { title: String(translations.fr.title ?? "").trim() };
      if (translations.ar != null) updateFields["translations.ar"] = { title: String(translations.ar.title ?? "").trim() };
    }

    const menu = await Menu.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });

    const io = req.app.get("io");
    io.emit("menuUpdated", menu);

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(200).json(lang ? resolveMenuForLang(menu, lang) : menu);
  } catch (err) {
    console.error("❌ Menu update error:", err.message);
    res.status(500).json({ message: err.message });
  }
};


exports.deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findByIdAndDelete(req.params.id);
    if (!menu) return res.status(404).json({ message: "Menu not found" });

    const io = req.app.get("io");
    io.emit("menuDeleted", menu._id);

    res.status(200).json({ message: "Menu deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📄 PDF generation remains unchanged
exports.downloadMenuPDF = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) return res.status(404).json({ message: "Menu not found" });

    const doc = new PDFDocument();
    const filePath = path.join(__dirname, `../pdfs/menu_${menu._id}.pdf`);

    doc.pipe(fs.createWriteStream(filePath));
    doc.fontSize(20).text(menu.title, { align: "center" }).moveDown();

    (menu.items || []).forEach(item => {
      doc
        .fontSize(14)
        .text(`${item.name} - $${item.price.toFixed(2)}`)
        .fontSize(12)
        .text(item.description)
        .moveDown();
    });

    doc.end();

    doc.on("finish", () => {
      res.download(filePath, `${menu.title}.pdf`, () => {
        fs.unlinkSync(filePath);
      });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
