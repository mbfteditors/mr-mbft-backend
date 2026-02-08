import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   MBFT LINKS
================================ */

const LINKS = {
  current: "https://www.mbft.in/p/mohun-bagan-squad.html",
  history: "https://www.mbft.in/2024/01/Mohun-Bagan-Squad-Over-The-Years.html",
  reserves: "https://www.mbft.in/p/mohun-bagan-squad-2.html",
  u18: "https://www.mbft.in/p/mohun-bagan-squad-3.html",
  u16: "https://www.mbft.in/p/mohun-bagan-squad-4.html",
  u14: "https://www.mbft.in/p/mohun-bagan-squad-5.html",
  matches: "https://www.mbft.in/p/mohun-bagan-matches.html",
  trophies: "https://www.mbft.in/2023/07/mohun-bagan-trophy-cabinet.html",
  latest: "https://www.mbft.in"
};

/* ===============================
   SAFE TEXT EXTRACTOR (NO CSS)
================================ */

async function fetchCleanText(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    // REMOVE ALL NON-CONTENT
    $("style, script, noscript, header, footer").remove();

    const container =
      $(".post-body").first().clone() ||
      $(".page-body").first().clone() ||
      $(".entry-content").first().clone();

    if (!container || container.length === 0) return "";

    // REMOVE INLINE STYLE ELEMENTS
    container.find("style, script").remove();

    let text = container.text();

    // FINAL SANITIZATION
    text = text
      .replace(/\/\*[\s\S]*?\*\//g, "") // CSS comments
      .replace(/:\s*#[0-9a-fA-F]{3,6}/g, "")
      .replace(/\{|\}/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // HARD BLOCK CSS-LOOKING OUTPUT
    const cssIndicators = [
      "--",
      "font-size",
      "background",
      "color:",
      "padding",
      "margin"
    ];

    if (cssIndicators.some(k => text.includes(k))) {
      return "";
    }

    return text;
  } catch {
    return "";
  }
}

/* ===============================
   FIND SINGLE SENTENCE
================================ */

function findSentence(text, keyword) {
  const sentences = text.split(".");
  for (const s of sentences) {
    if (s.toLowerCase().includes(keyword.toLowerCase())) {
      return s.trim() + ".";
    }
  }
  return null;
}

/* ===============================
   CHAT ENDPOINT
================================ */

app.post("/chat", async (req, res) => {
  const message = (req.body?.message || "").trim();
  const q = message.toLowerCase();

  /* ATTITUDE RULES */
  if (q.includes("east bengal")) {
    return res.json({
      reply: "We don't talk about irrelevant East Bengal here, JOY MOHUN BAGAN 🟢🔴"
    });
  }

  if (q.includes("atk")) {
    return res.json({
      reply: "It's 2026 and you are still stuck in 2020 😏"
    });
  }

  /* ===============================
     PLAYER QUESTIONS
  =============================== */

  const whoMatch =
    message.match(/who is (.+)/i) ||
    message.match(/did (.+) play/i) ||
    message.match(/has (.+) ever played/i);

  if (whoMatch) {
    const name = whoMatch[1].replace("for mohun bagan", "").trim();

    // Try current squad
    let text = await fetchCleanText(LINKS.current);
    let found = findSentence(text, name);

    if (found) {
      return res.json({
        reply: `Yes. ${found}`
      });
    }

    // Try history
    text = await fetchCleanText(LINKS.history);
    found = findSentence(text, name);

    if (found) {
      return res.json({
        reply: `Yes. ${found}`
      });
    }

    return res.json({
      reply: `I couldn’t find a confirmed answer.
You can check the complete Mohun Bagan squad history here:
${LINKS.history}`
    });
  }

  /* ===============================
     CURRENT SQUAD / CAPTAIN / COACH
  =============================== */

  if (
    q.includes("current squad") ||
    q.includes("senior squad") ||
    q.includes("current team") ||
    q.includes("captain") ||
    q.includes("coach")
  ) {
    const text = await fetchCleanText(LINKS.current);

    if (text) {
      return res.json({ reply: text });
    }

    return res.json({
      reply: `You can view the official Mohun Bagan senior squad here:
${LINKS.current}`
    });
  }

  /* ===============================
     YOUTH & RESERVES
  =============================== */

  if (q.includes("reserve")) return res.json({ reply: LINKS.reserves });
  if (q.includes("u18")) return res.json({ reply: LINKS.u18 });
  if (q.includes("u16")) return res.json({ reply: LINKS.u16 });
  if (q.includes("u14")) return res.json({ reply: LINKS.u14 });

  /* ===============================
     MATCHES
  =============================== */

  if (q.includes("match") || q.includes("fixture") || q.includes("table")) {
    return res.json({ reply: LINKS.matches });
  }

  /* ===============================
     TROPHIES
  =============================== */

  if (q.includes("trophy") || q.includes("titles")) {
    return res.json({ reply: LINKS.trophies });
  }

  /* ===============================
     LATEST NEWS
  =============================== */

  if (q.includes("latest") || q.includes("news")) {
    return res.json({
      reply: `For the latest Mohun Bagan updates, visit:
${LINKS.latest}`
    });
  }

  /* ===============================
     SAFE FALLBACK
  =============================== */

  return res.json({
    reply: "Ask me anything related to Mohun Bagan – squad, players, matches, or history."
  });
});

/* ===============================
   HEALTH CHECK
================================ */

app.get("/", (_, res) => {
  res.send("Mr. MBFT backend running – CSS-safe, answer-first mode");
});

/* ===============================
   START SERVER
================================ */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
