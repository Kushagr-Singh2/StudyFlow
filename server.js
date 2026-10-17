import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { planSchema } from "./plan-schema.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
app.use(cors({ origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5500", "http://127.0.0.1:5500", "null"] }));
app.use(express.json({ limit: "12mb" }));
app.get("/api/health", (_req, res) => res.json({ ok: true, configured: Boolean(apiKey) }));
app.post("/api/parse-plan", async (req, res) => {
  try {
    if (!ai) return res.status(503).json({ error: "Screenshot import is not configured on this server." });
    const images = req.body?.images;
    if (!Array.isArray(images) || images.length === 0) return res.status(400).json({ error: "Upload at least one screenshot." });
    if (images.length > 8) return res.status(400).json({ error: "Please upload no more than 8 screenshots at a time." });
    const parts = [];
    for (const image of images) {
      if (!image?.data || !["image/png", "image/jpeg", "image/webp"].includes(image.mimeType)) return res.status(400).json({ error: "One screenshot has an unsupported format." });
      if (Buffer.byteLength(image.data, "base64") > 8 * 1024 * 1024) return res.status(413).json({ error: "Each screenshot must be smaller than 8 MB." });
      parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    }
    parts.push({ text: `Extract a study plan from these screenshots into the requested JSON schema. The images are in order and may be consecutive parts of the same plan. Preserve hierarchy and visible topic names. Do not invent topics, deadlines, or descriptions. Use YYYY-MM-DD only for unambiguous dates; otherwise an empty deadline. If text is unclear, mark details with "[unclear in screenshot]" rather than guessing. Return JSON only.` });
    const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || "gemini-3.8-flash", contents: [{ role: "user", parts }], config: { responseMimeType: "application/json", responseSchema: planSchema, temperature: 0.1 } });
    if (!response.text) return res.status(502).json({ error: "No plan could be extracted. Try clearer screenshots." });
    const plan = JSON.parse(response.text);
    plan.phases = Array.isArray(plan.phases) ? plan.phases : [];
    plan.topics = Array.isArray(plan.topics) ? plan.topics : [];
    return res.json({ plan });
  } catch (error) {
    console.error("Plan parsing failed:", error?.message || error);
    return res.status(500).json({ error: "Could not process screenshots. Check your connection or try again later." });
  }
});
app.listen(port, () => console.log(`StudyFlow local API running on port ${port}`));
