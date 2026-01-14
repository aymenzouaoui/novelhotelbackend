const SkyLounge = require("../models/SkyLounge");

exports.createSkyLounge = async (req, res) => {
  try {
    const { name, description, reservable } = req.body;
    const image = req.file ? req.file.path : "";

    const skyLounge = new SkyLounge({ 
      name, 
      description, 
      image, 
      reservable: reservable !== undefined ? reservable : true
    });
    await skyLounge.save();

    const io = req.app.get("io");
    io.emit("skyLoungeCreated", skyLounge);

    res.status(201).json(skyLounge);
  } catch (err) {
    console.error("❌ Error creating Sky Lounge:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllSkyLounges = async (req, res) => {
  try {
    const skyLounges = await SkyLounge.find().populate("menus");
    res.status(200).json(skyLounges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSkyLoungeById = async (req, res) => {
  try {
    const skyLounge = await SkyLounge.findById(req.params.id).populate("menus");
    if (!skyLounge) return res.status(404).json({ message: "Sky Lounge not found" });
    res.status(200).json(skyLounge);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSkyLounge = async (req, res) => {
  try {
    const { name, description, reservable } = req.body;
    const updateFields = { name, description };

    if (req.file) updateFields.image = req.file.path;
    if (reservable !== undefined) updateFields.reservable = reservable;

    const skyLounge = await SkyLounge.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!skyLounge) return res.status(404).json({ message: "Sky Lounge not found" });

    const io = req.app.get("io");
    io.emit("skyLoungeUpdated", skyLounge);

    res.status(200).json(skyLounge);
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

    res.status(200).json(skyLounge);
  } catch (err) {
    console.error("❌ Error adding menu to Sky Lounge:", err.message);
    res.status(500).json({ message: err.message });
  }
};
