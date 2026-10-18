import { GoogleGenAI } from "@google/genai";

const roadmapSchema = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    description: { type: "STRING" },
    deadline: { type: "STRING" },
    summary: { type: "STRING" },
    phases: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          details: { type: "STRING" },
          topics: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                details: { type: "STRING" },
                scheduleDate: { type: "STRING" }
              },
              required: ["name", "details", "scheduleDate"]
            }
          }
        },
        required: ["name", "details", "topics"]
      }
    },
    topics: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          details: { type: "STRING" },
          scheduleDate: { type: "STRING" }
        },
        required: ["name", "details", "scheduleDate"]
      }
    }
  },
  required: ["name", "description", "deadline", "summary", "phases", "topics"]
};

const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const MAX_FILE_BYTES = 3 * 1024 * 1024;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI roadmap generation is temporarily unavailable." });

  const { file, startDate, endDate } = req.body || {};
  if (!file?.data || !allowedTypes.includes(file.mimeType)) {
    return res.status(400).json({ error: "Upload a PDF, PNG, JPEG, or WebP syllabus." });
  }
  if (Buffer.byteLength(file.data, "base64") > MAX_FILE_BYTES) {
    return res.status(413).json({ error: "Keep the syllabus file under 3 MB and try again." });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || "") || !/^\d{4}-\d{2}-\d{2}$/.test(endDate || "") || startDate > endDate) {
    return res.status(400).json({ error: "Choose a valid start date and finish date." });
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are an expert academic study planner. Read the uploaded syllabus carefully and create a realistic, dated study checklist.
The student's first study day is ${startDate}; they want to finish by ${endDate}. Use the dates exactly as the scheduling window.
Extract and preserve the syllabus topics and their hierarchy. Do not silently omit syllabus topics or invent topics that are not in the source. You may create actionable practice and revision checklist items grounded in the syllabus, but label them clearly as practice or revision.
Estimate relative topic workload from conceptual complexity, prerequisite relationships, amount of detail, and whether problem-solving or implementation is needed. Do not split topics evenly just to fill dates. Allocate more days or sessions to harder/denser topics and less to short/easy topics. If the window is long relative to the syllabus, use the extra time for deliberate practice, spaced revision, mixed questions, weak-area review, and mock tests. If the window is short, prioritise essentials and practice efficiently while still representing all syllabus topics. Keep a sensible daily workload and order prerequisite topics before dependent topics.
Every checklist topic must have scheduleDate in YYYY-MM-DD format between ${startDate} and ${endDate}. Use one date per actionable task; multiple tasks may share a day. Put the date in each topic's scheduleDate and include a short, useful action in details (such as learn concept, solve problems, implement, revise, or self-test). Schedule revision near the end and leave the final day for consolidation when the time window allows. Do not promise mastery or assume a specific number of study hours because the user did not provide that information.
Return a concise subject name, a useful description, and a summary explaining the scheduling approach. If the syllabus is unreadable or contains too little content to build a grounded plan, return the best grounded extraction and mention the limitation in summary. Return JSON matching the schema only.`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      contents: [{ role: "user", parts: [
        { inlineData: { mimeType: file.mimeType, data: file.data } },
        { text: prompt }
      ] }],
      config: { responseMimeType: "application/json", responseSchema: roadmapSchema, temperature: 0.2 }
    });
    if (!response.text) return res.status(502).json({ error: "The AI service did not return a roadmap. Try a clearer or smaller syllabus." });
    const plan = JSON.parse(response.text);
    plan.phases = Array.isArray(plan.phases) ? plan.phases : [];
    plan.topics = Array.isArray(plan.topics) ? plan.topics : [];
    const allTopics = [...plan.topics, ...plan.phases.flatMap(p => Array.isArray(p.topics) ? p.topics : [])];
    const validDate = date => /^\d{4}-\d{2}-\d{2}$/.test(date || "") && date >= startDate && date <= endDate;
    for (const topic of allTopics) {
      if (!validDate(topic.scheduleDate)) topic.scheduleDate = startDate;
      topic.name = String(topic.name || "Review syllabus topic").slice(0, 160);
      topic.details = String(topic.details || "").slice(0, 500);
    }
    plan.deadline = endDate;
    return res.status(200).json({ plan });
  } catch (error) {
    console.error("Roadmap generation failed:", error?.message || error);
    return res.status(500).json({ error: "Could not generate the roadmap. Check your connection and try again." });
  }
}
