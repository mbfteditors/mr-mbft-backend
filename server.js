import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import cheerio from "cheerio";

const app = express();

app.use(cors());
app.use(express.json());

/* =====================================
   LIVE MBFT SOURCES (TRUSTED)
   ===================================== */

const LIVE_SOURCES = {
  squadHistory: "https://www.mbft.in/2024/01/Mohun-Bagan-Squad-Over-The-Years.html",
  seniorSquad: "https://www.mbft.in/p/mohun-bagan-squad.html",
  reserves: "https://www.mbft.in/p/mohun-bagan-squad-2.html",
  u18: "https://www.mbft.in/p/mohun-bagan-squad-3.html",
  u16: "https://www.mbft.in/p/mohun-bagan-squad-4.html",
  u14: "https://www.mbft.in/p/mohun-bagan-squad-5.html",
  matches: "https://www.mbft.in/p/matches.html"
};

/* =====================================
   CACHE (10 MINUTES)
   ===================================== */

const CACHE = {};
const CACHE_TTL = 10 * 60 * 1000;

/* =====================================
   FETCH + DOM EXTRACTION (BULLETPROOF)
   ===================================== */

async function fetchWithCache(key, url) {
  const now = Date.now();

  if (CACHE[key] && now - CACHE[key].time < CACHE_TTL) {
    return CACHE[key].content;
  }

  const response = await fetch(url, {
    headers: { "User-Agent": "Mr-MBFT-Bot/1.0" }
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  let text = "";

  // 1️⃣ Extract normal readable content
  $(".post-body, .entry-content, .page, .widget-content, article").each(
    (_, el) => {
      text += " " + $(el).clone().find("script,style").remove().end().text();
    }
  );

  // 2️⃣ Extract table-based data (CRITICAL FOR SQUADS)
  $("table tr").each((_, row) => {
    const cells = [];
    $(row)
      .find("th, td")
      .each((_, cell) => {
        const cellText = $(cell).text().trim();
        if (cellText) cells.push(cellText);
      });
    if (cells.length) {
      text += " " + cells.join(" | ");
    }
  });

  // 3️⃣ Cleanup
  text = text
    .replace(/\s+/g, " ")
    .replace(/\| \|/g, "|")
    .trim()
    .slice(0, 50000);

  CACHE[key] = {
    time: now,
    content: text
  };

  return text;
}

/* =====================================
   INTENT DETECTION (DOMAIN-AWARE)
   ===================================== */

function detectIntent(question) {
  if (!question) return null;
  const q = question.toLowerCase();

  if (q.includes("over the years") || q.includes("history")) {
    return "squadHistory";
  }

  if (q.includes("u18")) return "u18";
  if (q.includes("u16")) return "u16";
  if (q.includes("u14")) return "u14";
  if (q.includes("reserve")) return "reserves";

  if (q.includes("match") || q.includes("fixture") || q.includes("schedule")) {
    return "matches";
  }

  if (
    q.includes("player") ||
    q.includes("team") ||
    q.includes("squad") ||
    q.includes("who are")
  ) {
    return "seniorSquad";
  }

  return null;
}

/* =====================================
   CHAT ENDPOINT
   ===================================== */

app.post("/chat", async (req, res) => {
  const message = req.body?.message || "";

  const intent = detectIntent(message);

  if (!intent || !LIVE_SOURCES[intent]) {
    return res.json({
      reply: "I don’t have verified information on this yet."
    });
  }

  try {
    const content = await fetchWithCache(intent, LIVE_SOURCES[intent]);

    if (!content || content.length < 300) {
      return res.json({
        reply: "I don’t have verified information on this yet."
      });
    }

    const aiResponse = await fetch(
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
You are Mr. MBFT, the official AI of MBFT.in.

STRICT RULES:
- Use ONLY the content below.
- Do NOT guess.
- Do NOT add extra knowledge.
- If information is missing, reply exactly:
"I don’t have verified information on this yet."

CONTENT:
${content}
              `
            },
            { role: "user", content: message }
          ]
        })
      }
    );

    const data = await aiResponse.json();

    return res.json({
      reply:
        data?.choices?.[0]?.message?.content ||
        "I don’t have verified information on this yet."
    });
  } catch (err) {
    return res.json({
      reply: "I don’t have verified information on this yet."
    });
  }
});

/* =====================================
   HEALTH CHECK
   ===================================== */

app.get("/", (_, res) => {
  res.send("Mr. MBFT backend running – DOM + table extraction active");
});

/* =====================================
   START SERVER
   ===================================== */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
