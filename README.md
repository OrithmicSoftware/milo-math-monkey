# 🐵 Milo the Math Monkey

> **Count it right… or watch Milo take a tumble!**

Milo is a goofy, overconfident monkey who loves numbers — but always gets into trouble using them. Kids help Milo solve simple math problems before things go hilariously wrong!

---

## 🎮 Mini-Games

| Game | Topic | What goes wrong? |
|---|---|---|
| 🎈 **Counting Chaos** | Counting 1–20 | Too many balloons — Milo flies away! |
| 📏 **Measuring Mayhem** | Size & comparison | Wrong answer — Milo falls into jelly! |
| 🍌 **Sharing Snacks** | Addition & subtraction | Wrong share — characters roll off with ALL the snacks! |
| 🙋 **Who Has More?** | Count + comparison | Wrong guess — Milo slips on snack crumbs! |
| 👀 **What Is More?** | Comparison | Wrong pick — Milo mixes up the bigger group! |
| ➕➖ **Compound Crunch** | Compound operations | Wrong step — Milo loses track of two-step math! |
| ⚖️ **Weight Trouble** | Heavier & lighter | Wrong comparison — Milo gets launched off the seesaw! |

## 🧠 Learning Focus

- Counting (1–20)
- Count and compare (who has more)
- Comparison (what is more)
- Basic addition & subtraction
- Compound operations (x + y - z)
- Size and comparison
- Early logic and estimation

## 💡 More Mini-Game Ideas

- Number order race: put 3 numbers in smallest-to-biggest order
- Missing number hop: fill in the blank in a number pattern (e.g., 2, 4, _, 8)
- Quick estimate: pick which group has about 10 items

---

## 🚀 Playing the Game

Open `index.html` in any modern browser — no build step required.

```bash
# macOS / Linux
open index.html

# Windows
start index.html
```

---

## 🌐 Deployments

| Environment | URL | Triggered by |
|---|---|---|
| **Production** | `https://orithmicsoftware.github.io/milo-math-monkey/` | Push to `main` |
| **Staging** | `https://orithmicsoftware.github.io/milo-math-monkey/staging/` | Push to any feature branch or PR |

Both environments are deployed automatically to GitHub Pages via GitHub Actions.  
The **staging** environment shows a visible pink banner at the top of the page so it cannot be confused with production.

### How it works

```
main branch  ──push──▶  deploy-production.yml  ──▶  gh-pages /          (production)
feature/*    ──push──▶  deploy-staging.yml     ──▶  gh-pages /staging/  (staging)
pull request ──open──▶  deploy-staging.yml     ──▶  gh-pages /staging/  + PR comment
```

GitHub Pages is configured to serve the `gh-pages` branch.

---

## 🗂 Project Structure

```
├── index.html          # Game UI (all screens)
├── style.css           # Colorful, kid-friendly styles & animations
├── game.js             # Game logic for all four mini-games
├── config.js           # Environment flag (production | staging)
├── sounds/
│   └── fail/           # Wrong-answer sounds (auto-rotated in order)
└── .github/
    └── workflows/
        ├── deploy-production.yml   # Production deployment
        └── deploy-staging.yml      # Staging deployment + PR comment
```

Wrong-answer sound effects are loaded from `sounds/fail/` and rotated automatically.
