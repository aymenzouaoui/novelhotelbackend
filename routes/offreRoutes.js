const express = require("express");
const upload = require("../middleware/upload"); // ✅ Your multer config

const router = express.Router();
const {
  createOffre,
  getAllOffres,
  getOffreById,
  updateOffre,
  deleteOffre
} = require("../controllers/offreController");

// Accept multiple field names: "images" (array), "video", "media", "image" for compatibility
const offreUpload = upload.fields([
  { name: "images", maxCount: 10 }, // Multiple images from frontend
  { name: "video", maxCount: 1 },   // Single video from frontend
  { name: "media", maxCount: 1 },   // Backward compatibility
  { name: "image", maxCount: 1 }    // Backward compatibility
]);

router.post("/", offreUpload, createOffre); // ✅ support image or video upload
router.put("/:id", offreUpload, updateOffre); // ✅ update with image or video
router.get("/", getAllOffres);
router.get("/:id", getOffreById);
router.delete("/:id", deleteOffre);

module.exports = router;
