package server

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/rs/cors"
	"go.uber.org/zap"

	"github.com/xeuxdev/zerostar-backend/internal/handler"
	appmiddleware "github.com/xeuxdev/zerostar-backend/internal/middleware"
)

// New wires together all routes and middleware and returns the root HTTP handler.
func New(
	chatHandler *handler.ChatHandler,
	reviewHandler *handler.ReviewHandler,
	rateLimiter *appmiddleware.RateLimiter,
	allowedOrigins []string,
	log *zap.Logger,
) http.Handler {
	r := chi.NewRouter()

	// ── Global middleware ──────────────────────────────────────────────────────
	r.Use(chimiddleware.RequestID) // injects X-Request-Id
	r.Use(chimiddleware.RealIP)    // honours X-Forwarded-For / X-Real-IP
	r.Use(appmiddleware.Recoverer(log))
	r.Use(appmiddleware.Logger(log))
	r.Use(chimiddleware.StripSlashes)

	// CORS: configured for the frontend origin(s)
	c := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-Id"},
		ExposedHeaders:   []string{"X-Request-Id"},
		AllowCredentials: false,
		MaxAge:           300,
	})
	r.Use(c.Handler)

	// Health check (not rate-limited; used by infra)
	r.Get("/health", handler.Health)

	// API v1: rate-limited
	r.Group(func(r chi.Router) {
		r.Use(rateLimiter.Handler)

		r.Route("/api/v1", func(r chi.Router) {
			// Chat
			r.Post("/chat", chatHandler.Chat)
			r.Post("/diagnose", chatHandler.Diagnose)

			// Rage Reviews
			r.Get("/reviews", reviewHandler.List)
			r.Post("/reviews", reviewHandler.Create)
		})
	})

	return r
}
