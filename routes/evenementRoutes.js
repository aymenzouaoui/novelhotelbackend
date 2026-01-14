const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
  createEvenement,
  getAllEvenements,
  getEvenementById,
  updateEvenement,
  deleteEvenement
} = require("../controllers/evenementController");

router.post("/", upload.single("image"), createEvenement);
router.get("/", getAllEvenements);
router.get("/:id", getEvenementById);
router.put("/:id", upload.single("image"), updateEvenement);
router.delete("/:id", deleteEvenement);

module.exports = router;
