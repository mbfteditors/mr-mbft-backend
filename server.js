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
  currentSquad: "https://www.mbft.in/p/mohun-bagan-squad.html",
  squadHistory: "https://www.mbft.in/2024/01/Mohun-Bagan-Squad-Over-The-Years.html",
  reserves: "https://www.mbft.in/p/mohun-bagan-squad-2.html",
  u18: "https://www.mbft.in/p/mohun-bagan-squad-3.html",
  u16: "https://www.mbft.in/p/mohun-bagan-squad-4.html",
  u14: "https://www.mbft.in/p/mohun-bagan-squad-5.html",
  matches: "https://www.mbft.in/p/mohun-bagan-matches.html",
  trophies: "https://www.mbft.in/2023/07/mohun-bagan-trophy-cabinet.html",
  latest: "https://www.mbft.in"
};

/* ===============================
   FETCH & CLEAN ARTICLE BODY
================================ */

async function fetchArticle(url) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  let text =
    $(".post-body").text() ||
    $(".page-body").text() ||
    $(".entry-content").text() ||
    "";

  text = text.replace(/\s+/g, " ").trim();
  return text;
}

/* ===============================
   TRY TO FIND ANSWER
================================ */

function findAnswer(text, keyword) {
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

  const who =
    message.match(/who is (.+)/i) ||
    message.match(/did (.+) play/i) ||
    message.match(/has (.+) ever played/i);

  if (who) {
    const name = who[1].replace("for mohun bagan", "").trim();

    // Try current squad
    let text = await fetchArticle(LINKS.currentSquad);
    let ans = findAnswer(text, name);

    if (ans) return res.json({ reply: ans });

    // Try history
    text = await fetchArticle(LINKS.squadHistory);
    ans = findAnswer(text, name);

    if (ans) return res.json({ reply: ans });

    // Redirect
    return res.json({
      reply: `You can verify Mohun Bagan player history here:
${LINKS.squadHistory}`
    });
  }

  /* ===============================
     CURRENT SQUAD / CAPTAIN
  =============================== */

  if (
    q.includes("current squad") ||
    q.includes("senior squad") ||
    q.includes("current team") ||
    q.includes("captain") ||
    q.includes("coach")
  ) {
    const text = await fetchArticle(LINKS.currentSquad);
    if (text) return res.json({ reply: text });

    return res.json({
      reply: `View the official current squad here:
${LINKS.currentSquad}`
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
    const text = await fetchArticle(LINKS.matches);
    return res.json({ reply: text || LINKS.matches });
  }

  /* ===============================
     TROPHIES
  =============================== */

  if (q.includes("trophy") || q.includes("titles")) {
    const text = await fetchArticle(LINKS.trophies);
    return res.json({ reply: text || LINKS.trophies });
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
    reply: "Ask me anything related to Mohun Bagan – squad, players, matches or history."
  });
});

/* ===============================
   HEALTH CHECK
================================ */

app.get("/", (_, res) => {
  res.send("Mr. MBFT backend running – try answer first, redirect if needed");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
