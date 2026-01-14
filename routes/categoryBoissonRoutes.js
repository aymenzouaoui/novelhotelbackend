const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload"); // ✅ Add Multer for category

const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require("../controllers/categoryBoissonController");

// Add upload for image
router.post("/", upload.single("image"), createCategory);
router.put("/:id", upload.single("image"), updateCategory);

router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.delete("/:id", deleteCategory);

module.exports = router;
