require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "EvoMind AI backend is running."
  });
});

// AI Mentor
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required."
      });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter(item => {
            return (
              item &&
              (item.role === "user" || item.role === "assistant") &&
              item.content
            );
          })
          .slice(-10)
          .map(item => ({
            role: item.role,
            content: String(item.content).slice(0, 4000)
          }))
      : [];

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",

      instructions: `
You are EvoMind AI, a friendly personal AI learning companion.

Help students with:
- Programming and technology
- Difficult concepts
- Study plans
- Coding problems
- Interview preparation
- Exam preparation
- Motivation and consistency
- Breaking large goals into small tasks

Rules:
1. Explain things simply and clearly.
2. Give practical and actionable answers.
3. Use examples when useful.
4. Keep answers reasonably concise.
5. For coding questions, give beginner-friendly and correct code.
6. Be supportive and encouraging.
7. Never reveal API keys or private server information.
`,

      input: [
        ...safeHistory,
        {
          role: "user",
          content: message.trim().slice(0, 8000)
        }
      ],

      max_output_tokens: 1200
    });

    const reply =
      response.output_text ||
      "Sorry, I could not generate a response right now.";

    res.json({
      success: true,
      reply: reply
    });

  } catch (error) {
    console.error("AI ERROR:", error);

    res.status(500).json({
      success: false,
      error: "AI service is temporarily unavailable."
    });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`EvoMind AI backend running on port ${PORT}`);
});
