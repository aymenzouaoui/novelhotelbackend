const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionId: {
    type: String, // the _id or unique id of the question
    required: true,
  },
  response: mongoose.Schema.Types.Mixed, // can be string, number, boolean, array, etc.
});

const questionnaireResponseSchema = new mongoose.Schema(
  {
    questionnaireId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Questionnaire",
      required: true,
    },
    responses: [answerSchema], // all answers go here dynamically
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuestionnaireResponse", questionnaireResponseSchema);
