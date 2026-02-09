const express = require("express");
const { BetaAnalyticsDataClient } = require("@google-analytics/data");
require("dotenv").config();

const router = express.Router();
/*
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
});
*/
const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: "./ga-key.json", // chemin vers ton fichier JSON
});

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

router.get("/views", async (req, res) => {
  console.log("📊 GA /views API called");
  console.log("Using GA4 Property ID:", PROPERTY_ID);

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [{ name: "screenPageViews" }],
      dimensions: [{ name: "pagePath" }],
    });

    console.log("✅ GA API response received");

    if (!response.rows || response.rows.length === 0) {
      console.warn("⚠️ GA response has no rows");
    } else {
      console.log("🔢 GA response rows:", response.rows.length);
      console.log("📄 Sample row:", JSON.stringify(response.rows[0], null, 2));
    }

    const views = response.rows?.[0]?.metricValues?.[0]?.value || "0";
    console.log("👁️‍🗨️ Parsed view count:", views);

    res.json({ views: parseInt(views) });
  } catch (error) {
    console.error("❌ Error fetching GA data:", error);
    res.status(500).json({ error: "Failed to fetch views" });
  }
});

module.exports = router;

