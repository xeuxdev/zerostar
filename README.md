# ZeroStar: Anti-Therapy Substation

> A satirical, entertainment-focused conversational AI anti-therapist that refuses to coddle your excuses.

[![Frontend: React Router v7](https://img.shields.io/badge/Frontend-React_Router_v7-blue.svg)](https://reactrouter.com/)
[![Backend: Go 1.25](https://img.shields.io/badge/Backend-Go_1.25-00ADD8.svg)](https://go.dev/)
[![Styling: Tailwind CSS v4](https://img.shields.io/badge/CSS-Tailwind_v4-38B2AC.svg)](https://tailwindcss.com/)
[![LLM: OpenAI](https://img.shields.io/badge/AI-OpenAI_GPT--4o--mini-green.svg)](https://openai.com/)

---

## Overview

In an AI landscape saturated with sycophantic, overly agreeable companions, **ZeroStar** (Zero-Star Therapy) takes the opposite approach. Acting as a deadpan, unapologetically blunt conversational agent ("Dr. Victor Blane"), ZeroStar refuses to validate delusions, deconstructs misused therapy buzzwords, and treats everyday drama with exhausted indifference.

ZeroStar is built with a modern full-stack decoupled architecture: a high-performance Go backend with real-time Server-Sent Events (SSE) streaming and a minimalist, brutalist frontend running React Router v7 and Tailwind CSS v4.

---

## Core Features

- **Deadpan Anti-Therapy Chat**: Real-time streaming conversational agent powered by OpenAI. Operates under low temperature settings to prevent hallucinations of empathy.
- **Dynamic Rage-Quit Detection**: Analyzes incoming messages for aggressive capitalization or excessive punctuation. When detected, the frontend transitions into an intense, blood-red **Rage Mode** with custom animations.
- **Clinical Flaw Diagnosis**: At any point during a session, generate a brutally honest "clinical note" summarizing actual user shortcomings rather than perceived victimhood.
- **Rage Review Simulator**: Allows frustrated users to leave 1-star Yelp-style reviews, persisted and displayed as badges of honor.
- **Built-in Rate Limiting**: Per-IP sliding window rate limiting. Exceeding limits returns a blunt `429` status code: `"Go get a job."`

---

## Tech Stack & Architecture

### Frontend
- **Framework**: [React Router v7](https://reactrouter.com/) with React 19
- **Bundler & Tooling**: [Vite](https://vitejs.dev/) with TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with pure utility styling (no inline styles)
- **UI & Icons**: [Radix UI](https://www.radix-ui.com/) and [Lucide React](https://lucide.dev/)
- **Markdown Support**: `react-markdown` and `remark-gfm` for rendering clinical notes

### Backend
- **Language**: [Go 1.25](https://go.dev/)
- **Router**: [Chi v5](https://github.com/go-chi/chi)
- **Structured Logging**: [Uber Zap](https://go.uber.org/zap)
- **AI Integration**: [go-openai](https://github.com/sashabaranov/go-openai) with SSE streaming support
- **State & Store**: Thread-safe in-memory store for session reviews and sliding-window rate limiters
- **Hot Reload**: [Air](https://github.com/air-verse/air)

---

## Project Structure

```
zerostar/
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go           # Application entry point & lifecycle
│   ├── internal/
│   │   ├── config/
│   │   │   └── config.go         # Environment configuration loader
│   │   ├── domain/
│   │   │   ├── chat.go           # Chat and diagnosis types
│   │   │   └── review.go         # Review data structures
│   │   ├── handler/
│   │   │   ├── chat.go           # SSE chat & diagnosis HTTP handlers
│   │   │   ├── health.go         # Health check handler
│   │   │   ├── response.go       # Standardized JSON response helpers
│   │   │   └── review.go         # Review collection handlers
│   │   ├── middleware/
│   │   │   ├── logger.go         # Structured zap HTTP logger
│   │   │   ├── ratelimit.go      # Per-IP sliding-window rate limiter
│   │   │   └── recover.go        # Panic recovery middleware
│   │   ├── openai/
│   │   │   └── service.go        # OpenAI client & anti-therapist prompt
│   │   ├── server/
│   │   │   └── router.go         # Chi router configuration & routes
│   │   └── store/
│   │       └── review_store.go   # Thread-safe in-memory review storage
│   ├── .air.toml                 # Air configuration for hot-reload
│   ├── .env.example              # Sample environment template
│   ├── ARCHITECTURE.md           # Deep dive into Go architecture
│   ├── Makefile                  # Build, test, and run targets
│   ├── go.mod                    # Go dependencies
│   └── go.sum                    # Go checksum lockfile
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── diagnostics-modal.tsx  # Clinical note modal
│   │   │   │   ├── header.tsx             # Header with status & diagnose trigger
│   │   │   │   ├── input-footer.tsx       # Message textarea & submit controls
│   │   │   │   ├── message.tsx            # Chat turn component
│   │   │   │   └── types.ts               # Chat message domain types
│   │   │   └── ui/                        # Reusable primitives (buttons, etc.)
│   │   ├── routes/
│   │   │   └── home.tsx                   # Main chat room interface
│   │   ├── app.css                        # Tailwind CSS imports & theme tokens
│   │   └── root.tsx                       # Root layout & document wrapper
│   ├── Dockerfile                         # Container build definition
│   ├── package.json                       # Node dependencies and scripts
│   ├── pnpm-lock.yaml                     # pnpm lockfile
│   └── vite.config.ts                     # Vite build configuration
├── PRD.md                                 # Product Requirements Document
└── README.md                              # Repository documentation
```

---

## Getting Started

### Prerequisites

- [Go](https://go.dev/dl/) 1.23 or newer
- [Node.js](https://nodejs.org/) 20 or newer
- [pnpm](https://pnpm.io/) (`corepack enable pnpm` or standalone install)
- [Air](https://github.com/air-verse/air) (Optional, for backend hot-reload):
  ```bash
  go install github.com/air-verse/air@latest
  ```

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your OpenAI credentials and settings:
   ```env
   PORT=8080
   OPENAI_API_KEY=your-api-key-here
   OPENAI_MODEL=gpt-4o-mini
   ALLOWED_ORIGIN=http://localhost:5173
   RATE_LIMIT_REQUESTS=10
   RATE_LIMIT_WINDOW_SECONDS=60
   ```

4. Start the backend:
   ```bash
   # Option A: With hot-reload (recommended for development)
   make dev

   # Option B: Standard Go runner
   make run
   ```

The backend server will start at `http://localhost:8080`.

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies using `pnpm`:
   ```bash
   pnpm install
   ```

3. Configure environment variables by creating `.env`:
   ```env
   VITE_API_URL=http://localhost:8080
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

The application will be available at `http://localhost:5173`.

---

## API Reference

### Health Check

#### `GET /health`
Returns service status.

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "zero-star-therapy"
}
```

---

### Chat Stream

#### `POST /api/v1/chat`
Sends user message and full chat history. Returns a Server-Sent Events (SSE) stream.

**Request Body:**
```json
{
  "history": [
    { "role": "user", "content": "My boss yelled at me for being two hours late." },
    { "role": "model", "content": "You were two hours late. Buy an alarm clock." }
  ],
  "message": "He is so toxic though!"
}
```

**SSE Event Sequence:**
1. Initial status event containing rage detection:
   ```
   data: {"rage_mode": false, "type": "start"}
   ```
2. Incremental text deltas:
   ```
   data: {"content": "Being ", "type": "chunk"}
   data: {"content": "held ", "type": "chunk"}
   data: {"content": "accountable is not toxicity.", "type": "chunk"}
   ```
3. Termination event:
   ```
   data: {"type": "done"}
   ```

---

### Clinical Diagnosis

#### `POST /api/v1/diagnose`
Evaluates the entire conversational history and generates a satirical clinical summary.

**Request Body:**
```json
{
  "history": [
    { "role": "user", "content": "Everyone at work is out to get me." },
    { "role": "model", "content": "Have you considered you might just be unpleasant to work with?" }
  ]
}
```

**Response (200 OK):**
```json
{
  "diagnosis": "PATIENT EVALUATION:\n- Primary Issue: Chronic externalization of personal failure.\n- Prognosis: Poor, unless customer service stops apologizing to them."
}
```

---

### Rage Reviews

#### `POST /api/v1/reviews`
Submits a post-session 1-star rage review.

**Request Body:**
```json
{
  "rating": 1,
  "comment": "This therapist told me I was wrong. Zero stars. Validated my parking though."
}
```

**Response (201 Created):**
```json
{
  "id": "1",
  "rating": 1,
  "comment": "This therapist told me I was wrong. Zero stars. Validated my parking though.",
  "created_at": "2026-03-01T12:00:00Z"
}
```

#### `GET /api/v1/reviews`
Fetches all recorded rage reviews.

**Response (200 OK):**
```json
{
  "reviews": [
    {
      "id": "1",
      "rating": 1,
      "comment": "This therapist told me I was wrong. Zero stars. Validated my parking though.",
      "created_at": "2026-03-01T12:00:00Z"
    }
  ]
}
```

---

## Agent Directives & Personality

The AI agent embodies the following behavioral guidelines defined in [PRD.md](file:///c:/Users/hp/Desktop/projects/xeux-labs/zerostar/PRD.md):

1. **Brutal Honesty**: Point out hypocrisies and bad behavior directly. Sparing feelings is out of scope.
2. **Deadpan Delivery**: Responses remain concise, dry, and free of exclamation marks, emojis, or warmth.
3. **Deconstructing Therapy-Speak**: When a user misuses buzzwords like "gaslighting" or "boundaries" to justify misconduct, the agent clinically disassembles the excuse.
4. **Indifference to Validation**: Customer satisfaction is irrelevant. Threats of cancellation or negative reviews are met with apathy.
5. **The Bulldog Rule**: When asked about personal interests, the agent only acknowledges affection for their French bulldog.

---

## Available Scripts

### Frontend Scripts (Run with `pnpm`)

- `pnpm dev`: Starts the Vite development server with hot module replacement.
- `pnpm build`: Builds production client and server bundles.
- `pnpm start`: Serves the production build using `@react-router/serve`.
- `pnpm typecheck`: Validates TypeScript types across all components.

### Backend Targets (Run with `make`)

- `make dev`: Launches the server with Air hot-reload.
- `make run`: Runs the server directly using `go run`.
- `make build`: Compiles the binary into `backend/bin/api`.
- `make test`: Executes test suites with race condition detection.
- `make lint`: Performs `go vet` static analysis.
- `make tidy`: Prunes unused dependencies in `go.mod`.

---

## Deployment & Docker

### Frontend Container

A production-ready [Dockerfile](file:///c:/Users/hp/Desktop/projects/xeux-labs/zerostar/frontend/Dockerfile) is provided in the frontend directory:

```bash
cd frontend
docker build -t zerostar-frontend .
docker run -p 3000:3000 -e VITE_API_URL="https://api.yourdomain.com" zerostar-frontend
```

### Backend Binary

To build a standalone production binary for the Go server:

```bash
cd backend
make build
# Binary is located at bin/api
./bin/api
```

---

## Disclaimer

**ZeroStar is a comedy and satirical entertainment application.** It does not provide medical, psychiatric, psychological, or clinical mental health advice. It is not a substitute for professional cognitive behavioral therapy (CBT) or licensed medical support. If you are experiencing a mental health crisis, please reach out to qualified medical professionals or local crisis support lines.
