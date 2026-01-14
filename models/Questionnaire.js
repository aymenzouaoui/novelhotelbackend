const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionId: { 
    type: String, 
    required: true 
  }, // Unique ID for matching responses
  questionText: { 
    type: String, 
    required: true 
  },
  responseType: { 
    type: String, 
    enum: ["boolean", "text", "number", "rating", "multiple_choice"],
    required: true 
  },
  options: [String], // only used if responseType = "multiple_choice"
  category: { 
    type: String 
  }, // optional (ex: "Chambre", "Petit-déjeuner")
  required: { 
    type: Boolean, 
    default: false 
  },
  order: { 
    type: Number 
  } // optional, helps frontend display order
});

const questionnaireSchema = new mongoose.Schema({
  title: { 
    type: String, 
    default: "Questionnaire de satisfaction client" 
  },
  description: { 
    type: String 
  },
  questions: [questionSchema], // dynamic list of questions
}, { timestamps: true });

module.exports = mongoose.model("Questionnaire", questionnaireSchema);
