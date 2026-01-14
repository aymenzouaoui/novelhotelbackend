const express = require("express");
const upload = require("../middleware/upload");

const router = express.Router();
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent
} = require("../controllers/eventController");


router.post("/", upload.single("image"), createEvent);
router.put("/:id", upload.single("image"), updateEvent);
router.get("/", getAllEvents);
router.get("/:id", getEventById);
router.delete("/:id", deleteEvent);



router.post("/debug-upload", upload.single("image"), (req, res) => {
  console.log("📥 Reached /debug-upload");
  console.log("🧾 req.body:", req.body);
  console.log("🖼️ req.file:", req.file);

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  res.json({
    message: "Upload successful",
    file: req.file,
  });
});



module.exports = router;
