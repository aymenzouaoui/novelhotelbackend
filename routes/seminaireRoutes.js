const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
  createSeminaire,
  getAllSeminaires,
  getSeminaireById,
  updateSeminaire,
  deleteSeminaire
} = require("../controllers/seminaireController");

// Handle two files: image (for image) and fiche (for pdf)
const seminaireUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "fiche", maxCount: 1 }
]);

router.post("/", seminaireUpload, createSeminaire);
router.get("/", getAllSeminaires);
router.get("/:id", getSeminaireById);
router.put("/:id", seminaireUpload, updateSeminaire);
router.delete("/:id", deleteSeminaire);

module.exports = router;
