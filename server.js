import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

/* ===============================
   MIDDLEWARE
   =============================== */
app.use(cors());
app.use(express.json());

/* ===============================
   CHAT ENDPOINT
   =============================== */
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.json({
        reply: "Please ask a question related to Mohun Bagan or MBFT."
      });
    }

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content: `
You are Mr. MBFT, the official AI assistant of MBFT.in.

STRICT RULES (MANDATORY):
1. Answer ONLY when you are 100% sure of the facts.
2. If you are unsure, incomplete, or lack verified information, reply exactly with:
   "I don’t have verified information on this yet."
3. NEVER guess.
4. NEVER invent facts, names, dates, or events.
5. NEVER mix assumptions with facts.
6. Focus ONLY on Mohun Bagan and MBFT-related topics.

TONE:
- Calm
- Factual
- Careful
- Respectful
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

    const data = await openaiResponse.json();

    const reply =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
        ? data.choices[0].message.content.trim()
        : "I don’t have verified information on this yet.";

    return res.json({ reply });

  } catch (error) {
    return res.json({
      reply: "I don’t have verified information on this yet."
    });
  }
});

/* ===============================
   HEALTH CHECK
   =============================== */
app.get("/", (req, res) => {
  res.send("Mr. MBFT backend is running (Strict Knowledge Mode enabled).");
});

/* ===============================
   SERVER START
   =============================== */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Mr. MBFT backend running on port ${PORT}`);
});

