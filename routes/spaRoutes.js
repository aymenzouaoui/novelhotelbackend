const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
  createSpa,
  getAllSpas,
  getSpaById,
  updateSpa,
  deleteSpa,
  toggleSpaReservable
} = require("../controllers/spaController");

// ✅ Create a Spa (categories only)
router.post("/",upload.array("images", 20), createSpa);

// ✅ Get all Spas
router.get("/", getAllSpas);

// ✅ Get Spa by ID
router.get("/:id", getSpaById);

// ✅ Update Spa (replace categories)
router.put("/:id", upload.array("images", 20), updateSpa);

// ✅ Delete Spa
router.delete("/:id", deleteSpa);





module.exports = router;
