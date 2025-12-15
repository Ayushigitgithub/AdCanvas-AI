// server.js  (in project root, NOT in src)

// 1. Load env variables
require("dotenv").config();

// 2. Imports
const express = require("express");
const cors = require("cors");
const { model } = require("./geminiClient"); // our Gemini client

// 3. Express app setup
const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Simple health-check route
app.get("/", (req, res) => {
  res.send("AdCanvas AI backend is running with Gemini.");
});

// 4. Main AI route
app.post("/api/generate-copy", async (req, res) => {
  console.log("🔵 POST /api/generate-copy body:", req.body);

  // ---- pull data from body (new + old style) ----
  let platform,
    objective,
    tone,
    templateId,
    templateName,
    hasCTA,
    brandName,
    primaryColor,
    layout,
    cta,
    headline,
    subcopy;

  if (req.body.campaign) {
    // ✅ new payload from updated BuilderPage
    const c = req.body.campaign || {};
    const cr = req.body.creative || {};

    platform = c.platform;
    objective = c.objective;
    tone = c.tone;
    templateId = c.templateId;
    templateName = c.templateName;
    hasCTA = c.hasCTA;
    brandName = c.brandName;
    primaryColor = c.primaryColor;

    layout = cr.layout;
    cta = cr.cta;
    headline = cr.headline;
    subcopy = cr.subcopy;
  } else {
    // 🔙 backwards-compatible with old flat body
    platform = req.body.platform;
    objective = req.body.objective;
    tone = req.body.tone;
    templateId = req.body.templateId;
    brandName = req.body.brandName;

    layout = req.body.layout;
    cta = req.body.cta;
    headline = req.body.headline;
    subcopy = req.body.subcopy;
  }

  try {
    const prompt = `
You are an ad copy assistant for Tesco retail media.

Follow these simplified Tesco self-serve rules:
- No prices, discounts, "% off", "sale", "deal".
- No sustainability/green claims, charity/donation messaging, or competitions/prizes.
- CTA text must stay neutral (e.g. "View details", "Learn more").

Inputs:
- Brand: ${brandName || "Your brand"}
- Platform: ${platform || "unspecified"}
- Objective: ${objective || "unspecified"}
- Tone of voice: ${tone || "Bold & modern"}
- Template: ${templateName || templateId || "unknown"}
- CTA allowed: ${hasCTA ? "yes (neutral wording only)" : "no CTA, copy must work without a button"}
- Primary brand colour: ${primaryColor || "#2563eb"}
- Layout: ${layout || "not specified"}
- Current CTA label (if any): "${cta || ""}"
- Current headline: "${headline || ""}"
- Current supporting line: "${subcopy || ""}"

Return a JSON object with exactly these keys:
{
  "headline": "short replacement headline (max 8 words)",
  "subcopy": "one Tesco-safe supporting sentence"
}

Only output JSON. Do not include any extra text or explanations.
    `.trim();

    const result = await model.generateContent(prompt);

    // 🔹 Get raw text from Gemini
    let text = result.response.text();
    console.log("✅ Raw Gemini text:", text);

    // 🔹 Strip ```json ... ``` fences if present
    text = text.trim();
    if (text.startsWith("```")) {
      text = text
        .replace(/^```[a-zA-Z]*\n?/, "") // remove starting ``` or ```json
        .replace(/```$/, "") // remove ending ```
        .trim();
      console.log("🧹 Cleaned JSON text:", text);
    }

    let ai;
    try {
      ai = JSON.parse(text); // try to parse cleaned JSON
    } catch (e) {
      console.error("JSON parse error, falling back:", e);
      ai = {
        headline,
        subcopy: text, // fallback: use full text as body
      };
    }

    res.json({
      headline: ai.headline || headline,
      subcopy: ai.subcopy || subcopy,
      // (later agar chaahe to yahan CTA ya alerts bhi bhej sakte hain)
    });
  } catch (err) {
    console.error("❌ Gemini error:", err.response?.data || err.message || err);
    res.status(500).json({
      error: "Gemini request failed",
      detail: err.message || String(err),
    });
  }
});

// 5. Start server
app.listen(PORT, () => {
  console.log(`AdCanvas AI backend listening on http://localhost:${PORT}`);
});
