const Notification = require("../models/notification")
// GET all notifications
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }); // Most recent first
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// DELETE a notification by ID
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNotification = await Notification.findByIdAndDelete(id);

    if (!deletedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
