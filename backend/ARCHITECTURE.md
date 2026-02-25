# Zero-Star Therapy — Backend Architecture Guide

> **Who is this for?** This document is written for someone who understands web APIs in general but is new to Go. Every concept is explained in plain English before the code is shown.

---

## Table of Contents

1. [What the App Does](#1-what-the-app-does)
2. [Folder Structure](#2-folder-structure)
3. [How to Run the Server](#3-how-to-run-the-server)
4. [Environment Variables (`.env`)](#4-environment-variables-env)
5. [The Entry Point — `cmd/api/main.go`](#5-the-entry-point--cmdapimain-go)
6. [Configuration — `internal/config/config.go`](#6-configuration--internalconfigconfig-go)
7. [Domain Types — `internal/domain/`](#7-domain-types--internaldomain)
8. [The OpenAI Service — `internal/openai/service.go`](#8-the-openai-service--internalopenaiservice-go)
9. [Handlers — `internal/handler/`](#9-handlers--internalhandler)
10. [Middleware — `internal/middleware/`](#10-middleware--internalmiddleware)
11. [The Store — `internal/store/review_store.go`](#11-the-store--internalstorereview_store-go)
12. [The Router — `internal/server/router.go`](#12-the-router--internalserverrouter-go)
13. [Complete Request Lifecycle](#13-complete-request-lifecycle)
14. [API Reference](#14-api-reference)
15. [Key Go Concepts Used](#15-key-go-concepts-used)

---

## 1. What the App Does

Zero-Star Therapy is a satirical "anti-therapist" API. Users chat with an OpenAI-powered agent that is brutally honest, refuses to validate excuses, and treats every dramatic outburst with exhausted indifference.

The backend provides four HTTP endpoints:

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | `GET` | Quick server health check |
| `/api/v1/chat` | `POST` | Send a message, get a blunt reply |
| `/api/v1/diagnose` | `POST` | Get a satirical "clinical summary" of the session |
| `/api/v1/reviews` | `GET` | List all submitted rage reviews |
| `/api/v1/reviews` | `POST` | Submit an angry Yelp-style review after a session |

---

## 2. Folder Structure

```
backend/
├── cmd/
│   └── api/
│       └── main.go           ← The program starts here
├── internal/
│   ├── config/
│   │   └── config.go         ← Reads .env and environment variables
│   ├── domain/
│   │   ├── chat.go           ← Data shapes for chat requests/responses
│   │   └── review.go         ← Data shapes for reviews
│   ├── handler/
│   │   ├── chat.go           ← HTTP logic for /chat and /diagnose
│   │   ├── review.go         ← HTTP logic for /reviews
│   │   ├── health.go         ← HTTP logic for /health
│   │   └── response.go       ← Shared JSON writing helpers
│   ├── middleware/
│   │   ├── ratelimit.go      ← Per-IP request throttling
│   │   ├── logger.go         ← Logs every request
│   │   └── recover.go        ← Catches panics, prevents server crashes
│   ├── openai/
│   │   └── service.go        ← Talks to the OpenAI API
│   ├── server/
│   │   └── router.go         ← Wires all routes and middleware together
│   └── store/
│       └── review_store.go   ← In-memory storage for reviews
├── .air.toml                 ← Hot-reload configuration (air)
├── .env                      ← Your local secrets (never commit this)
├── .env.example              ← Template showing what variables are needed
├── .gitignore
├── go.mod                    ← Go module definition (like package.json)
├── go.sum                    ← Dependency lock file (like pnpm-lock.yaml)
└── Makefile                  ← Shortcut commands
```

### What is `internal/`?

In Go, placing code inside a folder named `internal` makes it **private to this module**. No external Go program can import it. This is a Go language rule — it enforces clean boundaries in your own code.

### What is `cmd/`?

`cmd/api/` holds the **executable entry point**. Think of it as the `index.js` of this Go app. A project can have multiple executables under `cmd/` (e.g., `cmd/api`, `cmd/worker`), each with its own `main.go`.

---

## 3. How to Run the Server

```bash
# Development — hot reload (restarts automatically when you save a .go file)
make dev

# Development — one-time run without hot reload
make run

# Compile to a binary file at bin/api
make build

# Format + vet (static analysis)
make lint

# Clean up go.mod and go.sum
make tidy
```

`make dev` uses **Air** under the hood — it watches your `.go` files and rebuilds + restarts the server whenever you save a change.

---

## 4. Environment Variables (`.env`)

The server reads all its configuration from environment variables (or a `.env` file in the `backend/` folder).

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `8080` | Port the HTTP server binds to |
| `OPENAI_API_KEY` | **Yes** | — | Your OpenAI secret key |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Which OpenAI model to use |
| `ALLOWED_ORIGIN` | No | `http://localhost:3000` | The frontend URL allowed by CORS |
| `RATE_LIMIT_REQUESTS` | No | `10` | Max requests per IP per window |
| `RATE_LIMIT_WINDOW_SECONDS` | No | `60` | Length of the rate limit window in seconds |

Copy `.env.example` to `.env` and fill in at least `OPENAI_API_KEY` before running.

---

## 5. The Entry Point — `cmd/api/main.go`

This is where Go starts executing. Every Go program begins at a function called `main()`.

```
main()
  └── run()   ← the real logic lives here; main() just handles the exit code
```

The `run()` function sets up the entire application in this order:

### Step 1 — Build a Logger
```go
log, err := zap.NewProduction()
```
`zap` is a fast, structured logging library by Uber. "Structured" means logs are JSON objects (great for log aggregators like Datadog), not just plain strings.

### Step 2 — Load Configuration
```go
cfg, err := config.Load()
```
Reads environment variables (explained in section 6).

### Step 3 — Set Up Graceful Shutdown
```go
ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
```
This wires the OS shutdown signals (`Ctrl+C` on your keyboard, or a process manager sending `SIGTERM`) into Go's `context` system. When you stop the server, the app doesn't just rip the plug — it finishes any in-flight requests first. This is called a **graceful shutdown**.

### Step 4 — Create all pieces and connect them
```go
aiService   := aiopenai.New(cfg.OpenAIAPIKey, cfg.OpenAIModel, log)
reviewStore := store.NewReviewStore()
chatHandler := handler.NewChatHandler(aiService, log)
...
```
Each component is created separately and **injected** into the things that need it. This is called **dependency injection** — instead of components creating their own dependencies, they receive them from the outside. This makes testing easier and keeps things loosely coupled.

### Step 5 — Start the HTTP Server
```go
srv := &http.Server{
    Addr:         ":" + cfg.Port,
    ReadTimeout:  15 * time.Second,
    WriteTimeout: 30 * time.Second,
    IdleTimeout:  60 * time.Second,
}
```
The timeouts protect against slow or malicious clients that never finish sending a request or reading a response.

The server is started in a **goroutine** (explained in section 15) so the main program can simultaneously listen for shutdown signals.

### Step 6 — Wait and Shut Down
```go
select {
case err := <-serverErr:   // server crashed
case <-ctx.Done():         // Ctrl+C or SIGTERM received
}
```
After shutdown is triggered, `srv.Shutdown(shutdownCtx)` gives in-flight requests up to 10 seconds to complete before the process exits.

---

## 6. Configuration — `internal/config/config.go`

```go
type Config struct {
    Port              string
    OpenAIAPIKey      string
    OpenAIModel       string
    RateLimitRequests int
    RateLimitWindow   time.Duration
    AllowedOrigins    []string
}
```

The `Load()` function uses two helpers:

- **`getEnv(key, fallback)`** — returns the env var if set, otherwise returns the fallback. Safe — will never crash.
- **`mustEnv(key)`** — returns the env var if set, **panics** if it is not. Used for required secrets like `OPENAI_API_KEY`. The panic happens at startup, not mid-request, so you know immediately if something critical is missing.

---

## 7. Domain Types — `internal/domain/`

"Domain" is a term for the **core data shapes of your application** — the plain Go structs that describe what data flows around. They do not contain database or HTTP logic, just structure.

### `chat.go`

```go
// A single message in the conversation
type Message struct {
    Role    Role   `json:"role"`    // "user" or "model"
    Content string `json:"content"` // The text of the message
}

// What the frontend sends for a chat turn
type ChatRequest struct {
    History []Message `json:"history"` // All previous messages
    Message string    `json:"message"` // The new user message
}

// What the backend sends back after a chat turn
type ChatResponse struct {
    Reply   string    `json:"reply"`   // The AI's response
    History []Message `json:"history"` // Updated full history
}
```

**Why does the client send the full history every time?**
The backend is **stateless** — it does not remember your conversation between requests. So the client (frontend) is responsible for tracking the conversation history and sending it up with every message. The backend appends the new turn and sends the updated history back.

### `review.go`

```go
// A submitted "rage review"
type RageReview struct {
    ID        string `json:"id"`
    Rating    int    `json:"rating"`     // 1–5
    Comment   string `json:"comment"`
    CreatedAt string `json:"created_at"` // e.g. "2026-02-25T13:00:00Z"
}
```

The backtick annotations (`` `json:"id"` ``) are called **struct tags**. They tell Go's JSON encoder what key name to use when converting the struct to/from JSON. Without them, Go would use the field name as-is (e.g., `CreatedAt` instead of `created_at`).

---

## 8. The OpenAI Service — `internal/openai/service.go`

This is the layer that actually talks to OpenAI. It contains two things that are worth understanding up front:

### The System Prompts

At the top of the file are two large string constants:

- **`systemPrompt`** — the "personality" given to the AI for every chat message. This is what makes it an honest, deadpan anti-therapist.
- **`diagnosisSystemPrompt`** — a different prompt used only for the `/diagnose` endpoint, telling the AI to write a clinical-style session summary.

These act as standing instructions sent to OpenAI before every conversation.

### `Chat()`

```go
func (s *Service) Chat(ctx context.Context, history []domain.Message, userMessage string) (string, error)
```

1. Starts with the system prompt in the messages array.
2. Translates the frontend's `history` array into OpenAI's message format (mapping `"model"` → `"assistant"`, since that's what OpenAI expects).
3. Appends the new user message.
4. Calls `client.CreateChatCompletion()` — this is the actual HTTP call to `api.openai.com`.
5. Returns the AI's reply text.

### `Diagnose()`

```go
func (s *Service) Diagnose(ctx context.Context, history []domain.Message) (string, error)
```

Instead of using the chat system prompt, it formats the full history into a single readable transcript and sends it to OpenAI with the diagnosis prompt, asking for a satirical clinical summary.

### The Interface in `handler/chat.go`

Notice that `handler/chat.go` does **not** import the `openai` package directly. Instead it defines:

```go
type AIService interface {
    Chat(ctx context.Context, history []domain.Message, userMessage string) (string, error)
    Diagnose(ctx context.Context, history []domain.Message) (string, error)
}
```

An **interface** in Go is a contract. Any type that has both a `Chat` and `Diagnose` method automatically satisfies this interface. This means you could swap out the OpenAI service for a different AI provider without touching the handler code at all.

---

## 9. Handlers — `internal/handler/`

Handlers are the **HTTP controllers**. They read the incoming request, validate it, call business logic, and write the response.

### `response.go` — Shared Helpers

```go
func respond(w http.ResponseWriter, statusCode int, data interface{}) {
    w.Header().Set("Content-Type", "application/json; charset=utf-8")
    w.WriteHeader(statusCode)
    json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, statusCode int, code, message string) {
    respond(w, statusCode, map[string]string{
        "error":   code,
        "message": message,
    })
}
```

Instead of repeating JSON encoding logic in every handler, these two helpers standardise it. All success responses use `respond()` and all error responses use `respondError()` with a consistent shape:
```json
{ "error": "some_code", "message": "Human readable explanation." }
```

### `health.go`

A simple endpoint that returns `200 OK` with `{ "status": "ok" }`. It is not rate-limited so monitoring tools can ping it freely without consuming the user's rate limit quota.

### `chat.go`

**`Chat` handler (POST `/api/v1/chat`):**
1. Decodes the JSON body into a `ChatRequest`.
2. Rejects empty messages with a snarky error.
3. Calls `isRaging()` to detect if the message is ALL CAPS (≥70% uppercase letters) or has 3+ exclamation/question marks. This result is returned as `rage_mode: true/false` in the response — it's a fun metadata flag for the frontend.
4. Calls `ai.Chat()` to get a reply.
5. Builds the updated history by appending both the user message and the AI reply.
6. Returns `reply`, `history`, and `rage_mode`.

**`Diagnose` handler (POST `/api/v1/diagnose`):**
1. Decodes the request to get the conversation history.
2. Calls `ai.Diagnose()`.
3. Returns the diagnosis text.

### `review.go`

**`Create` handler (POST `/api/v1/reviews`):**
1. Decodes the JSON body.
2. Rejects empty comments.
3. Calls `store.Add()` to save the review in memory.
4. Returns the created review with `201 Created`.

**`List` handler (GET `/api/v1/reviews`):**
1. Calls `store.List()` to get all reviews.
2. Returns them wrapped in a `{ "reviews": [...] }` object.

---

## 10. Middleware — `internal/middleware/`

Middleware is code that runs on **every request** before it reaches your handler. Think of it as a pipeline: each middleware can choose to pass the request along to the next layer, or block it entirely.

```
Request → [RequestID] → [RealIP] → [Recoverer] → [Logger] → [CORS] → [RateLimiter] → Handler
```

### `recover.go` — Panic Catcher

```go
func Recoverer(log *zap.Logger) func(http.Handler) http.Handler
```

In Go, a `panic` is a runtime crash (similar to an unhandled exception). Without this middleware, a single bug causing a panic would **crash the entire server**. The `Recoverer` wraps every request in a `defer/recover` block so that:
- The panic is caught and logged.
- A clean `500 Internal Server Error` JSON response is sent.
- The server keeps running to serve other requests.

### `logger.go` — Request Logger

Logs every request **after it completes** (so the status code is available). Captures: method, path, IP, user agent, status code, bytes written, and latency.

Uses `WrapResponseWriter` from the chi library to "wrap" the response writer so it can peek at the status code and byte count after the handler writes them.

### `ratelimit.go` — Per-IP Token Bucket

This is the most complex middleware. It limits how many requests a single IP address can make in a given time window.

**How a token bucket works:**
- Each IP gets a "bucket" that holds up to N tokens (e.g., 10).
- Each request consumes one token.
- Tokens are refilled at a steady rate (e.g., 10 per 60 seconds = 1 every 6 seconds).
- If the bucket is empty → 429 Too Many Requests → `"Go get a job."`

**Key implementation details:**

```go
type RateLimiter struct {
    mu       sync.Mutex            // prevents race conditions
    limiters map[string]*entry     // one limiter per IP address
    r        rate.Limit            // refill rate (tokens/second)
    b        int                   // bucket capacity (burst)
}
```

- **`sync.Mutex`** — since this map is shared across all requests happening concurrently, a mutex (mutual exclusion lock) ensures only one goroutine modifies the map at a time. Without this, two simultaneous requests could corrupt the map.
- **`cleanup` goroutine** — runs in the background every `5×window` seconds and evicts entries for IPs not seen recently, preventing unbounded memory growth.
- **`realIP()`** — extracts the true client IP by checking `X-Real-IP` and `X-Forwarded-For` headers (set by proxies/load balancers) before falling back to the direct connection address.

---

## 11. The Store — `internal/store/review_store.go`

```go
type ReviewStore struct {
    mu      sync.RWMutex        // read-write mutex
    reviews []domain.RageReview // the in-memory list
    nextID  int                 // auto-incrementing ID counter
}
```

This is a simple **in-memory database** for rage reviews. Data is stored in a Go slice (like an array) and is **lost when the server restarts**. The code comments acknowledge this:

> *In production this would be replaced by a persistent database layer (e.g., PostgreSQL with pgx).*

**Why `sync.RWMutex` and not plain `sync.Mutex`?**  
A `RWMutex` (read-write mutex) allows **multiple concurrent readers** but only **one writer at a time**. Since `List()` (reading) is called far more often than `Add()` (writing), this is more efficient. Notice:
- `Add()` uses `s.mu.Lock()` — exclusive write lock
- `List()` uses `s.mu.RLock()` — shared read lock

**`clampRating()`** ensures the rating value is always between 1 and 5, no matter what number the client sends.

---

## 12. The Router — `internal/server/router.go`

This file wires everything together into a single HTTP handler. It uses **chi**, a lightweight Go router.

```go
r := chi.NewRouter()

// Global middleware (runs on ALL routes)
r.Use(chimiddleware.RequestID) // adds X-Request-Id header to every request/response
r.Use(chimiddleware.RealIP)    // ensures r.RemoteAddr is the real client IP
r.Use(appmiddleware.Recoverer(log))
r.Use(appmiddleware.Logger(log))
r.Use(chimiddleware.StripSlashes) // /api/v1/chat/ → /api/v1/chat

// CORS
r.Use(cors.New(...).Handler)

// Health (NOT rate-limited)
r.Get("/health", handler.Health)

// API v1 — rate-limited group
r.Group(func(r chi.Router) {
    r.Use(rateLimiter.Handler) // only applies inside this group
    r.Route("/api/v1", func(r chi.Router) {
        r.Post("/chat", chatHandler.Chat)
        r.Post("/diagnose", chatHandler.Diagnose)
        r.Get("/reviews", reviewHandler.List)
        r.Post("/reviews", reviewHandler.Create)
    })
})
```

**Why does `/health` not have rate limiting?**  
Health checks are called by infrastructure (load balancers, uptime monitors) very frequently. If they were rate-limited, a monitoring tool could be blocked while the server is actually fine.

**CORS** (Cross-Origin Resource Sharing) allows the browser to make requests from the frontend domain (e.g., `http://localhost:3000`) to the backend domain (e.g., `http://localhost:8080`). Without this, browsers would block the requests by default.

---

## 13. Complete Request Lifecycle

Here is a complete walkthrough of what happens when the frontend sends `POST /api/v1/chat`:

```
1. Browser sends:
   POST /api/v1/chat
   Body: { "history": [...], "message": "My boss is so unfair" }

2. chi router receives the request

3. Middleware pipeline runs (in order):
   a. RequestID        → generates a unique ID, attaches to request context
   b. RealIP           → extracts the true client IP
   c. Recoverer        → wraps request in panic safety net
   d. Logger           → records start time (will log after response)
   e. StripSlashes     → normalizes the URL
   f. CORS             → checks Origin header, sets response headers
   g. RateLimiter      → checks IP's token bucket
                         → if empty: returns 429 "Go get a job."
                         → if ok: consumes a token, passes through

4. chi matches route → calls chatHandler.Chat()

5. chatHandler.Chat():
   a. Decodes JSON body
   b. Validates message is not empty
   c. Detects rage mode
   d. Calls aiService.Chat(ctx, history, message)

6. openai.Service.Chat():
   a. Builds messages array with system prompt + history + new message
   b. HTTP POST to api.openai.com/v1/chat/completions
   c. Returns reply string

7. chatHandler.Chat() (continued):
   a. Appends user message + reply to history
   b. Calls respond() with { reply, history, rage_mode }

8. Logger middleware logs: method, path, status=200, latency=1.2s

9. Browser receives:
   { "reply": "You were late.", "history": [...], "rage_mode": false }
```

---

## 14. API Reference

### `GET /health`
No body required.

**Response `200`:**
```json
{ "status": "ok", "service": "zero-star-therapy" }
```

---

### `POST /api/v1/chat`
**Request body:**
```json
{
  "history": [
    { "role": "user",  "content": "My boss is terrible." },
    { "role": "model", "content": "What did you do this time?" }
  ],
  "message": "I was only two hours late!"
}
```
> On the first message, send `"history": []`.

**Response `200`:**
```json
{
  "reply": "Two hours late is not 'only'. Buy an alarm clock.",
  "history": [ ...all turns including this one... ],
  "rage_mode": false
}
```

**Error `400`** — empty or invalid message  
**Error `429`** — rate limit hit → `{ "error": "rate_limit_exceeded", "message": "Go get a job." }`

---

### `POST /api/v1/diagnose`
**Request body:**
```json
{
  "history": [ ...full conversation... ]
}
```

**Response `200`:**
```json
{
  "diagnosis": "PRESENTING ISSUES: 1. Chronic victim mentality..."
}
```

---

### `POST /api/v1/reviews`
**Request body:**
```json
{
  "rating": 1,
  "comment": "This therapist told me I was wrong. Would not recommend."
}
```

**Response `201`:**
```json
{
  "id": "1",
  "rating": 1,
  "comment": "This therapist told me I was wrong...",
  "created_at": "2026-02-25T13:00:00Z"
}
```

---

### `GET /api/v1/reviews`
No body.

**Response `200`:**
```json
{
  "reviews": [
    { "id": "1", "rating": 1, "comment": "...", "created_at": "..." }
  ]
}
```

---

## 15. Key Go Concepts Used

A quick glossary of Go-specific patterns you'll see throughout this codebase.

### Goroutines
A goroutine is Go's version of a lightweight thread. Prefix any function call with `go` to run it concurrently:
```go
go func() {
    srv.ListenAndServe() // runs in the background
}()
```
In this app, goroutines are used to:
- Run the HTTP server while also listening for shutdown signals.
- Run the rate limiter cleanup loop in the background.

### Channels
Channels are typed pipes for communication between goroutines:
```go
serverErr := make(chan error, 1) // buffered channel, holds 1 error
serverErr <- err                 // send
err := <-serverErr               // receive
```

### `defer`
`defer` schedules a function call to run when the surrounding function returns, no matter how it returns (normal return, error, panic). Used for cleanup:
```go
defer log.Sync()          // flush logger on exit
defer s.mu.Unlock()        // always unlock the mutex
```

### Interfaces
A type implicitly satisfies an interface if it has all the required methods — no `implements` keyword needed. This is how `AIService` works: `*openai.Service` satisfies the `AIService` interface because it has `Chat()` and `Diagnose()` methods with matching signatures.

### Pointers (`*`) and Address-of (`&`)
```go
s := &ReviewStore{nextID: 1} // create a ReviewStore and take its address
func (s *ReviewStore) Add()  // method on a pointer receiver
```
When you pass a pointer, you're passing a reference — changes inside the function affect the original value.

### Error Handling
Go does not have `try/catch`. Functions return errors as values:
```go
result, err := doSomething()
if err != nil {
    return fmt.Errorf("context: %w", err) // wrap with context
}
```
`%w` (the `w` stands for "wrap") allows the caller to inspect the original error with `errors.Is()` or `errors.As()`.

### `context.Context`
A `context.Context` travels through every function call. It carries:
- **Cancellation signals** — if the HTTP request is cancelled (client disconnects), all downstream work is cancelled too.
- **Deadlines** — automatically stop work after a time limit.
- **Request-scoped values** — like the request ID attached by chi.

That's why you'll see `ctx context.Context` as the first argument in `aiService.Chat(ctx, ...)` — it allows Go to cancel the OpenAI API call if the client disconnects mid-request.
