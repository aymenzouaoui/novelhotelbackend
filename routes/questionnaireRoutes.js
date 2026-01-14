const express = require("express");
const router = express.Router();
const questionnaireController = require("../controllers/questionnaireController");

// Main routes
router.post("/", questionnaireController.createQuestionnaire);
router.get("/", questionnaireController.getQuestionnaire);
router.put("/", questionnaireController.updateQuestionnaire);
router.delete("/", questionnaireController.deleteQuestionnaire);

// Manage individual questions
router.post("/question", questionnaireController.addQuestion);
router.delete("/question/:questionId", questionnaireController.deleteQuestion);

module.exports = router;
