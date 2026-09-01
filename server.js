require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const OpenAI = require("openai");

const app = express();

const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());

/* --------------------------------
   HEALTH CHECK
-------------------------------- */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "EvoMind AI backend is running."
  });
});

/* --------------------------------
   AI CHAT
-------------------------------- */

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
          .filter(item => item && item.role && item.content)
          .slice(-10)
          .map(item => ({
            role: item.role === "assistant" ? "assistant" : "user",
            content: String(item.content).slice(0, 4000)
          }))
      : [];

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions: `
You are EvoMind AI, a friendly personal learning companion.

Your job is to help students:
- learn programming and technology
- understand difficult concepts simply
- create realistic study plans
- stay motivated
- break big goals into small tasks
- prepare for interviews and exams
- improve consistency

Rules:
1. Be supportive but practical.
2. Explain technical topics in simple language.
3. Use examples when useful.
4. Do not make the answer unnecessarily long.
5. If the student asks for a study plan, make it actionable.
6. If the student asks coding questions, provide correct and beginner-friendly code.
7. Never reveal API keys or private server information.
8. Address the user naturally as a student/learner.
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
      reply
    });

  } catch (error) {
    console.error("AI ERROR:", error);

    res.status(500).json({
      success: false,
      error: "AI service is temporarily unavailable."
    });
  }
});

/* --------------------------------
   SERVE FRONTEND
-------------------------------- */

const frontendPath = path.join(__dirname, "..");

app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

/* --------------------------------
   START SERVER
-------------------------------- */

app.listen(PORT, () => {
  console.log(`EvoMind AI running on port ${PORT}`);
});
