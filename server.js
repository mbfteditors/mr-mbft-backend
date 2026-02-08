import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   LIVE SOURCES (MBFT = TRUTH)
   =============================== */

const LIVE_SOURCES = {
  squadHistory: "https://www.mbft.in/2024/01/Mohun-Bagan-Squad-Over-The-Years.html",
  seniorSquad: "https://www.mbft.in/p/mohun-bagan-squad.html",
  reserves: "https://www.mbft.in/p/mohun-bagan-squad-2.html",
  u18: "https://www.mbft.in/p/mohun-bagan-squad-3.html",
  u16: "https://www.mbft.in/p/mohun-bagan-squad-4.html",
  u14: "https://www.mbft.in/p/mohun-bagan-squad-5.html",
  matches: "https://www.mbft.in/p/matches.html"
};

/* ===============================
   SIMPLE IN-MEMORY CACHE
   =============================== */

const CACHE = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchWithCache(key, url) {
  const now = Date.now();

  if (CACHE[key] && now - CACHE[key].time < CACHE_TTL) {
    return CACHE[key].content;
  }

  const res = await fetch(url);
  const html = await res.text();

  const cleanText = html
    .replace(/<script[^>]*>.*?<\/script>/gs, "")
    .replace(/<style[^>]*>.*?<\/style>/gs, "")
    .replace(/<noscript[^>]*>.*?<\/noscript>/gs, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 15000);

  CACHE[key] = {
    time: now,
    content: cleanText
  };

  return cleanText;
}

/* ===============================
   INTENT DETECTION
   =============================== */

function detectIntent(question) {
  if (!question) return null;
  const q = question.toLowerCase();

  // Squad over the years
  if (
    q.includes("over the years") ||
    q.includes("historical squad") ||
    q.includes("past squad")
  ) {
    return "squadHistory";
  }

  // Youth squads
  if (q.includes("u18")) return "u18";
  if (q.includes("u16")) return "u16";
  if (q.includes("u14")) return "u14";
  if (q.includes("reserve")) return "reserves";

  // Current / senior squad (DEFAULT)
  if (
    q.includes("squad") ||
    q.includes("team") ||
    q.includes("players") ||
    q.includes("current")
  ) {
    return "seniorSquad";
  }

  // Matches
  if (
    q.includes("match") ||
    q.includes("fixture") ||
    q.includes("schedule")
  ) {
    return "matches";
  }

  return null;
}


/* ===============================
   CHAT ENDPOINT
   =============================== */

app.post("/chat", async (req, res) => {
  const message = req.body.message;

  const intent = detectIntent(message);

  if (!intent || !LIVE_SOURCES[intent]) {
    return res.json({
      reply: "I don’t have verified information on this yet."
    });
  }

  try {
    const liveContent = await fetchWithCache(intent, LIVE_SOURCES[intent]);

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
You are Mr. MBFT, the official AI assistant of MBFT.in.

RULES (STRICT):
- Answer ONLY using the content below.
- Do NOT guess.
- Do NOT add information.
- If information is missing, say:
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

/* ===============================
   HEALTH CHECK
   =============================== */

app.get("/", (req, res) => {
  res.send("Mr. MBFT backend running (Live Squad Fetch + Cache enabled)");
});

/* ===============================
   START SERVER
   =============================== */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
