# 🎯 PrepDost — AI-Powered Interview Prep Platform

> A full-stack platform combining AI mock interviews, USACO-style coding practice, and core CS MCQ quizzes — built for placement-ready students.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
  - [AI Mock Interview Engine](#1-ai-mock-interview-engine)
  - [Coding Practice (Code Editor)](#2-coding-practice-code-editor)
  - [MCQ Quiz Bank](#3-mcq-quiz-bank)
  - [Authentication](#4-authentication)
  - [Home / Landing Page](#5-home--landing-page)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Database Models](#database-models)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment](#deployment)

---

## Overview

**PrepDost** is a premium interview preparation workspace designed for college students targeting placements, hackathons, and software engineering roles.

It offers three core pillars:

| Pillar | What it does |
|---|---|
| 🤖 AI Mock Interviews | Gemini-powered structured rounds with live evaluation & session reports |
| 💻 Coding Practice | Monaco-based editor running C++/Java/Python against USACO-scraped test cases |
| 📚 MCQ Quiz Bank | Subject-wise MCQs for DSA, OS, DBMS, CN, Computer Organization |

---

## Features

### 1. AI Mock Interview Engine

The interview system (`/interview`) is the most complete feature of the platform.

#### Round Types

| Round | Phases |
|---|---|
| **DSA** | `clarification → dsa_link → code → dry_run → complexity` |
| **System Design** | `requirements → estimation → hld → deep_dive → tradeoffs` |
| **Behavioural** | `question → star_probe → ownership_probe → result_probe` |
| **Project** | `overview → architecture → challenge → tradeoffs → impact → reflection` |
| **Core CS** | `fundamentals → example → edge_cases → tradeoffs` |

#### Lobby & Configuration
- Select interview topic (DSA, Behavioral, System Design, Project Experience, Resume Session, Core CS)
- For **DSA** rounds: a LeetCode problem is automatically selected (from DB or fallback bank)
- For **Project Experience** rounds: optionally paste a **GitHub repo URL** — the AI fetches and reads the repo to ask deep ownership questions about *your actual code*
- For **Resume Session** rounds: upload a **PDF/DOCX resume** — the AI parses it and tailors the entire interview around your real projects and experience

#### Live Interview UI
- **Chat panel** — real-time conversation with the AI interviewer character
- **Monaco code editor** — embedded for DSA rounds (C++, Java, Python), with starter templates
- **Live code monitoring** — every 60 seconds the AI reviews the current code and asks a targeted follow-up question (deduplicated by SHA-1 hash)
- **Screenshot upload** — for DSA rounds, submit a screenshot of your LeetCode test results; Gemini Vision analyzes pass/fail and gives feedback
- **Session timer** — countdown tracking elapsed interview time
- **Whiteboard** — freehand canvas (pen + eraser + clear) for drawing diagrams
- **Sticky notes panel** — in-session notepad persisted to React state
- **Full transcript panel** — scrollable log of all interviewer + candidate messages
- **Participants panel** — shows connected WebRTC users

#### Voice & Audio
- **AI voice readout** — every interviewer message is spoken via the Web Speech Synthesis API (English, chunked for long responses, queued)
- **Push-to-talk / continuous mic** — Web Speech Recognition transcribes candidate speech into the answer box in real-time
- **WebRTC peer audio** — Socket.io signaling + `simple-peer` for live human-to-human voice calls (candidate + interviewer roles)
- **Camera toggle** — optional webcam preview via `getUserMedia`

#### AI Evaluation (Dual-Model Pipeline)
Every candidate answer goes through two parallel Gemini 2.5 Flash calls:

1. **Evaluator model** — silently scores on four axes (0–25 each):
   - `correctness` — accuracy of the answer
   - `complexity` — depth of analysis / tradeoffs
   - `edgeCases` — awareness of failure modes
   - `communication` — structure and clarity
   - → Returns `total` (0–100), `strengths[]`, `gaps[]`, `nextHint`

2. **Conductor model** — acts as the interviewer character, decides:
   - `ask_followup` — score < 65 and no follow-up yet given
   - `next_phase` — advance to the next phase in the sequence
   - `end_round` — all phases complete

Both models have graceful **offline fallbacks** (heuristic scoring + template responses) so the system works even without a Gemini API key.

#### Hints
- Candidates can request hints at any phase (`POST /:id/hint`)
- The hint is pulled from the evaluator's `nextHint` field or a phase-appropriate default

#### Post-Session Report
After a session ends:
- `overallScore` — averaged from all per-message evaluations
- `scoreByPhase` — breakdown of scores per interview phase
- `strengths[]` — deduplicated strong points across the session
- `weaknesses[]` — deduplicated gaps across the session
- `studyPlan[]` — up to 3 prioritized topics with resources (built from identified weaknesses + round-type-specific fallback resources)

#### GitHub Repo Analysis
When a GitHub URL is provided:
- Fetches repo metadata from the GitHub API (name, description, topics, primary language)
- Generates a human-readable summary with Gemini
- Injects repo context into the interview question and AI system prompt

#### Resume Analysis
When a resume file is uploaded:
- Accepts PDF and DOCX (via Gemini's document understanding)
- Extracts: `candidateSummary`, `projects[]`, `skills[]`, `experienceHighlights[]`, `questionFocusAreas[]`
- Tailors the `project` round entirely around the candidate's real experience

---

### 2. Coding Practice (Code Editor)

The problems list (`/problems`) and editor (`/problems/:id`) form a complete online judge experience.

#### Problems Browser
- Lists all scraped problems from the database
- Filter by: `division` (Bronze/Silver/Gold/Platinum), `source`, `difficulty`
- Only problems with usable test cases and descriptions ≥ 120 characters are shown (auto-filtered)

#### Monaco Code Editor
- Powered by `@monaco-editor/react`
- Supports **C++**, **Java**, **Python** with full syntax highlighting
- Starter code templates pre-loaded for each language
- Problem statement, constraints, and sample test cases shown alongside

#### Code Execution
Two-tier execution strategy:
1. **Local execution** (preferred) — spawns `g++`, `javac`/`java`, or `python3` as child processes
   - C++: compiled with `-O2` optimization
   - Java: compiled with `javac`, run with `-Xmx256m -Xss64m`
   - Python: uses `python` (Windows) or `python3` (Linux/Mac)
2. **Configured Piston fallback** — if local compilers aren't found, uses `PISTON_API_URL` when pointed at a self-hosted or authorized Piston instance

#### Custom Test Runner (`/run`)
- Run code against any custom stdin input
- Returns: `stdout`, `stderr`, `status` (`success` / `error` / `tle`), and execution time

#### Full Submission (`/submissions`)
- Runs code against **all** test cases in the database (including hidden ones)
- For each test case: compares trimmed actual vs. expected output
- Returns: `passed` count, `total`, `time`, `status` (`accepted` / `wrong_answer` / `tle` / `error`)
- Visible test cases show `input`, `expected`, `actual`, `stderr`
- Hidden test cases only reveal `passed`/`failed` — no leakage

#### USACO Scraper
- `scripts/scrapeUsaco.js` — a standalone scraper using `cheerio` + `axios`
- Pulls problems from `usaco.org` contest archives
- Extracts: title, problem description (HTML), test cases (`.zip` download + extraction), difficulty, division, topic, contest info
- Cleanup script: `scripts/cleanup_broken_usaco.js` — audits and optionally deletes problems with bad descriptions or no test cases

---

### 3. MCQ Quiz Bank

The MCQ module (`/mcq`) provides exam-style practice for core CS theory.

#### Subjects Covered
| Subject | Domain Tag |
|---|---|
| Data Structures & Algorithms | DSA |
| Computer Organization | Computer Architecture |
| Computer Networks | CN |
| Operating Systems | OS |

#### Flow
1. **Subject selection** — pick a topic from animated cards
2. **Question list** — browse all questions for the subject, grouped by sub-domain, with live search
3. **Quiz mode** — 10 randomly selected questions (or start from a specific question)
4. **Results screen** — score, accuracy %, grade (Excellent / Good / Fair / Needs Work), animated progress bar

#### Quiz Features
- Questions rendered with **KaTeX** math support (`$...$` and `$$...$$` delimiters)
- Immediate feedback after each answer: correct answer highlighted green, wrong answer red
- **Explanation** shown below each answered question
- Animated progress bar
- HTML entity cleaning for scraped question content

---

### 4. Authentication

Simple JWT-based auth at `/login`:
- Register / Login with email + password
- JWT stored in `localStorage` as `token`
- Username stored in `localStorage` as `userName`
- Used for session ownership (`userId`) in interview sessions

---

### 5. Home / Landing Page

A polished marketing landing page (`/`) built with Framer Motion animations:
- Hero section with gradient blur, badge, headline, and stat counters (120K+ sessions, 26K learners, 91% placement readiness)
- Feature cards for the three main modules
- Analytics / tracking section (streaks, smart recommendations, readiness score)
- Platform preview section
- Testimonials section
- FAQ accordion
- CTA section

---

## Tech Stack

### Frontend (`/client`)

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Real-time | Socket.io Client + WebRTC (`simple-peer`) |
| Math rendering | KaTeX |
| Voice | Web Speech API (Recognition + Synthesis) |

### Backend (`/server`)

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express 5 |
| Database | MongoDB + Mongoose |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Real-time | Socket.io |
| Job Queue | BullMQ + IORedis |
| Rate limiting | express-rate-limit |
| File uploads | Multer |
| Auth | JWT (`jsonwebtoken`) |
| Scraping | Axios + Cheerio |
| Process execution | `child_process.exec` |

### Infrastructure

| Service | Purpose |
|---|---|
| MongoDB | Primary data store |
| Redis | BullMQ job queue (optional) |
| Docker Compose | Local MongoDB + Redis |
| Vercel | Frontend deployment + serverless API proxy |
| Piston API | Optional self-hosted/authorized code execution fallback |

---

## Project Structure

```
interviewPrep/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx           # Landing page
│       │   ├── Login.jsx          # Auth page
│       │   ├── Interview.jsx      # AI mock interview (main feature, ~1700 lines)
│       │   ├── CodeEditor.jsx     # Problem editor + judge
│       │   ├── ProblemsList.jsx   # USACO problems browser
│       │   └── MCQ.jsx            # MCQ quiz engine
│       ├── components/
│       │   ├── HeroVisual.jsx     # Animated hero illustration
│       │   ├── AccentHeading.jsx  # Styled heading component
│       │   └── ui/                # Design system: Button, Badge, Card, Shell, Section
│       ├── lib/
│       │   └── api.js             # API URL helpers + socket base URL
│       ├── App.jsx                # Router setup
│       └── index.css              # Global styles + design tokens
│
├── server/                    # Express backend (ESM)
│   ├── index.js               # Entry point (HTTP server + Socket.io)
│   ├── worker.js              # BullMQ worker (async job processing)
│   └── src/
│       ├── app.js             # Express app, middleware, routes, DB connection
│       ├── routes/
│       │   ├── auth.js        # POST /api/auth/register, /api/auth/login
│       │   ├── interview.js   # AI interview session CRUD
│       │   ├── judge.js       # Problems + code execution + submissions
│       │   └── mcq.js         # MCQ questions serving
│       ├── services/
│       │   ├── interviewService.js  # Core AI interview logic (~1200 lines)
│       │   ├── llmService.js        # Legacy simple LLM service
│       │   └── executionService.js  # Code execution (local + optional Piston fallback)
│       ├── models/
│       │   ├── User.js
│       │   ├── Problem.js
│       │   ├── Submission.js
│       │   ├── Interview.js
│       │   ├── InterviewSession.js
│       │   ├── InterviewMessage.js
│       │   ├── InterviewEvaluation.js
│       │   ├── InterviewQuestion.js
│       │   └── InterviewReport.js
│       └── scripts/
│           ├── scrapeUsaco.js          # USACO problem scraper
│           └── cleanup_broken_usaco.js # Scrape audit/cleanup utility
│
├── api/
│   └── index.mjs              # Vercel serverless entry point
│
├── docker-compose.yml         # MongoDB + Redis local setup
├── vercel.json                # Vercel deployment config
└── package.json               # Root workspace (client + server)
```

---

## API Reference

### Auth — `/api/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Register a new user, returns JWT |
| POST | `/login` | Login, returns JWT |

### AI Interview — `/api/ai/interview`

| Method | Path | Description |
|---|---|---|
| POST | `/start` | Start a new interview session |
| POST | `/answer` | Submit a candidate answer, get AI response + evaluation |
| POST | `/code-feedback` | Submit live code for AI review (DSA rounds) |
| POST | `/resume-analyze` | Upload resume PDF/DOCX, returns parsed context |
| POST | `/live-token` | Create a live voice session token |
| POST | `/:id/hint` | Request a hint for the current phase |
| GET | `/:id` | Get full session state (messages, evaluations) |
| GET | `/:id/report` | Get session performance report |

### Code Judge — `/api/judge`

| Method | Path | Description |
|---|---|---|
| GET | `/problems` | List all visible problems (filter: division, source, difficulty) |
| GET | `/problems/:id` | Get problem with visible test cases |
| POST | `/run` | Run code against custom stdin |
| POST | `/submissions` | Submit code against all test cases |
| GET | `/submissions/:id` | Get submission result |

### MCQ — `/api/mcq`

| Method | Path | Description |
|---|---|---|
| GET | `/questions?subject=dsa` | Get all questions for a subject |

---

## Database Models

| Model | Key Fields |
|---|---|
| `User` | `email`, `password`, `name` |
| `Problem` | `title`, `description`, `testCases[]`, `difficulty`, `division`, `source`, `contest`, `languages[]` |
| `Submission` | `userId`, `problemId`, `code`, `language`, `status`, `results[]`, `time` |
| `InterviewSession` | `userId`, `config{roundType, difficulty, durationMin, company}`, `status`, `currentPhase`, `phaseHistory[]`, `questionSnapshot`, `hintsUsed`, `currentCode` |
| `InterviewMessage` | `sessionId`, `role` (`interviewer`/`user`), `content`, `phase`, `action`, `screenshotUrl` |
| `InterviewEvaluation` | `sessionId`, `messageId`, `scores{correctness, complexity, edgeCases, communication}`, `total`, `strengths[]`, `gaps[]`, `nextHint` |
| `InterviewReport` | `sessionId`, `userId`, `overallScore`, `scoreByPhase{}`, `strengths[]`, `weaknesses[]`, `studyPlan[]` |
| `InterviewQuestion` | `title`, `content`, `round`, `difficulty`, `constraints`, `examples`, `tags[]`, `leetcodeSlug`, `phases[]` |
| `MCQ` | `subject`, `rows[]` (question, A/B/C/D options, answer, explanation, subDomain) |

---

## Environment Variables

Create `server/.env`:

```env
# Required
MONGO_URI=mongodb://localhost:27017/interviewPrep
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
JWT_SECRET=your_jwt_secret
REDIS_URI=redis://localhost:6379
# Optional: self-hosted or authorized Piston endpoint
PISTON_API_URL=https://your-piston-host.example.com
PORT=3000
NODE_ENV=development
```

---

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB (or Docker)
- Redis (optional — only needed for BullMQ worker)
- `g++`, `java`/`javac`, `python3` on PATH for local code execution

### 1. Start infrastructure

```bash
docker-compose up -d
```

This starts MongoDB on port `27017` and Redis on port `6379`.

### 2. Install dependencies

```bash
npm install
```

This installs both `client` and `server` workspaces.

### 3. Configure environment

```bash
cp server/.env.example server/.env
# Fill in GEMINI_API_KEY and other values
```

### 4. Run the servers

```bash
# Terminal 1 — backend
npm run dev:server

# Terminal 2 — frontend
npm run dev:client
```

The client runs on `http://localhost:5173` and proxies `/api` requests to the backend on port `3000`.

### 5. (Optional) Scrape USACO problems

```bash
npm --prefix server run scrape
```

### 6. (Optional) Start the BullMQ worker

```bash
npm --prefix server run worker:dev
```

---

## Deployment

The project is configured for **Vercel** deployment:

- **Build command**: `npm run vercel-build` → builds the Vite client to `client/dist`
- **Output directory**: `client/dist`
- **API routes**: rewritten to `/api/index.mjs` (serverless function)
- **SPA routes**: all other paths rewrite to `index.html`

For a self-hosted setup, run the Express server as a standalone process and serve the built Vite output from a CDN or static host.

---

## Rate Limiting (Production)

| Limiter | Window | Max Requests | Applied To |
|---|---|---|---|
| General | 15 minutes | 100 requests | All `/api/` routes |
| AI limiter | 60 minutes | 10 requests | All `/api/ai/` routes |

Rate limiting is **skipped in development** (`NODE_ENV !== 'production'`).

---

## Key Design Decisions

- **Dual-model AI pipeline** — separating evaluation (scoring) from conduction (response generation) allows each model to be optimized independently and makes offline fallbacks straightforward
- **Phase-gated interview flow** — each round type has a fixed phase sequence enforced by both the backend and the AI's system prompt, preventing the interviewer from skipping critical areas
- **SHA-1 deduplication for code feedback** — prevents the server from sending redundant AI reviews when the candidate hasn't changed their code
- **Graceful offline fallbacks** — every AI call has a heuristic fallback so the entire platform works without a Gemini key (useful for local testing)
- **Two-tier code execution** — prioritizes local compilers for speed and reliability, with optional fallback to a configured Piston API if compilers are not installed
- **Sanitized test case output** — only the first output block (before any blank line) is used for comparison, preventing false WAs from scraped explanatory prose

---

*Built with ❤️ as PrepDost — the premium hub for AI interview prep.*
