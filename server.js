import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import knowledge from "./data/mbft_knowledge.json" assert { type: "json" };

const app = express();
app.use(cors());
app.use(express.json());

function getContext(question) {
  const q = question.toLowerCase();

  if (q.includes("mbft")) {
    return knowledge.find(k => k.source === "mbft.in")?.content;
  }

  if (q.includes("mohun bagan")) {
    return knowledge.find(k => k.source === "wikipedia")?.content;
  }

  return null;
}

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
Answer ONLY using the context below.
If the answer is not in the context, say:
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

    res.json({
      reply:
        data?.choices?.[0]?.message?.content ||
        "I don’t have verified information on this yet."
    });

  } catch {
    res.json({
      reply: "I don’t have verified information on this yet."
    });
  }
});

app.get("/", (req, res) => {
  res.send("Mr. MBFT backend running (knowledge mode enabled).");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
