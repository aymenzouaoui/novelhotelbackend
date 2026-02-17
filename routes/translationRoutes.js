const express = require("express");
const router = express.Router();
const translationController = require("../controllers/translationController");

router.get("/health", translationController.health);
router.post("/", translationController.translate);

module.exports = router;
