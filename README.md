<div align="center">

# 🧭 CHALLENGE TRACKER PRO

**One cohort. Four roles worth of tooling. Zero manual grading.**

*Assign → Code → Evaluate → Review — a role-based challenge platform with a live AI mentor built in.*

![Python](https://img.shields.io/badge/react-18-61DAFB?logo=react&logoColor=white&labelColor=1F1F24)
![TypeScript](https://img.shields.io/badge/typescript-5.0-3178C6?logo=typescript&logoColor=white&labelColor=1F1F24)
![Vite](https://img.shields.io/badge/vite-build-646CFF?logo=vite&logoColor=white&labelColor=1F1F24)
![Supabase](https://img.shields.io/badge/supabase-backend-3ECF8E?logo=supabase&logoColor=white&labelColor=1F1F24)
![Gemini](https://img.shields.io/badge/gemini-2.5%20flash-8A2BE2?labelColor=1F1F24)
![Tests](https://img.shields.io/badge/tests-31%20passing-brightgreen?labelColor=1F1F24)
![License](https://img.shields.io/badge/license-MIT-black?labelColor=1F1F24)

</div>

---

## 📖 What is this?

Challenge Tracker Pro turns a stack of coding challenges into a fully managed cohort — without a mentor manually grading a single submission.

An admin publishes a challenge and assigns it to their cohort. From there, four things happen automatically:

| | Component | Job |
|---|---|---|
| 💻 | **Code Workspace** | A full Monaco-powered in-browser editor where students write, run, and submit code across TypeScript, Python, Java, and C++ |
| 🤖 | **AI Mentor (Gemini 2.5 Flash)** | Grades every submission the moment it lands — a 0–100 score plus structured Markdown feedback, no human in the loop |
| 🔔 | **Realtime Layer** | Supabase Realtime pushes live class invites and status updates straight to the student's screen as toasts |
| 🎥 | **Live Classroom** | One click from the admin spins up a Jitsi room and notifies the entire cohort instantly |

Every screen — dashboards, reviews, the editor itself — runs on a single dark **Soft Violet** design system, so the whole platform feels like one product instead of four bolted-together tools.

---

## ✨ Core Features

### 🎓 Student View

- **In-Browser Code Editor** — Monaco (the engine behind VS Code) with syntax highlighting, a language switcher, and a live run/output terminal.
- **Live Code Execution** — Runs server-side through a Supabase Edge Function proxy, so no execution credentials ever touch the browser.
- **AI Mentor Feedback** — Every coding submission is graded by **Gemini 2.5 Flash**: a 0–100 score plus a collapsible Markdown report (Summary, Strengths, Areas for Improvement, Recommendations).
- **Real-Time Notifications** — Supabase Realtime subscriptions drive instant toasts and a live unread badge — no polling.
- **Live Class Toasts** — A "Live Session Started" toast with a one-click Jitsi join link, pushed the moment a mentor starts class.
- **Markdown Challenge Specs** — Briefs are authored in Markdown and rendered with a custom parser.
- **Standard Submissions** — Non-coding challenges accept validated GitHub and LinkedIn proof URLs.
- **Auto-Derived Status** — `Incomplete → Ongoing → Complete` updates itself from actual interaction — nothing to toggle manually.

### 🛠️ Admin / Mentor View

- **Cohort Management** — Searchable student directory with drill-down modals: bio, socials, and full assignment history.
- **Global Live Video Broadcasting** — One button starts a Jitsi session and bulk-notifies the whole cohort in real time.
- **Challenge Authoring** — Live Markdown preview, difficulty tagging, and a toggle between "coding challenge" (Monaco editor) and "standard challenge" (proof URLs).
- **Automated AI Evaluation Pipeline** — Every submission arrives already scored and reviewed by Gemini — nothing to grade by hand.
- **Question-Wise Submission Review** — Completed work grouped by challenge for fast, batched review.
- **Bulk Assignment** — Assign a challenge to an entire cohort via a single Postgres stored procedure, notifications included.
- **Role-Isolated Dashboards** — Metrics and directories are strictly filtered to real students — admin accounts never pollute the numbers.

---

## 🧱 Tech Stack & Architecture

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS — custom **Soft Violet** dark design system |
| Data Fetching & Caching | TanStack Query (optimistic mutations, cache-driven UI) |
| Routing | React Router DOM |
| UI Primitives | Radix UI (Dialog, Dropdown Menu, Tabs, Select, Avatar) |
| Forms & Validation | React Hook Form + Zod |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| Icons | Lucide React |
| Markdown | `marked` (custom renderer) |
| Typography | JetBrains Mono (technical/data/inputs) + Inter (prose/body) |

### Backend — Supabase

- **Authentication** — Email/password and Google OAuth, driving role-based routing.
- **Database** — PostgreSQL with `profiles`, `challenges`, `assignments`, `notifications`, and enum-driven state.
- **Row Level Security (RLS)** — Enforced on every table, plus trigger-level guards that block students from writing to protected assignment fields.
- **Database Triggers & Functions** — Auto profile creation, notification dispatch, and a `SECURITY DEFINER` bulk-assignment procedure.
- **Realtime** — WebSocket subscriptions power instant toasts and badge updates for both roles.
- **Edge Functions** — `evaluate-code` and `execute-code` keep every third-party credential server-side.

### Third-Party Integrations

- **Gemini 2.5 Flash** — Automated code evaluator, invoked via a Supabase Edge Function with resilient prompt/response parsing.
- **JDoodle API** — Multi-language server-side code execution (Node.js, Python 3, Java, C++), proxied through an Edge Function.
- **Jitsi Meet** — Zero-setup embeddable video classrooms with unguessable UUID room URLs.

---

## 🔐 Environment Variables

Create a `.env` file in the project root. **Never commit real API keys or secrets to version control.**

### Client-side (`VITE_` prefixed)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public (anon) API key |
| `VITE_GEMINI_API_KEY` | Client-side fallback key for local development *(optional)* |

### Server-side (Supabase Edge Function secrets)

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Used by the `evaluate-code` Edge Function |
| `JDOODLE_CLIENT_ID` | Used by the `execute-code` Edge Function |
| `JDOODLE_CLIENT_SECRET` | Used by the `execute-code` Edge Function |

```bash
supabase secrets set JDOODLE_CLIENT_ID=your_client_id JDOODLE_CLIENT_SECRET=your_client_secret
supabase secrets set GEMINI_API_KEY=your_gemini_key
```

---

## 🚀 Local Setup & Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/challenge-tracker-pro.git
cd challenge-tracker-pro

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Apply database migrations
supabase link --project-ref your-project-ref
supabase db push

# 5. Deploy Edge Functions
supabase functions deploy evaluate-code
supabase functions deploy execute-code

# 6. Start the dev server
npm run dev
```

The app runs at `http://localhost:5173`.

---

## ✅ Testing & QA

```bash
npm run test
```

**31 tests across 4 suites — 100% passing**, covering AI score-extraction, Realtime channel lifecycle, Monaco editor cleanup, and challenge-detail state logic.

---

## ☁️ Deployment

Deployed on **Vercel**. Because routing is client-side (React Router), add a `vercel.json` so deep links don't 404 on refresh:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Checklist:**

1. Import the repo into Vercel; build command `npm run build`, output `dist`.
2. Add all `VITE_`-prefixed env vars in Vercel project settings.
3. Deploy `evaluate-code` and `execute-code` separately via the Supabase CLI.
4. Confirm RLS policies and migrations are applied on the production Supabase project.

---

<div align="center">

**MIT Licensed**

</div>
