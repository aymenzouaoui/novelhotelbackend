const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
  createSkyLounge,
  getAllSkyLounges,
  getSkyLoungeById,
  updateSkyLounge,
  deleteSkyLounge,
  addMenuToSkyLounge // ✅ Add this import
} = require("../controllers/skyLoungeController");

router.post("/", upload.single("image"), createSkyLounge);
router.get("/", getAllSkyLounges);
router.get("/:id", getSkyLoungeById);
router.put("/:id", upload.single("image"), updateSkyLounge);
router.delete("/:id", deleteSkyLounge);

// ✅ New route to link a menu to a Sky Lounge
router.put("/:id/add-menu", addMenuToSkyLounge);

module.exports = router;
