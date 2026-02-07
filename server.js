import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.json({
        reply: "Please ask a question related to Mohun Bagan or MBFT."
      });
    }

    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are Mr. MBFT, a knowledgeable and friendly guide for Mohun Bagan and MBFT.in. Answer ONLY Mohun Bagan related questions. Politely refuse unrelated topics."
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.5
        })
      }
    );

    const data = await openaiRes.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "I’m unable to answer right now. Please try again later.";

    res.json({ reply });
  } catch (error) {
    res.json({
      reply: "AI service temporarily unavailable. Please try again later."
    });
  }
});

app.get("/", (req, res) => {
  res.send("Mr. MBFT backend is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
