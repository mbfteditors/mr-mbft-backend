import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();

app.use(cors());
app.use(express.json());

/* =====================================
   SINGLE SOURCE OF TRUTH (MBFT DATA PAGE)
   ===================================== */

const MBFT_DATA_URL = "https://www.mbft.in/p/mr-mbft-data.html";

/* =====================================
   SIMPLE CACHE (10 MINUTES)
   ===================================== */

let CACHE = {
  time: 0,
  content: ""
};

const CACHE_TTL = 10 * 60 * 1000;

/* =====================================
   FETCH & PARSE MBFT DATA PAGE
   ===================================== */

async function fetchMBFTData() {
  const now = Date.now();

  if (CACHE.content && now - CACHE.time < CACHE_TTL) {
    return CACHE.content;
  }

  const response = await fetch(MBFT_DATA_URL, {
    headers: { "User-Agent": "Mr-MBFT-Bot/1.0" }
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  let text = "";

  // Extract readable content
  $("body").each((_, el) => {
    text += " " + $(el).clone().find("script,style,noscript").remove().end().text();
  });

  // Extract table content explicitly (if any)
  $("table tr").each((_, row) => {
    const cells = [];
    $(row).find("th, td").each((_, cell) => {
      const cellText = $(cell).text().trim();
      if (cellText) cells.push(cellText);
    });
    if (cells.length) {
      text += " " + cells.join(" | ");
    }
  });

  text = text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50000);

  CACHE = {
    time: now,
    content: text
  };

  return text;
}

/* =====================================
   CHAT ENDPOINT
   ===================================== */

app.post("/chat", async (req, res) => {
  const message = req.body?.message || "";

  // If question is not about Mohun Bagan / squads, refuse safely
  const q = message.toLowerCase();
  if (
    !q.includes("mohun bagan") &&
    !q.includes("squad") &&
    !q.includes("player") &&
    !q.includes("team") &&
    !q.includes("match")
  ) {
    return res.json({
      reply: "I don’t have verified information on this yet."
    });
  }

  try {
    const content = await fetchMBFTData();

    if (!content || content.length < 300) {
      return res.json({
        reply: "I don’t have verified information on this yet."
      });
    }

    const openaiResponse = await fetch(
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

STRICT RULES:
- Answer ONLY using the content below.
- Do NOT guess.
- Do NOT add information.
- If the answer is not present, say exactly:
"I don’t have verified information on this yet."

CONTENT:
${content}
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

    return res.json({
      reply:
        data?.choices?.[0]?.message?.content ||
        "I don’t have verified information on this yet."
    });

  } catch (error) {
    return res.json({
      reply: "I don’t have verified information on this yet."
    });
  }
});

/* =====================================
   HEALTH CHECK
   ===================================== */

app.get("/", (_, res) => {
  res.send("Mr. MBFT backend running – Hidden MBFT Data Page mode");
});

/* =====================================
   START SERVER
   ===================================== */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
