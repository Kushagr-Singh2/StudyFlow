import { GoogleGenAI } from "@google/genai";
import { planSchema } from "../plan-schema.js";

const MAX_IMAGE_BYTES = 900 * 1024;
const MAX_IMAGES = 3;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Screenshot import is temporarily unavailable." });
  const images = req.body?.images;
  if (!Array.isArray(images) || images.length === 0) return res.status(400).json({ error: "Upload at least one screenshot." });
  if (images.length > MAX_IMAGES) return res.status(400).json({ error: `Please upload no more than ${MAX_IMAGES} screenshots at a time.` });
  const parts = [];
  for (const image of images) {
    if (!image?.data || !["image/png", "image/jpeg", "image/webp"].includes(image.mimeType)) return res.status(400).json({ error: "One screenshot has an unsupported format." });
    const sizeBytes = Buffer.byteLength(image.data, "base64");
    if (sizeBytes > MAX_IMAGE_BYTES) return res.status(413).json({ error: "Each screenshot must be under 900 KB for online import. Try resizing it or exporting a smaller image." });
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  }
  parts.push({ text: `Extract a study plan from these screenshots into the requested JSON schema. The images are in order and may be consecutive parts of the same plan. Preserve the hierarchy: phases/modules contain their topics; do not turn headings into topics if they are only section labels. Keep topic names faithful to the screenshot. Include short study instructions or success criteria in details only when visible or clearly stated. If dates are visible, normalize them to YYYY-MM-DD only when unambiguous; otherwise use an empty deadline. Do not invent topics, deadlines, or descriptions. If the plan is a syllabus with numbered sessions, use sensible phases based on visible topic groupings. Keep readable topics, including those in tables. If text is unclear, mark details with "[unclear in screenshot]" rather than guessing. Return JSON only.` });
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      contents: [{ role: "user", parts }],
      config: { responseMimeType: "application/json", responseSchema: planSchema, temperature: 0.1 }
    });
    const raw = response.text;
    if (!raw) return res.status(502).json({ error: "No plan could be extracted. Try clearer screenshots." });
    const plan = JSON.parse(raw);
    plan.phases = Array.isArray(plan.phases) ? plan.phases : [];
    plan.topics = Array.isArray(plan.topics) ? plan.topics : [];
    return res.status(200).json({ plan });
  } catch (error) {
    console.error("Plan parsing failed:", error?.message || error);
    return res.status(500).json({ error: "Could not process screenshots. Check your connection or try again later." });
  }
}
