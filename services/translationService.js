/**
 * Client pour le microservice de traduction Python (NLLB-200).
 * Utilise TRANSLATION_SERVICE_URL du .env (ex: http://127.0.0.1:8000).
 */
const TRANSLATION_SERVICE_URL = process.env.TRANSLATION_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * Traduit un texte via le microservice Python.
 * @param {string} text - Texte à traduire
 * @param {string} [sourceLang='en'] - Code langue source (en, fr, ar, etc.)
 * @param {string} [targetLang='fr'] - Code langue cible
 * @returns {Promise<{ translated_text: string, source_lang: string, target_lang: string }>}
 */
async function translate(text, sourceLang = "en", targetLang = "fr") {
  if (!text || typeof text !== "string" || !text.trim()) {
    throw new Error("Texte à traduire requis");
  }
  const url = `${TRANSLATION_SERVICE_URL.replace(/\/$/, "")}/translate`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: text.trim(),
      source_lang: sourceLang || "en",
      target_lang: targetLang || "fr",
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    let detail = errBody;
    try {
      const j = JSON.parse(errBody);
      detail = j.detail || errBody;
    } catch (_) {}
    throw new Error(`Service traduction (${res.status}): ${detail}`);
  }
  return res.json();
}

/**
 * Vérifie que le microservice de traduction est disponible.
 * @returns {Promise<{ status: string, model?: string, device?: string }>}
 */
async function health() {
  const url = `${TRANSLATION_SERVICE_URL.replace(/\/$/, "")}/health`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Service traduction (${res.status})`);
  return res.json();
}

module.exports = { translate, health, TRANSLATION_SERVICE_URL };
