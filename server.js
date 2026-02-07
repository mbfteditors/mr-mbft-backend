import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   LOAD KNOWLEDGE FILE SAFELY
   =============================== */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let knowledge = [];

try {
  const dataPath = path.join(__dirname, "data", "mbft_knowledge.json");
  const rawData = fs.readFileSync(dataPath, "utf8");
  knowledge = JSON.parse(rawData);
  console.log("Knowledge base loaded successfully");
} catch (err) {
  console.error("Failed to load knowledge base", err);
}

/* ===============================
   SIMPLE CONTEXT MATCHER
   =============================== */

function getContext(question) {
  if (!question) return null;

  const q = question.toLowerCase();

  if (q.includes("mbft")) {
    return knowledge.find(k => k.source === "mbft.in")?.content || null;
  }

  if (q.includes("mohun bagan")) {
    return knowledge.find(k => k.source === "wikipedia")?.content || null;
  }

  return null;
}

/* ===============================
   CHAT ENDPOINT
   =============================== */

app.post("/chat", async (req, res) => {
  const message = req.body.message;

  const context = getContext(message);

  if (!context) {
    return res.json({
      reply: "I don’t have verified information on this yet."
    });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          temperature: 0,
          messages: [
            {
              role: "system",
              content: `
You are Mr. MBFT, the official AI assistant of MBFT.in.

RULES:
- Answer ONLY using the provided context.
- Do NOT add information outside the context.
- If the answer is not in the context, say:
"I don’t have verified information on this yet."

CONTEXT:
${context}
              `
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const data = await response.json();

    return res.json({
      reply:
        data?.choices?.[0]?.message?.content ||
        "I don’t have verified information on this yet."
    });

  } catch (err) {
    console.error(err);
    return res.json({
      reply: "I don’t have verified information on this yet."
    });
  }
});

/* ===============================
   HEALTH CHECK
   =============================== */

app.get("/", (req, res) => {
  res.send("Mr. MBFT backend running (knowledge mode enabled)");
});

/* ===============================
   START SERVER
   =============================== */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

