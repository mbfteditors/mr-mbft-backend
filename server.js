import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

/* ==================================================
   LIVE MBFT SOURCES (SINGLE SOURCE OF TRUTH)
   ================================================== */

const LIVE_SOURCES = {
  squadHistory: "https://www.mbft.in/2024/01/Mohun-Bagan-Squad-Over-The-Years.html",
  seniorSquad: "https://www.mbft.in/p/mohun-bagan-squad.html",
  reserves: "https://www.mbft.in/p/mohun-bagan-squad-2.html",
  u18: "https://www.mbft.in/p/mohun-bagan-squad-3.html",
  u16: "https://www.mbft.in/p/mohun-bagan-squad-4.html",
  u14: "https://www.mbft.in/p/mohun-bagan-squad-5.html",
  matches: "https://www.mbft.in/p/matches.html"
};

/* ==================================================
   SIMPLE IN-MEMORY CACHE (10 MINUTES)
   ================================================== */

const CACHE = {};
const CACHE_TTL = 10 * 60 * 1000;

async function fetchWithCache(key, url) {
  const now = Date.now();

  if (CACHE[key] && now - CACHE[key].time < CACHE_TTL) {
    return CACHE[key].content;
  }

  const response = await fetch(url);
  const html = await response.text();

  let extracted = "";

  // Try common Blogger content containers
  const selectors = [
    /<div class="post-body[^"]*">([\s\S]*?)<\/div>/i,
    /<div class="entry-content[^"]*">([\s\S]*?)<\/div>/i,
    /<div class="page-body[^"]*">([\s\S]*?)<\/div>/i,
    /<div class="widget-content[^"]*">([\s\S]*?)<\/div>/i
  ];

  for (const regex of selectors) {
    const match = html.match(regex);
    if (match && match[1]) {
      extracted = match[1];
      break;
    }
  }

  // Fallback if nothing matched
  if (!extracted) {
    extracted = html;
  }

  const cleanedText = extracted
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 25000);

  CACHE[key] = {
    time: now,
    content: cleanedText
  };

  return cleanedText;
}

/* ==================================================
   INTENT DETECTION (ROBUST & SAFE)
   ================================================== */

function detectIntent(question) {
  if (!question) return null;

  const q = question.toLowerCase();

  // Squad history
  if (
    q.includes("over the years") ||
    q.includes("history squad") ||
    q.includes("past squad")
  ) {
    return "squadHistory";
  }

  // Youth & reserve squads
  if (q.includes("u18")) return "u18";
  if (q.includes("u16")) return "u16";
  if (q.includes("u14")) return "u14";
  if (q.includes("reserve")) return "reserves";

  // Matches
  if (
    q.includes("match") ||
    q.includes("fixture") ||
    q.includes("schedule")
  ) {
    return "matches";
  }

  // Explicit senior squad
  if (
    q.includes("current squad") ||
    q.includes("senior squad") ||
    q.includes("team list") ||
    q.includes("player list")
  ) {
    return "seniorSquad";
  }

  // Default: Mohun Bagan + players/team/squad
  if (
    q.includes("mohun bagan") &&
    (
      q.includes("player") ||
      q.includes("team") ||
      q.includes("squad") ||
      q.includes("who are")
    )
  ) {
    return "seniorSquad";
  }

  return null;
}

/* ==================================================
   CHAT ENDPOINT
   ================================================== */

app.post("/chat", async (req, res) => {
  const message = req.body.message;

  const intent = detectIntent(message);

  if (!intent || !LIVE_SOURCES[intent]) {
    return res.json({
      reply: "I don’t have verified information on this yet."
    });
  }

  try {
    const liveContent = await fetchWithCache(
      intent,
      LIVE_SOURCES[intent]
    );

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
          temperature: 0,
          messages: [
            {
              role: "system",
              content: `
You are Mr. MBFT, the official AI assistant of MBFT.in.

STRICT RULES:
- Answer ONLY using the content below.
- Do NOT guess.
- Do NOT add external information.
- If information is missing, say exactly:
"I don’t have verified information on this yet."

CONTENT:
${liveContent}
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

/* ==================================================
   HEALTH CHECK
   ================================================== */

app.get("/", (req, res) => {
  res.send("Mr. MBFT backend running – Live fetch + cache active");
});

/* ==================================================
   START SERVER
   ================================================== */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

