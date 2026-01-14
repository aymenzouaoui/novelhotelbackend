const express = require("express");
const upload = require("../middleware/upload");
const router = express.Router();

const {
  createMenu,
  getAllMenus,
  getMenuById,
  updateMenu,
  deleteMenu,
  downloadMenuPDF
} = require("../controllers/menuController");

router.post("/", upload.array("images", 5), createMenu);
router.get("/", getAllMenus);
router.get("/:id", getMenuById);
router.put("/:id", upload.array("images", 5), updateMenu);
router.delete("/:id", deleteMenu);
router.get("/:id/pdf", downloadMenuPDF);

module.exports = router;
