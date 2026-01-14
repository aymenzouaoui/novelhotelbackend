const express = require("express");
const router = express.Router();
const skipCleanController = require("../controllers/skipCleanController");

// CRUD routes
router.post("/", skipCleanController.createSkipClean);
router.get("/", skipCleanController.getAllSkipCleans);
router.get("/:id", skipCleanController.getSkipCleanById);
router.put("/:id", skipCleanController.updateSkipClean);
router.delete("/:id", skipCleanController.deleteSkipClean);

module.exports = router;
