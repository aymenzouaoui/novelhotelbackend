const express = require("express");
const upload = require("../middleware/upload"); // your multer config
const {
  createPageContent,
  getAllPageContents,
  getPageContentById,
  getPageContentByPageName,
  updatePageContent,
  deletePageContent,
} = require("../controllers/pageContentController");

const router = express.Router();

// CRUD
router.post("/", upload.single("image"), createPageContent);
router.get("/", getAllPageContents);
router.get("/:id", getPageContentById);
router.put("/:id", upload.single("image"), updatePageContent);
router.delete("/:id", deletePageContent);

// Special: GET by pageName
router.get("/page/:pageName", getPageContentByPageName);

module.exports = router;
