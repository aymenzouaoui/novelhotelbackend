const express = require("express");
const upload = require("../middleware/upload"); // 👈 import your existing multer config

const router = express.Router();
const {
  createBoisson,
  getAllBoissons,
  getBoissonById,
  updateBoisson,
  deleteBoisson,
} = require("../controllers/boissonController");

// 🧠 Apply upload middleware to support image uploads
router.post("/", upload.single("image"), createBoisson);
router.put("/:id", upload.single("image"), updateBoisson);

router.get("/", getAllBoissons);
router.get("/:id", getBoissonById);
router.delete("/:id", deleteBoisson);

module.exports = router;
