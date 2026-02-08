import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   LINKS
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
   SAFE CONTENT FETCH
================================ */

async function fetchFilteredContent(url) {
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

  // 🚫 REMOVE JUNK
  const bannedWords = [
    "Home", "Archives", "Era", "MBFT Specials", "Categories",
    "Subscribe", "Privacy Policy", "Copyright"
  ];

  let lines = raw.split(".").map(l => l.trim());

  lines = lines.filter(line =>
    line.length > 20 &&
    !bannedWords.some(b => line.includes(b))
  );

  return lines.join(". ");
}

/* ===============================
   PLAYER LINE FINDER
================================ */

function findPlayer(content, name) {
  const lines = content.split(".");
  for (const line of lines) {
    if (line.toLowerCase().includes(name.toLowerCase())) {
      return line.trim() + ".";
    }
  }
  return null;
}

/* ===============================
   CHAT
================================ */

app.post("/chat", async (req, res) => {
  const message = (req.body.message || "").trim();
  const q = message.toLowerCase();

  /* EAST BENGAL */
  if (q.includes("east bengal")) {
    return res.json({
      reply: "We don't talk about irrelevant East Bengal here, JOY MOHUN BAGAN 🟢🔴"
    });
  }

  /* ATK */
  if (q.includes("atk")) {
    return res.json({
      reply: "It's 2026 and you are still stuck in 2020 😏"
    });
  }

  /* CURRENT / SENIOR SQUAD */
  if (
    q.includes("current squad") ||
    q.includes("senior squad") ||
    q.includes("mohun bagan squad") ||
    q.includes("current team") ||
    q.includes("team list")
  ) {
    const content = await fetchFilteredContent(LINKS.hidden);

    if (content) {
      return res.json({ reply: content });
    }

    return res.json({
      reply: `You can view the official Mohun Bagan senior squad here:
${LINKS.current}`
    });
  }

  /* PLAYER QUERIES */
  const who =
    message.match(/who is (.+)/i) ||
    message.match(/did (.+) play/i);

  if (who) {
    const name = who[1].replace("for mohun bagan", "").trim();

    let content = await fetchFilteredContent(LINKS.hidden);
    let found = findPlayer(content, name);

    if (found) return res.json({ reply: found });

    content = await fetchFilteredContent(LINKS.history);
    found = findPlayer(content, name);

    if (found) return res.json({ reply: found });

    return res.json({
      reply: `I couldn’t confirm this from verified data.
You can check the full Mohun Bagan squad history here:
${LINKS.history}`
    });
  }

  /* MATCHES */
  if (q.includes("match") || q.includes("fixture")) {
    return res.json({ reply: LINKS.matches });
  }

  /* TROPHIES */
  if (q.includes("trophy")) {
    return res.json({ reply: LINKS.trophies });
  }

  /* LATEST */
  if (q.includes("latest") || q.includes("news")) {
    return res.json({
      reply: `For the latest Mohun Bagan updates:
${LINKS.latest}`
    });
  }

  return res.json({
    reply: "Please ask about Mohun Bagan, its squad, players, or history."
  });
});

/* ===============================
   HEALTH
================================ */

app.get("/", (_, res) => {
  res.send("Mr. MBFT backend running – clean extraction enabled");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
