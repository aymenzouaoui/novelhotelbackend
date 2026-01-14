const Event = require("../models/Event");

exports.createEvent = async (req, res) => {
  try {
    console.log("📥 Incoming createEvent");

    console.log("🧾 req.body:", req.body);
    console.log("📸 req.file:", req.file);

    if (!req.file) {
      console.warn("⚠️ Warning: No file received. Image will be blank.");
    }

    const { title, description, date, location, price } = req.body;
    const image = req.file?.path || "";

    const event = new Event({
      title,
      description,
      date,
      location,
      price,
      image,
    });

    console.log("💾 Saving event to DB...");
    await event.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("eventCreated", event);
    } else {
      console.warn("⚠️ No Socket.IO instance found on app");
    }

    console.log("✅ Event created successfully:", event);
    res.status(201).json(event);

  } catch (err) {
    console.error("❌ Error in createEvent:", err);
    res.status(500).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      details: JSON.stringify(err, Object.getOwnPropertyNames(err)),
    });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("participants", "username email");
    res.status(200).json(events);
  } catch (err) {
    console.error("❌ Error in getAllEvents:", err);
    res.status(500).json({
      message: err.message,
      stack: err.stack,
    });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("participants", "username email");
    if (!event) {
      console.warn("⚠️ Event not found with ID:", req.params.id);
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json(event);
  } catch (err) {
    console.error("❌ Error in getEventById:", err);
    res.status(500).json({
      message: err.message,
      stack: err.stack,
    });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    console.log("📥 Incoming updateEvent request for ID:", req.params.id);
    console.log("🧾 req.body:", req.body);
    console.log("📸 req.file:", req.file);

    const { title, description, date, location, price, participants } = req.body;

    const updateFields = {
      title,
      description,
      date,
      location,
      price,
      participants,
    };

    if (req.file) {
      updateFields.image = req.file.path;
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updateFields, { new: true });

    if (!event) {
      console.warn("⚠️ Event not found for update:", req.params.id);
      return res.status(404).json({ message: "Event not found" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("eventUpdated", event);
    }

    console.log("✅ Event updated successfully:", event);
    res.status(200).json(event);

  } catch (err) {
    console.error("❌ Error in updateEvent:", err);
    res.status(500).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
      details: JSON.stringify(err, Object.getOwnPropertyNames(err)),
    });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      console.warn("⚠️ Event not found for deletion:", req.params.id);
      return res.status(404).json({ message: "Event not found" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("eventDeleted", event._id);
    }

    console.log("🗑️ Event deleted:", event._id);
    res.status(200).json({ message: "Event deleted successfully" });

  } catch (err) {
    console.error("❌ Error in deleteEvent:", err);
    res.status(500).json({
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
  }
};
