const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
  createLoisir,
  getAllLoisirs,
  getLoisirById,
  updateLoisir,
  deleteLoisir
} = require("../controllers/loisirController");

router.post("/", upload.single("image"), createLoisir);
router.get("/", getAllLoisirs);
router.get("/:id", getLoisirById);
router.put("/:id", upload.single("image"), updateLoisir);
router.delete("/:id", deleteLoisir);

module.exports = router;
