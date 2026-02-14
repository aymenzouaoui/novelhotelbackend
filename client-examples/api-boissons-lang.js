/**
 * Client API pour afficher boissons et catégories selon la langue sélectionnée.
 * À utiliser dans votre frontend (React, Vue, vanilla JS).
 *
 * Backend attend : ?lang=fr | ?lang=ar (sans lang = langue par défaut)
 */

const SUPPORTED_LANGS = ["fr", "ar"];

/**
 * Retourne le paramètre lang à envoyer à l'API (fr, ar ou null pour défaut).
 * @param {string} locale - Valeur du sélecteur (ex: "fr", "ar", "en")
 * @returns {string|null} "fr" | "ar" | null
 */
export function getApiLang(locale) {
  if (!locale) return null;
  const l = String(locale).toLowerCase();
  return SUPPORTED_LANGS.includes(l) ? l : null;
}

/**
 * Récupère les catégories de boissons selon la langue.
 * @param {string} apiBaseUrl - Ex: "https://api.novotel-tunis.com" ou "" si même origine
 * @param {string} [locale] - "fr" | "ar" | "en" (en = pas de traduction)
 * @returns {Promise<Array>}
 */
export async function getCategoriesBoisson(apiBaseUrl = "", locale) {
  const lang = getApiLang(locale);
  const url = lang
    ? `${apiBaseUrl}/api/categories-boisson?lang=${lang}`
    : `${apiBaseUrl}/api/categories-boisson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Categories: ${res.status}`);
  return res.json();
}

/**
 * Récupère les boissons selon la langue (avec catégorie peuplée).
 * @param {string} apiBaseUrl - Ex: "https://api.novotel-tunis.com" ou "" si même origine
 * @param {string} [locale] - "fr" | "ar" | "en"
 * @returns {Promise<Array>}
 */
export async function getBoissons(apiBaseUrl = "", locale) {
  const lang = getApiLang(locale);
  const url = lang
    ? `${apiBaseUrl}/api/boissons?lang=${lang}`
    : `${apiBaseUrl}/api/boissons`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Boissons: ${res.status}`);
  return res.json();
}
