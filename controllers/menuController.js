const Menu = require("../models/Menu");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function sortItemsByOrder(menu) {
  if (!menu || !menu.items || !menu.items.length) return menu;
  const sorted = [...menu.items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return { ...menu.toObject ? menu.toObject() : menu, items: sorted };
}

exports.createMenu = async (req, res) => {
  try {
    // Log the full request body
    console.log("📥 Incoming request body:", req.body);

    // Log the uploaded files, if any
    if (req.files) {
      console.log("📁 Uploaded files:", req.files);
    } else {
      console.log("📁 No files uploaded");
    }

    const { title, items, restaurant, roomService, skyLounge } = req.body;

    // Parse items if sent as JSON string
    let parsedItems = [];
    if (items) {
      try {
        parsedItems = JSON.parse(items);
        console.log("✅ Parsed items:", parsedItems);
      } catch (parseErr) {
        console.error("❌ Failed to parse items:", parseErr.message);
      }
    }

    // Map uploaded images to file paths
    const images = req.files ? req.files.map(file => file.path) : [];
    console.log("🖼 Images paths:", images);

    const menu = new Menu({
      title,
      items: parsedItems,
      images,
      restaurant,
      roomService,
      skyLounge
    });

    await menu.save();

    const io = req.app.get("io");
    io.emit("menuCreated", menu);

    console.log("🎉 Menu saved successfully:", menu);

    res.status(201).json(sortItemsByOrder(menu));
  } catch (err) {
    console.error("❌ Menu creation error:", err.message);
    res.status(500).json({ message: err.message });
  }
};



exports.getAllMenus = async (req, res) => {
  try {
    const menus = await Menu.find().populate("restaurant", "name");
    const sorted = menus.map((m) => sortItemsByOrder(m));
    res.status(200).json(sorted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMenuById = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id).populate("restaurant", "name");
    if (!menu) return res.status(404).json({ message: "Menu not found" });
    res.status(200).json(sortItemsByOrder(menu));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    const { title, items, restaurant, roomService, skyLounge, existingImages } = req.body;
    const parsedItems = items ? JSON.parse(items) : [];
    
    console.log("📥 Update Menu Request - existingImages:", existingImages);
    console.log("📥 Update Menu Request - files:", req.files ? req.files.length : 0);

    // First get the current menu (for validation only)
    const currentMenu = await Menu.findById(req.params.id);
    if (!currentMenu) return res.status(404).json({ message: "Menu not found" });

    let finalImages = [];

    // Handle existing images - use ONLY what frontend sends, don't fall back to database
    if (existingImages) {
      try {
        const parsedExistingImages = JSON.parse(existingImages);
        finalImages = [...parsedExistingImages];
        console.log("✅ Using existingImages from frontend:", parsedExistingImages.length);
      } catch (parseErr) {
        console.error("❌ Failed to parse existingImages:", parseErr.message);
        // If parsing fails, use empty array instead of database images
        finalImages = [];
      }
    } else {
      // If no existingImages sent, use empty array (images were removed)
      finalImages = [];
    }

    // Add new images if any were uploaded
    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map(file => file.path);
      finalImages = [...finalImages, ...newImagePaths];
      console.log("✅ Adding new images:", newImagePaths.length);
    }

    console.log("✅ Final images array:", finalImages);

    const updateFields = {
      title,
      items: parsedItems,
      restaurant,
      roomService,
      skyLounge,
      images: finalImages
    };

    const menu = await Menu.findByIdAndUpdate(req.params.id, updateFields, { new: true });

    const io = req.app.get("io");
    io.emit("menuUpdated", menu);

    res.status(200).json(sortItemsByOrder(menu));
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

    const sortedItems = [...(menu.items || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    sortedItems.forEach(item => {
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
