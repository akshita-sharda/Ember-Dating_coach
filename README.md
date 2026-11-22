# Love Guru: an AI dating coach that teaches

Most dating apps and "reply generators" hand you a line. **Love Guru teaches you the skill**: what to talk about, what to avoid, how to read signals, how to calm nerves, with short lessons, practice and honest feedback from a coach you choose. Built for everyone 18+: any gender, any orientation, any age.

## What's inside

| Area | What it does |
|---|---|
| **Onboarding** | 18+ gate, age range, what you're looking for, where you get stuck, then pick your coach |
| **Dashboard** | Your next lesson (chosen from what you said you struggle with), progress rings, streak |
| **Learning path** | 9 short lessons (calm mindset, openers, keeping it flowing, first-date topics, what to avoid, reading signals, boundaries, asking out, after the date). Each ends with a practice moment and personalised feedback |
| **Coach chat** | Ask anything, any time. Replies come with tips, exact lines to try, and follow-up questions |
| **3D coaches** | Sunny (warm older sibling), Sage (calm mentor), Rio (straight-talking friend). Same honest advice, different voice; switch any time. Their heads follow your cursor, they blink, wave, and talk while they reply |
| **Tools** | Reply helper, chat decoder, practice chats (with characters), profile polish |
| **Profile** | Switch coach, edit preferences, texting style, saved lines, light/dark theme, erase data |

Privacy: the server stores nothing. Progress, chat and preferences live in the browser's localStorage.

## Run it

You need Python 3.10+ and Node 20.19+.

```bash
# 1) backend (terminal 1)
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt     # macOS/Linux: .venv/bin/python -m pip ...
copy .env.example .env                                           # optional: add a free Gemini key
.venv\Scripts\python.exe -m uvicorn app.main:app --reload       # http://127.0.0.1:8000  (docs: /docs)

# 2) frontend (terminal 2)
cd frontend
npm.cmd install            # Windows PowerShell; on macOS/Linux just: npm install
npm.cmd run dev            # http://localhost:5173
```

The 3D scene needs **no extra package**: it is a small WebGL2 renderer written for this project (`frontend/src/gfx`). If a browser has no WebGL, coaches fall back to a 2D avatar and everything still works.

### AI engine (free first)

`PROVIDER=auto` in `backend/.env`: uses Gemini's free tier if `GEMINI_API_KEY` is set, otherwise local Ollama if running, otherwise the built-in **offline coach** (rule-based, with a knowledge base and lesson scoring). The app is fully usable with no key at all.

## Architecture

```
backend/app
  main.py            thin FastAPI routes (validation, 18+ header, rate limit)
  core/              all logic, stdlib only, unit-tested
    engine.py          safety -> prompt -> AI JSON -> validate -> (one retry) -> offline fallback
    coaches.py         the three coach personalities (tone only; advice is identical)
    curriculum.py      the 9 lessons (cards, do/avoid, practice scenario)
    coaching.py        coach-chat + lesson-feedback prompts, validators, offline handlers
    kb.py              offline coach knowledge base
    safety.py          crisis (helplines, no AI call), boundary, pressure checks
  providers/         Gemini (auto model discovery), Ollama
frontend/src
  router.js          30-line hash router, no dependency
  state.jsx          app state in localStorage
  gfx/               math, geometry, WebGL renderer, figurines, stage (loop, pointer, visibility)
  pages/             Landing, Onboarding, Home, Learn, Lesson, Coach, Tools, Profile
  tools/             reply helper, decoder, practice, profile polish
```

Design principles: inclusive by default (the prompts never assume gender or who you date), honest over flattering, consent first (a "no" is coached as a graceful exit, never a comeback), crisis messages short-circuit the AI.

## Tests

```bash
cd backend
python -m unittest discover -s tests      # 46 tests
python scripts/smoke.py                   # against a running server (checks every endpoint)
```

## Deploy

Backend: any Python host (Render, Railway, Fly). Set `GEMINI_API_KEY`, `TRUST_PROXY=1` behind a proxy. Frontend: `npm run build`; either host `dist/` anywhere (set `VITE_API_URL` first) or let the backend serve it (it mounts `frontend/dist` automatically).

*Love Guru coaches conversation and confidence. It is not therapy.*
