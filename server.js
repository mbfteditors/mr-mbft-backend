import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   MBFT SOURCE LINKS
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
   SAFE CONTENT EXTRACTION
================================ */

async function fetchCleanContent(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Blogger-safe content selectors
    let content =
      $(".post-body").text() ||
      $(".page-body").text() ||
      $(".entry-content").text() ||
      "";

    content = content.replace(/\s+/g, " ").trim();

    // Reject junk / navigation content
    if (
      content.length < 200 ||
      content.includes("Home MBFT") ||
      content.includes("Archives") ||
      content.includes("Era") ||
      content.includes("Categories")
    ) {
      return "";
    }

    return content;
  } catch {
    return "";
  }
}

/* ===============================
   SIMPLE FACT LOOKUP
================================ */

function findLine(content, keyword) {
  const lines = content.split(".");
  for (const line of lines) {
    if (line.toLowerCase().includes(keyword.toLowerCase())) {
      return line.trim() + ".";
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

    // 1️⃣ Hidden page (current squad)
    let content = await fetchCleanContent(LINKS.hidden);
    let answer = findLine(content, name);

    if (answer) return res.json({ reply: answer });

    // 2️⃣ All-time squad
    content = await fetchCleanContent(LINKS.history);
    answer = findLine(content, name);

    if (answer) return res.json({ reply: answer });

    // 3️⃣ Redirect
    return res.json({
      reply: `I couldn’t find a confirmed record for ${name}.
You can verify the full Mohun Bagan squad history here:
${LINKS.history}`
    });
  }

  /* ===============================
     SENIOR SQUAD
  ================================ */

  if (q.includes("senior squad") || q.includes("complete squad")) {
    const content = await fetchCleanContent(LINKS.hidden);

    if (content) return res.json({ reply: content });

    return res.json({
      reply: `You can view the official current senior squad here:
${LINKS.current}`
    });
  }

  /* ===============================
     YOUTH & RESERVES
  ================================ */

  if (q.includes("reserve")) {
    const content = await fetchCleanContent(LINKS.reserves);
    return res.json({ reply: content || LINKS.reserves });
  }

  if (q.includes("u18")) {
    const content = await fetchCleanContent(LINKS.u18);
    return res.json({ reply: content || LINKS.u18 });
  }

  if (q.includes("u16")) {
    const content = await fetchCleanContent(LINKS.u16);
    return res.json({ reply: content || LINKS.u16 });
  }

  if (q.includes("u14")) {
    const content = await fetchCleanContent(LINKS.u14);
    return res.json({ reply: content || LINKS.u14 });
  }

  /* ===============================
     MATCHES / FIXTURES
  ================================ */

  if (q.includes("match") || q.includes("fixture") || q.includes("table")) {
    const content = await fetchCleanContent(LINKS.matches);
    return res.json({ reply: content || LINKS.matches });
  }

  /* ===============================
     TROPHIES
  ================================ */

  if (q.includes("trophy") || q.includes("titles")) {
    const content = await fetchCleanContent(LINKS.trophies);
    return res.json({ reply: content || LINKS.trophies });
  }

  /* ===============================
     LATEST NEWS
  ================================ */

  if (q.includes("latest") || q.includes("news")) {
    return res.json({
      reply: `For the latest Mohun Bagan updates, visit:
${LINKS.latest}`
    });
  }

  /* ===============================
     FINAL FALLBACK
  ================================ */

  return res.json({
    reply: "Please ask something related to Mohun Bagan."
  });
});

/* ===============================
   HEALTH CHECK
================================ */

app.get("/", (_, res) => {
  res.send("Mr. MBFT backend running – clean fetch + smart redirect enabled");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
