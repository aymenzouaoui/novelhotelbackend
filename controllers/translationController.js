const translationService = require("../services/translationService");

/**
 * POST /api/translate
 * Body: { text, source_lang?, target_lang? }
 */
exports.translate = async (req, res) => {
  try {
    const { text, source_lang: sourceLang, target_lang: targetLang } = req.body;
    const result = await translationService.translate(text, sourceLang, targetLang);
    return res.json(result);
  } catch (err) {
    const status = err.message.includes("503") ? 503 : err.message.includes("required") ? 400 : 500;
    return res.status(status).json({ message: err.message });
  }
};

/**
 * GET /api/translate/health
 * Vérifie que le microservice Python est disponible.
 */
exports.health = async (req, res) => {
  try {
    const data = await translationService.health();
    return res.json(data);
  } catch (err) {
    return res.status(503).json({ status: "unavailable", message: err.message });
  }
};
