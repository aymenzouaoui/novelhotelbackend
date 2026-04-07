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
    // 1) Prefer realtime report (matches GA4 "Realtime overview" views UI)
    try {
      const [realtimeResponse] = await analyticsDataClient.runRealtimeReport({
        property: `properties/${PROPERTY_ID}`,
        metrics: [{ name: "screenPageViews" }],
      });

      let realtimeViews = 0;
      if (realtimeResponse?.rows?.length) {
        realtimeViews = realtimeResponse.rows.reduce((sum, row) => {
          const value = row?.metricValues?.[0]?.value;
          const parsed = value ? parseInt(value, 10) : 0;
          return sum + (Number.isFinite(parsed) ? parsed : 0);
        }, 0);
      } else if (realtimeResponse?.totals) {
        // Defensive fallback
        const totals = realtimeResponse.totals;
        let extracted = null;
        if (Array.isArray(totals)) {
          extracted = totals?.[0]?.metricValues?.[0]?.value ?? null;
        } else if (typeof totals === "object") {
          extracted = totals?.metricValues?.[0]?.value ?? null;
        }
        const parsed = extracted ? parseInt(extracted, 10) : 0;
        realtimeViews = Number.isFinite(parsed) ? parsed : 0;
      }

      console.log("⚡ GA realtime screenPageViews:", realtimeViews);
      if (Number.isFinite(realtimeViews) && realtimeViews > 0) {
        return res.json({ views: realtimeViews });
      }
    } catch (e) {
      console.warn("⚠️ realtime report failed, falling back to runReport:", e?.message || e);
    }

    // 2) Historical report fallback
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      // Priorité à aujourd'hui (la capture GA semble sur une fenêtre très récente)
      dateRanges: [{ startDate: "today", endDate: "today" }],
      metrics: [{ name: "screenPageViews" }],
      // Force la présence de `rows` via une dimension temporelle.
      // Sinon on peut obtenir un response sans `rows` et `totals` vide.
      dimensions: [{ name: "date" }],
      limit: 50,
    });

    console.log("✅ GA API response received");

    if (!response.rows || response.rows.length === 0) {
      console.warn("⚠️ GA response has no rows");
      if (response.totals) {
        console.log("📌 GA response totals:", JSON.stringify(response.totals, null, 2));
      }
    } else {
      console.log("🔢 GA response rows:", response.rows.length);
      console.log("📄 Sample row:", JSON.stringify(response.rows[0], null, 2));
    }

    let views = 0;

    // If GA returns rows, sum metricValues.
    if (response.rows && response.rows.length > 0) {
      views = response.rows.reduce((sum, row) => {
        const value = row?.metricValues?.[0]?.value;
        const parsed = value ? parseInt(value, 10) : 0;
        return sum + (Number.isFinite(parsed) ? parsed : 0);
      }, 0);
    } else if (response.totals) {
      // If GA returns no rows (e.g. aggregated response), try extracting from totals.
      const totals = response.totals;
      let extracted = null;

      if (Array.isArray(totals)) {
        extracted = totals?.[0]?.metricValues?.[0]?.value ?? null;
      } else if (typeof totals === "object") {
        extracted = totals?.metricValues?.[0]?.value ?? null;

        // Fallback: sometimes totals is a plain object with metric name keys.
        if (!extracted) {
          for (const v of Object.values(totals)) {
            if (v == null) continue;
            if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(parseInt(v, 10))) {
              extracted = v;
              break;
            }
            if (typeof v === "object" && v?.value && !Number.isNaN(parseInt(v.value, 10))) {
              extracted = v.value;
              break;
            }
          }
        }
      }

      const parsed = extracted ? parseInt(extracted, 10) : 0;
      views = Number.isFinite(parsed) ? parsed : 0;
    }

    console.log("👁️‍🗨️ Parsed view count:", views);

    // Si "today" retourne 0, retenter sur 30 jours (fallback historique)
    if (views === 0) {
      console.warn("⚠️ screenPageViews today is 0; retrying on last 30 days");
      const [response30] = await analyticsDataClient.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [{ name: "screenPageViews" }],
        dimensions: [{ name: "date" }],
        limit: 200,
      });

      console.log("✅ GA API (30days) response received");

      if (response30.rows && response30.rows.length > 0) {
        views = response30.rows.reduce((sum, row) => {
          const value = row?.metricValues?.[0]?.value;
          const parsed = value ? parseInt(value, 10) : 0;
          return sum + (Number.isFinite(parsed) ? parsed : 0);
        }, 0);
      } else if (response30.totals) {
        const totals = response30.totals;
        let extracted = null;

        if (Array.isArray(totals)) {
          extracted = totals?.[0]?.metricValues?.[0]?.value ?? null;
        } else if (typeof totals === "object") {
          extracted = totals?.metricValues?.[0]?.value ?? null;
        }

        const parsed = extracted ? parseInt(extracted, 10) : 0;
        views = Number.isFinite(parsed) ? parsed : 0;
      }

      console.log("👁️‍🗨️ Parsed view count (30days):", views);
    }

    // Autre metric possible selon la configuration GA4 (UI "Views")
    if (views === 0) {
      console.warn("⚠️ screenPageViews still 0; retrying metric `views`");
      try {
        const [viewsResponse] = await analyticsDataClient.runReport({
          property: `properties/${PROPERTY_ID}`,
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          metrics: [{ name: "views" }],
        });

        if (viewsResponse.rows?.length) {
          views = viewsResponse.rows.reduce((sum, row) => {
            const value = row?.metricValues?.[0]?.value;
            const parsed = value ? parseInt(value, 10) : 0;
            return sum + (Number.isFinite(parsed) ? parsed : 0);
          }, 0);
        } else if (viewsResponse.totals) {
          const totals = viewsResponse.totals;
          let extracted = null;
          if (Array.isArray(totals)) {
            extracted = totals?.[0]?.metricValues?.[0]?.value ?? null;
          } else if (typeof totals === "object") {
            extracted = totals?.metricValues?.[0]?.value ?? null;
          }
          const parsed = extracted ? parseInt(extracted, 10) : 0;
          views = Number.isFinite(parsed) ? parsed : 0;
        }

        console.log("👁️‍🗨️ Parsed view count (metric views):", views);
      } catch (e) {
        console.warn("⚠️ metric `views` not supported or failed:", e?.message || e);
      }
    }

    // Fallback: sometimes `screenPageViews` returns empty totals/rows depending on GA config.
    // In that case, use eventCount aggregated by eventName and sum `page_view` (+ `screen_view`).
    if (!Number.isFinite(views) || views === 0) {
      console.warn("⚠️ screenPageViews empty; fallback to eventCount by eventName");

      const [eventResponse] = await analyticsDataClient.runReport({
        property: `properties/${PROPERTY_ID}`,
        // Retenter sur aujourd'hui d'abord (souvent plus proche des UI GA)
        dateRanges: [{ startDate: "today", endDate: "today" }],
        metrics: [{ name: "eventCount" }],
        dimensions: [{ name: "eventName" }],
      });

      if (eventResponse?.rows?.length) {
        const targetEvents = new Set(["page_view", "screen_view"]);
        views = eventResponse.rows.reduce((sum, row) => {
          const eventName = row?.dimensionValues?.[0]?.value;
          if (!eventName || !targetEvents.has(eventName)) return sum;
          const value = row?.metricValues?.[0]?.value;
          const parsed = value ? parseInt(value, 10) : 0;
          return sum + (Number.isFinite(parsed) ? parsed : 0);
        }, 0);
      } else {
        console.warn("⚠️ eventCount report returned no rows");
        if (eventResponse?.totals) {
          console.log("📌 GA eventResponse totals:", JSON.stringify(eventResponse.totals, null, 2));
        }
      }

      console.log("👁️‍🗨️ Parsed view count (fallback):", views);
    }

    res.json({ views });
  } catch (error) {
    console.error("❌ Error fetching GA data:", error);
    res.status(500).json({ error: "Failed to fetch views" });
  }
});

module.exports = router;

