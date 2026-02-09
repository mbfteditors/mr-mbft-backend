import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   BASIC KNOWLEDGE (VERY LIMITED)
================================ */

const BASIC_KNOWLEDGE = [
  {
    keywords: ["what is mbft", "about mbft"],
    reply:
      "MBFT—Mariners’ Beyond Field Talks—is a fan-driven platform created by and for Mohun Bagan supporters, covering history, squads, matches, and exclusive content."
  },
  {
    keywords: ["what is mohun bagan"],
    reply:
      "Mohun Bagan Athletic Club, founded in 1889, is one of the oldest and most iconic football clubs in India."
  },
  {
    keywords: ["who are you", "who r u", "mr mbft"],
    reply:
      "Ami Mr. MBFT—tomake shobcheye relevant Mohun Bagan content e guide korar jonnei ekhane 🟢🔴"
  }
];

/* ===============================
   ARTICLE MAP (PRIORITY BASED)
================================ */

const ARTICLE_MAP = [
  {
    id: "current_squad",
    priority: 100,
    keywords: ["current squad", "senior squad", "team list", "players"],
    url: "https://www.mbft.in/p/mohun-bagan-squad.html",
    reply:
      "Hello Mariner 🟢🔴\nCurrent squad ta dekhte chaicho? Besh bhalo.\nYou’ll find the complete Mohun Bagan squad here:"
  },
  {
    id: "trophy_cabinet",
    priority: 95,
    keywords: ["trophy", "trophies", "silverware", "titles"],
    url: "https://www.mbft.in/p/trophy-cabinet.html",
    reply:
      "Eita shob Mariner’er gorber jayga.\nMohun Bagan’s complete trophy cabinet is right here:"
  },
  {
    id: "matches",
    priority: 94,
    keywords: ["match", "fixture", "schedule", "table"],
    url: "https://www.mbft.in/p/mohun-bagan-matches.html",
    reply:
      "Match niye khobor lagbe? Got you, Mariner.\nAll upcoming matches and league details are updated here:"
  },
  {
    id: "transfer_news",
    priority: 93,
    keywords: ["transfer", "signing", "rumour", "exclusive"],
    url: "https://www.mbft.in/search/label/MBFT-Exclusives",
    reply:
      "Transfer niye curiosity thaka tai shabhabik.\nAll the latest Mohun Bagan updates and MBFT exclusives are here:"
  },
  {
    id: "squad_history",
    priority: 90,
    keywords: ["over the years", "past players", "ever played", "former players"],
    url: "https://www.mbft.in/2024/01/Mohun-Bagan-Squad-Over-The-Years.html",
    reply:
      "Bhalo question, Mariner.\nMohun Bagan’er squad over the years ekhane neatly documented ache:"
  },
  {
    id: "history_origin",
    priority: 85,
    keywords: ["origin", "foundation", "how it started"],
    url: "https://www.mbft.in/2024/03/Why-MohunBagan-EP1.html",
    reply:
      "Shuru ta jana dorkar, Mariner.\nHere’s a detailed look at how Mohun Bagan’s journey began:"
  },
  {
    id: "legends",
    priority: 80,
    keywords: ["legend", "legends", "greatest players"],
    url: "https://www.mbft.in/p/legends.html",
    reply:
      "Ei club ta legends chara bhabha jaye na.\nYou can explore Mohun Bagan’s legends here:"
  },
  {
    id: "match_preview",
    priority: 75,
    keywords: ["preview", "match preview"],
    url: "https://www.mbft.in/search/label/Match%20Preview",
    reply:
      "Match er age mood set korte hole—this is the place.\nLatest Mohun Bagan match previews are available here:"
  },
  {
    id: "match_review",
    priority: 74,
    keywords: ["review", "match review"],
    url: "https://www.mbft.in/search/label/Match%20Review",
    reply:
      "Match miss hoye geche? Chinta nei.\nAll recent Mohun Bagan match reviews are right here:"
  }
];

/* ===============================
   CHAT ENDPOINT
================================ */

app.post("/chat", (req, res) => {
  const message = (req.body.message || "").toLowerCase();

  /* ATTITUDE RULES */
  if (message.includes("east bengal")) {
    return res.json({
      reply:
        "Ei jaygay irrelevant East Bengal niye kotha hoy na.\nJOY MOHUN BAGAN 🟢🔴"
    });
  }

  if (message.includes("atk")) {
    return res.json({
      reply: "2026 hoye geche… ekhono 2020 tei aacho naki? 😏"
    });
  }

  /* BASIC KNOWLEDGE */
  for (const item of BASIC_KNOWLEDGE) {
    if (item.keywords.some(k => message.includes(k))) {
      return res.json({ reply: item.reply });
    }
  }

  /* ARTICLE MATCHING (HIGHEST PRIORITY WINS) */
  const sortedArticles = ARTICLE_MAP.sort(
    (a, b) => b.priority - a.priority
  );

  for (const article of sortedArticles) {
    if (article.keywords.some(k => message.includes(k))) {
      return res.json({
        reply: `${article.reply}\n${article.url}`
      });
    }
  }

  /* HISTORY GAP (1950–2026) */
  if (message.match(/\b(195|196|197|198|199|200|201)\d\b/)) {
    return res.json({
      reply:
        "Bujhte parchi, ei period ta niye interest ache.\nDon’t worry—this phase will be covered in detail on MBFT very soon."
    });
  }

  /* DEFAULT FALLBACK */
  return res.json({
    reply:
      "Hello Mariner 🟢🔴\nAmi tomake shobcheye relevant MBFT article e guide korte pari.\nTry asking about squads, matches, trophies, or Mohun Bagan history."
  });
});

/* ===============================
   HEALTH CHECK
================================ */

app.get("/", (_, res) => {
  res.send("Mr. MBFT Tour Guide backend v1 running");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
