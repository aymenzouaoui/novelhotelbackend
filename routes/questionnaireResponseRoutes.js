const express = require("express");
const router = express.Router();
const responseController = require("../controllers/questionnaireResponseController");

// Client submits a new response
router.post("/", responseController.createResponse);

// Admin gets all responses
router.get("/", responseController.getAllResponses);

// Admin gets all responses for a specific questionnaire
router.get("/questionnaire/:questionnaireId", responseController.getResponsesByQuestionnaire);

// Get single response by ID
router.get("/:id", responseController.getResponseById);

// Delete a specific response
router.delete("/:id", responseController.deleteResponse);

module.exports = router;
