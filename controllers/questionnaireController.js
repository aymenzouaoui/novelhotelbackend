const Questionnaire = require("../models/Questionnaire");

// ✅ Create questionnaire (only once)
exports.createQuestionnaire = async (req, res) => {
  try {
    const existing = await Questionnaire.findOne();
    if (existing) {
      return res.status(400).json({ error: "A questionnaire already exists." });
    }

    const questionnaire = new Questionnaire(req.body);
    const saved = await questionnaire.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get the single questionnaire
exports.getQuestionnaire = async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findOne();
    if (!questionnaire) {
      return res.status(404).json({ error: "Questionnaire not found" });
    }
    res.json(questionnaire);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update questionnaire (title, description, or questions array)
exports.updateQuestionnaire = async (req, res) => {
  try {
    const updated = await Questionnaire.findOneAndUpdate({}, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ error: "Questionnaire not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Add a single question to the existing questionnaire
exports.addQuestion = async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findOne();
    if (!questionnaire) {
      return res.status(404).json({ error: "Questionnaire not found" });
    }

    questionnaire.questions.push(req.body);
    await questionnaire.save();

    res.json(questionnaire);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Delete a question by its questionId
exports.deleteQuestion = async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findOne();
    if (!questionnaire) {
      return res.status(404).json({ error: "Questionnaire not found" });
    }

    questionnaire.questions = questionnaire.questions.filter(
      (q) => q.questionId !== req.params.questionId
    );
    await questionnaire.save();

    res.json(questionnaire);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete entire questionnaire (optional, rarely used)
exports.deleteQuestionnaire = async (req, res) => {
  try {
    await Questionnaire.deleteMany();
    res.json({ message: "Questionnaire deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
