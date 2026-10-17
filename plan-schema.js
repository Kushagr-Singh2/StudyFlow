export const planSchema = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING", description: "Subject or plan name" },
    description: { type: "STRING", description: "Short goal or purpose" },
    deadline: { type: "STRING", description: "Target date in YYYY-MM-DD format, or empty string if not shown" },
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
              properties: { name: { type: "STRING" }, details: { type: "STRING" } },
              required: ["name", "details"]
            }
          }
        },
        required: ["name", "details", "topics"]
      }
    },
    topics: {
      type: "ARRAY",
      description: "Topics that are not inside any phase, if present",
      items: {
        type: "OBJECT",
        properties: { name: { type: "STRING" }, details: { type: "STRING" } },
        required: ["name", "details"]
      }
    }
  },
  required: ["name", "description", "deadline", "phases", "topics"]
};
