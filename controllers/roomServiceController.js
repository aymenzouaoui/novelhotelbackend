const RoomService = require("../models/RoomService");

exports.createRoomService = async (req, res) => {
  try {
    const { name, description, menus = [] } = req.body;

    const roomService = new RoomService({ name, description, menus });
    await roomService.save();

    const io = req.app.get("io");
    io.emit("roomServiceCreated", roomService);

    res.status(201).json(roomService);
  } catch (err) {
    console.error("❌ Error creating Room Service:", err.message);
    res.status(500).json({ message: err.message });
  }
};


exports.getAllRoomServices = async (req, res) => {
  try {
    const services = await RoomService.find().populate("menus");
    res.status(200).json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRoomServiceById = async (req, res) => {
  try {
    const service = await RoomService.findById(req.params.id).populate("menus");
    if (!service) return res.status(404).json({ message: "Room Service not found" });
    res.status(200).json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRoomService = async (req, res) => {
  try {
    const { name, description, menus } = req.body;

    const updateFields = { name, description };
    if (menus) {
      updateFields.menus = menus;
    }

    const service = await RoomService.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).populate("menus");

    if (!service) return res.status(404).json({ message: "Room Service not found" });

    const io = req.app.get("io");
    io.emit("roomServiceUpdated", service);

    res.status(200).json(service);
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
    const { menuId } = req.body;
    const service = await RoomService.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { menus: menuId } },
      { new: true }
    ).populate("menus");

    if (!service) return res.status(404).json({ message: "Room Service not found" });

    res.status(200).json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
