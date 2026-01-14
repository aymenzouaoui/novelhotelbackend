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

router.post("/", upload.single("image"), createOffre); // ✅ support file upload
router.put("/:id", upload.single("image"), updateOffre); // ✅ update with image
router.get("/", getAllOffres);
router.get("/:id", getOffreById);
router.delete("/:id", deleteOffre);

module.exports = router;
