const express = require("express");
const router = express.Router();
const {
  createPresentation,
  getAllPresentations,
  getPresentationById,
  updatePresentation,
  deletePresentation
} = require("../controllers/presentationController");

const upload = require("../middleware/upload");

router.post("/", upload.single("image"), createPresentation);
router.put("/:id", upload.single("image"), updatePresentation);
router.get("/", getAllPresentations);
router.get("/:id", getPresentationById);
router.delete("/:id", deletePresentation);

module.exports = router;
