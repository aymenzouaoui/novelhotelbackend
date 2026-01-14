const QuestionnaireResponse = require("../models/QuestionnaireResponse");
const Questionnaire = require("../models/Questionnaire");
const User = require("../models/User");
const Notification = require("../models/notification");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true,
  debug: true,
});

async function sendQuestionnaireNotification(response, questionnaire) {
  try {
    // Find all admins and users with role 'questionnaire'
    const users = await User.find({
      $or: [
        { role: { $elemMatch: { $in: ["admin"] } } },
        { role: { $elemMatch: { $in: ["questionnaire"] } } },
      ],
    });

    if (!users || users.length === 0) return;

    const emails = users.map((u) => u.email);

    const description = `Nouvelle réponse au questionnaire "${questionnaire.title}" a été soumise.`;

    // Save notification
    const notification = new Notification({
      description,
      service: "questionnaire",
    });
    await notification.save();

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emails,
      subject: "Nouvelle réponse au questionnaire",
      text: `Bonjour,\n\nUne nouvelle réponse a été soumise au questionnaire "${questionnaire.title}".\n\nMerci.\nL'équipe.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erreur d'envoi d'email :", error);
      } else {
        console.log("Email envoyé aux responsables :", info.response);
      }
    });
  } catch (err) {
    console.error("Erreur lors de l'envoi des notifications questionnaire :", err.message);
  }
}
// ✅ Create a new response (client submits answers)
exports.createResponse = async (req, res) => {
  try {
    const { questionnaireId, responses } = req.body;

    // optional check: ensure questionnaire exists
    const questionnaire = await Questionnaire.findById(questionnaireId);
    if (!questionnaire) {
      return res.status(404).json({ error: "Questionnaire not found" });
    }

    const newResponse = new QuestionnaireResponse({
      questionnaireId,
      responses,
    });

    const savedResponse = await newResponse.save();
        // ✅ Send notification and email to admins/questionnaire users
    await sendQuestionnaireNotification(savedResponse, questionnaire);
    res.status(201).json(savedResponse);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get all responses (admin can view all)
exports.getAllResponses = async (req, res) => {
  try {
    const responses = await QuestionnaireResponse.find()
      .populate("questionnaireId", "title description");
    res.json(responses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all responses for a specific questionnaire
exports.getResponsesByQuestionnaire = async (req, res) => {
  try {
    const { questionnaireId } = req.params;
    const responses = await QuestionnaireResponse.find({ questionnaireId });
    res.json(responses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get a single response by ID
exports.getResponseById = async (req, res) => {
  try {
    const response = await QuestionnaireResponse.findById(req.params.id)
      .populate("questionnaireId", "title");
    if (!response) {
      return res.status(404).json({ error: "Response not found" });
    }
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete a response
exports.deleteResponse = async (req, res) => {
  try {
    const deleted = await QuestionnaireResponse.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Response not found" });
    }
    res.json({ message: "Response deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
