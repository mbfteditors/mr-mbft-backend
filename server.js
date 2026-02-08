import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());
app.use(express.json());

/* =================================
   MBFT LINKS (SINGLE SOURCE OF TRUTH)
================================== */

const LINKS = {
  hidden: "https://www.mbft.in/p/mr-mbft-data.html",
  history: "https://www.mbft.in/2024/01/Mohun-Bagan-Squad-Over-The-Years.html",
  current: "https://www.mbft.in/p/mohun-bagan-squad.html",
  reserves: "https://www.mbft.in/p/mohun-bagan-squad-2.html",
  u18: "https://www.mbft.in/p/mohun-bagan-squad-3.html",
  u16: "https://www.mbft.in/p/mohun-bagan-squad-4.html",
  u14: "https://www.mbft.in/p/mohun-bagan-squad-5.html",
  matches: "https://www.mbft.in/p/mohun-bagan-matches.html",
  trophies: "https://www.mbft.in/2023/07/mohun-bagan-trophy-cabinet.html",
  latest: "https://www.mbft.in"
};

/* =================================
   CLEAN & FILTER BLOGGER CONTENT
================================== */

async function fetchFilteredContent(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    let raw =
      $(".post-body").text() ||
      $(".page-body").text() ||
      $(".entry-content").text() ||
      "";

    raw = raw.replace(/\s+/g, " ").trim();
    if (!raw || raw.length < 300) return "";

    const banned = [
      "Home", "Archives", "Categories", "MBFT Specials",
      "Subscribe", "Privacy Policy", "Era", "Copyright"
    ];

    let lines = raw.split(".");
    lines = lines
      .map(l => l.trim())
      .filter(l =>
        l.length > 20 &&
        !banned.some(b => l.includes(b))
      );

    return lines.join(". ") + ".";
  } catch {
    return "";
  }
}

/* =================================
   FIND PLAYER LINE ONLY
================================== */

function findPlayerLine(content, name) {
  const lines = content.split(".");
  for (const line of lines) {
    if (line.toLowerCase().includes(name.toLowerCase())) {
      return line.trim() + ".";
    }
  }
  return null;
}

/* =================================
   CHAT ENDPOINT
================================== */

app.post("/chat", async (req, res) => {
  const message = (req.body?.message || "").trim();
  const q = message.toLowerCase();

  /* EAST BENGAL RULE */
  if (q.includes("east bengal")) {
    return res.json({
      reply: "We don't talk about irrelevant East Bengal here, JOY MOHUN BAGAN 🟢🔴"
    });
  }

  /* ATK RULE */
  if (q.includes("atk")) {
    return res.json({
      reply: "It's 2026 and you are still stuck in 2020 😏"
    });
  }

  /* ===============================
     CURRENT / SENIOR SQUAD
  =============================== */

  const isSquadQuery =
    q.includes("current squad") ||
    q.includes("senior squad") ||
    q.includes("mohun bagan squad") ||
    q.includes("current team") ||
    q.includes("team list") ||
    q.includes("players in mohun bagan");

  if (isSquadQuery) {
    const content = await fetchFilteredContent(LINKS.hidden);

    if (content) {
      return res.json({ reply: content });
    }

    return res.json({
      reply: `You can view the official current Mohun Bagan senior squad here:
${LINKS.current}`
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
    const name = whoMatch[1]
      .replace("for mohun bagan", "")
      .trim();

    // 1️⃣ Check current squad (hidden page)
    let content = await fetchFilteredContent(LINKS.hidden);
    let found = findPlayerLine(content, name);

    if (found) {
      return res.json({
        reply: `Yes. ${found}`
      });
    }

    // 2️⃣ Check all-time squad
    content = await fetchFilteredContent(LINKS.history);
    found = findPlayerLine(content, name);

    if (found) {
      return res.json({
        reply: `Yes. ${found}`
      });
    }

    // 3️⃣ Smart redirect
    return res.json({
      reply: `I couldn’t confirm this from verified data.
You can check the full Mohun Bagan squad history here:
${LINKS.history}`
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
    reply: "Please ask about Mohun Bagan, its squad, players, matches, or history."
  });
});

/* =================================
   HEALTH CHECK
================================== */

app.get("/", (_, res) => {
  res.send("Mr. MBFT backend running – smart intent & clean extraction enabled");
});

/* =================================
   START SERVER
================================== */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
