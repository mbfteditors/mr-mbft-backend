import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   ALL MBFT LINKS
================================ */

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

/* ===============================
   SIMPLE FETCH + CLEAN TEXT
================================ */

async function fetchPageText(url) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  return $("body").text().replace(/\s+/g, " ").trim();
}

/* ===============================
   TRY ANSWERING FROM A PAGE
================================ */

function tryAnswerFromContent(content, query) {
  const q = query.toLowerCase();
  const sentences = content.split(".");

  for (const s of sentences) {
    if (s.toLowerCase().includes(q)) {
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

  /* 🔴 EAST BENGAL RULE */
  if (q.includes("east bengal")) {
    return res.json({
      reply: "We don't talk about irrelevant East Bengal here, JOY MOHUN BAGAN 🟢🔴"
    });
  }

  /* 😏 ATK RULE */
  if (q.includes("atk")) {
    return res.json({
      reply: "It's 2026 and you are still stuck in 2020 😏"
    });
  }

  /* ===============================
     PLAYER QUESTIONS
  ================================ */

  const whoMatch =
    message.match(/who is (.+)/i) ||
    message.match(/did (.+) play/i) ||
    message.match(/has (.+) ever played/i);

  if (whoMatch) {
    const name = whoMatch[1].replace("for mohun bagan", "").trim();

    // 1️⃣ Try hidden page first
    const hiddenText = await fetchPageText(LINKS.hidden);
    const foundHidden = tryAnswerFromContent(hiddenText, name);

    if (foundHidden) {
      return res.json({ reply: foundHidden });
    }

    // 2️⃣ Try all-time squad page
    const historyText = await fetchPageText(LINKS.history);
    const foundHistory = tryAnswerFromContent(historyText, name);

    if (foundHistory) {
      return res.json({ reply: foundHistory });
    }

    // 3️⃣ FINAL fallback → redirect
    return res.json({
      reply: `I could not find a confirmed answer directly.
You can verify the full historical records here:
${LINKS.history}`
    });
  }

  /* ===============================
     SENIOR SQUAD / CAPTAIN
  ================================ */

  if (q.includes("senior squad") || q.includes("complete squad") || q.includes("captain")) {
    const hiddenText = await fetchPageText(LINKS.hidden);
    const answer = tryAnswerFromContent(hiddenText, "squad");

    if (answer) {
      return res.json({ reply: hiddenText });
    }

    return res.json({
      reply: `You can view the official current senior squad here:
${LINKS.current}`
    });
  }

  /* ===============================
     YOUTH & RESERVES
  ================================ */

  if (q.includes("reserve")) {
    const t = await fetchPageText(LINKS.reserves);
    return res.json({ reply: t || LINKS.reserves });
  }

  if (q.includes("u18")) {
    const t = await fetchPageText(LINKS.u18);
    return res.json({ reply: t || LINKS.u18 });
  }

  if (q.includes("u16")) {
    const t = await fetchPageText(LINKS.u16);
    return res.json({ reply: t || LINKS.u16 });
  }

  if (q.includes("u14")) {
    const t = await fetchPageText(LINKS.u14);
    return res.json({ reply: t || LINKS.u14 });
  }

  /* ===============================
     MATCHES / TABLE
  ================================ */

  if (q.includes("match") || q.includes("fixture") || q.includes("table")) {
    const t = await fetchPageText(LINKS.matches);
    return res.json({ reply: t || LINKS.matches });
  }

  /* ===============================
     TROPHIES
  ================================ */

  if (q.includes("trophy") || q.includes("titles")) {
    const t = await fetchPageText(LINKS.trophies);
    return res.json({ reply: t || LINKS.trophies });
  }

  /* ===============================
     LATEST NEWS
  ================================ */

  if (q.includes("latest") || q.includes("news")) {
    const t = await fetchPageText(LINKS.latest);
    return res.json({
      reply: t || `Check latest Mohun Bagan updates here:\n${LINKS.latest}`
    });
  }

  /* ===============================
     FINAL FALLBACK
  ================================ */

  return res.json({
    reply: "Please rephrase your question related to Mohun Bagan."
  });
});

/* ===============================
   HEALTH CHECK
================================ */

app.get("/", (_, res) => {
  res.send("Mr. MBFT backend running with SMART FETCH → REDIRECT logic");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
