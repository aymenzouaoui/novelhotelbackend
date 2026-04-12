const express = require("express");
const { BetaAnalyticsDataClient } = require("@google-analytics/data");
require("dotenv").config();
const router = express.Router();

const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: "./ga-key.json", // Assurez-vous que ce fichier est à la racine du serveur
});

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

// 1) Vues temps réel / historiques
router.get("/views", async (req, res) => {
  try {
    try {
      const [realtimeResponse] = await analyticsDataClient.runRealtimeReport({
        property: `properties/${PROPERTY_ID}`,
        metrics: [{ name: "screenPageViews" }],
      });
      if (realtimeResponse?.rows?.length) {
        const views = realtimeResponse.rows.reduce((sum, row) => sum + parseInt(row.metricValues[0].value, 10), 0);
        if (views > 0) return res.json({ views, source: "realtime" });
      }
    } catch (e) { console.warn("Realtime failed, falling back..."); }

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [{ name: "screenPageViews" }],
    });
    res.json({ views: parseInt(response.rows?.[0]?.metricValues?.[0]?.value || 0), source: "historical" });
  } catch (error) { res.status(500).json({ error: "Failed to fetch views" }); }
});

// 2) Résumé des métriques (Sessions, Utilisateurs)
router.get("/summary", async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [{ name: "screenPageViews" }, { name: "sessions" }, { name: "activeUsers" }],
    });
    const row = response.rows?.[0]?.metricValues;
    res.json({ data: { screenPageViews: parseInt(row?.[0]?.value || 0), sessions: parseInt(row?.[1]?.value || 0), activeUsers: parseInt(row?.[2]?.value || 0) } });
  } catch (error) { res.status(500).json({ error: "Failed to fetch summary" }); }
});

// 3) Rapport journalier (7 jours)
router.get("/reports/daily", async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [{ name: "screenPageViews" }, { name: "sessions" }],
      dimensions: [{ name: "dayOfWeek" }],
      orderBys: [{ dimension: { dimensionName: "dayOfWeek" } }],
    });
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    res.json({ data: response.rows.map(row => ({ day: days[parseInt(row.dimensionValues[0].value)], views: parseInt(row.metricValues[0].value), sessions: parseInt(row.metricValues[1].value) })) });
  } catch (error) { res.status(500).json({ error: "Failed to fetch daily reports" }); }
});

// 4) Pages populaires
router.get("/reports/pages", async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [{ name: "screenPageViews" }],
      dimensions: [{ name: "pageTitle" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, descending: true }],
      limit: 5,
    });
    res.json({ data: response.rows.map(row => ({ title: row.dimensionValues[0].value.split("|")[0].trim(), views: parseInt(row.metricValues[0].value) })) });
  } catch (error) { res.status(500).json({ error: "Failed to fetch page reports" }); }
});

// 5) Appareils & Sources
router.get("/reports/devices", async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [{ name: "sessions" }],
      dimensions: [{ name: "deviceCategory" }],
    });
    res.json({ data: response.rows.map(row => ({ device: row.dimensionValues[0].value, sessions: parseInt(row.metricValues[0].value) })) });
  } catch (error) { res.status(500).json({ error: "Failed to fetch device reports" }); }
});

router.get("/reports/traffic", async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [{ name: "sessions" }],
      dimensions: [{ name: "sessionSource" }],
      limit: 5,
    });
    res.json({ data: response.rows.map(row => ({ source: row.dimensionValues[0].value, sessions: parseInt(row.metricValues[0].value) })) });
  } catch (error) { res.status(500).json({ error: "Failed to fetch traffic reports" }); }
});

// 6) Conversion & Engagement
router.get("/reports/conversion", async (req, res) => {
  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [{ name: "activeUsers" }, { name: "engagedSessions" }],
    });
    const users = parseInt(response.rows?.[0]?.metricValues?.[0]?.value || 0);
    const engaged = parseInt(response.rows?.[0]?.metricValues?.[1]?.value || 0);
    res.json({ data: { engagementRate: users > 0 ? ((engaged / users) * 100).toFixed(1) + "%" : "0%" } });
  } catch (error) { res.status(500).json({ error: "Failed to fetch conversion data" }); }
});

module.exports = router;