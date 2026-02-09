import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   BASIC KNOWLEDGE (VERY LIMITED)
================================ */

const BASIC_KNOWLEDGE = {
  "what is mbft": "MBFT (Mariners' Beyond Field Talks) is a fan-driven digital platform dedicated to Mohun Bagan, covering news, history, squads, matches, and exclusive fan content.",
  "what is mohun bagan": "Mohun Bagan Athletic Club, founded in 1889, is one of the oldest and most iconic football clubs in India.",
  "who are you": "I am Mr. MBFT, your official MBFT Tour Guide 🟢🔴",
  "what is mr mbft": "Mr. MBFT is an MBFT Tour Guide designed to help you find the right Mohun Bagan content on MBFT."
};

/* ===============================
   MBFT ARTICLE MAP (THE HEART)
================================ */

const LINKS = {
  currentSquad: {
    keywords: ["current squad", "senior squad", "team list", "players"],
    url: "https://www.mbft.in/p/mohun-bagan-squad.html",
    message: "Hello Mariner 🟢🔴\nPlease visit the link below to check our current Mohun Bagan squad:"
  },
  squadHistory: {
    keywords: ["over the years", "past players", "did", "ever played"],
    url: "https://www.mbft.in/2024/01/Mohun-Bagan-Squad-Over-The-Years.html",
    message: "You can verify Mohun Bagan’s squad history here:"
  },
  reserves: {
    keywords: ["reserve"],
    url: "https://www.mbft.in/p/mohun-bagan-squad-2.html",
    message: "Please visit the link below to check the Mohun Bagan Reserves squad:"
  },
  u18: {
    keywords: ["u18"],
    url: "https://www.mbft.in/p/mohun-bagan-squad-3.html",
    message: "Please visit the link below to check the Mohun Bagan U18 squad:"
  },
  u16: {
    keywords: ["u16"],
    url: "https://www.mbft.in/p/mohun-bagan-squad-4.html",
    message: "Please visit the link below to check the Mohun Bagan U16 squad:"
  },
  u14: {
    keywords: ["u14"],
    url: "https://www.mbft.in/p/mohun-bagan-squad-5.html",
    message: "Please visit the link below to check the Mohun Bagan U14 squad:"
  },
  matches: {
    keywords: ["match", "fixture", "schedule", "table"],
    url: "https://www.mbft.in/p/mohun-bagan-matches.html",
    message: "You can find the latest Mohun Bagan matches and schedule here:"
  },
  trophies: {
    keywords: ["trophy", "trophies", "titles"],
    url: "https://www.mbft.in/p/trophy-cabinet.html",
    message: "Mohun Bagan have won 261 Official trophies, which include 7 League and 14 Cup Titles. Please visit the link below to explore Mohun Bagan’s trophy cabinet:"
  },
  latest: {
    keywords: ["latest", "news", "update"],
    url: "https://www.mbft.in",
    message: "Hi, You are at the best place for the latest Mohun Bagan news and updates, visit:"
  }
};

/* ===============================
   CHAT ENDPOINT
================================ */

app.post("/chat", (req, res) => {
  const message = (req.body.message || "").toLowerCase();

  /* ATTITUDE RULES */
  if (message.includes("east bengal")) {
    return res.json({
      reply: "We don't talk about irrelevant East Bengal here, JOY MOHUN BAGAN 🟢🔴"
    });
  }

  if (message.includes("atk")) {
    return res.json({
      reply: "It's 2026 and you are still stuck in 2020 😏"
    });
  }

  /* BASIC KNOWLEDGE */
  for (const key in BASIC_KNOWLEDGE) {
    if (message.includes(key)) {
      return res.json({ reply: BASIC_KNOWLEDGE[key] });
    }
  }

  /* ARTICLE REDIRECT LOGIC */
  for (const section in LINKS) {
    const { keywords, url, message: replyText } = LINKS[section];
    if (keywords.some(k => message.includes(k))) {
      return res.json({
        reply: `${replyText}\n${url}`
      });
    }
  }

  /* DEFAULT FALLBACK */
  return res.json({
    reply: "Hello Mariner 🟢🔴\nI can guide you to the right MBFT article. Try asking about squads, matches, trophies, or latest updates."
  });
});

/* ===============================
   HEALTH CHECK
================================ */

app.get("/", (_, res) => {
  res.send("Mr. MBFT Tour Guide backend running");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
