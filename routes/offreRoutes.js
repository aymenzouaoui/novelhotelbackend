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

router.post("/", upload.single("media"), createOffre); // ✅ support image or video upload
router.put("/:id", upload.single("media"), updateOffre); // ✅ update with image or video
router.get("/", getAllOffres);
router.get("/:id", getOffreById);
router.delete("/:id", deleteOffre);

module.exports = router;
