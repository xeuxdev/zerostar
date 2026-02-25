// Command api is the entry point for the Zero-Star Therapy API.
package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"

	"github.com/xeuxdev/zerostar-backend/internal/config"
	"github.com/xeuxdev/zerostar-backend/internal/handler"
	appmiddleware "github.com/xeuxdev/zerostar-backend/internal/middleware"
	aiopenai "github.com/xeuxdev/zerostar-backend/internal/openai"
	"github.com/xeuxdev/zerostar-backend/internal/server"
	"github.com/xeuxdev/zerostar-backend/internal/store"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "fatal: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	// ── Logger ─────────────────────────────────────────────────────────────────
	log, err := zap.NewProduction()
	if err != nil {
		return fmt.Errorf("building logger: %w", err)
	}
	defer func() { _ = log.Sync() }()

	// ── Config ─────────────────────────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("loading config: %w", err)
	}

	log.Info("configuration loaded",
		zap.String("port", cfg.Port),
		zap.String("openai_model", cfg.OpenAIModel),
		zap.Int("rate_limit_requests", cfg.RateLimitRequests),
		zap.Duration("rate_limit_window", cfg.RateLimitWindow),
	)

	// ── Root context with cancellation ────────────────────────────────────────
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	// ── OpenAI client ─────────────────────────────────────────────────────────
	aiService := aiopenai.New(cfg.OpenAIAPIKey, cfg.OpenAIModel, log)

	// ── Stores ────────────────────────────────────────────────────────────────
	reviewStore := store.NewReviewStore()

	// ── Handlers ──────────────────────────────────────────────────────────────
	chatHandler := handler.NewChatHandler(aiService, log)
	reviewHandler := handler.NewReviewHandler(reviewStore, log)

	// ── Rate limiter ──────────────────────────────────────────────────────────
	rateLimiter := appmiddleware.NewRateLimiter(cfg.RateLimitRequests, cfg.RateLimitWindow, log)

	// ── HTTP server ───────────────────────────────────────────────────────────
	httpHandler := server.New(chatHandler, reviewHandler, rateLimiter, cfg.AllowedOrigins, log)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      httpHandler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start in a goroutine so we can listen for shutdown signals.
	serverErr := make(chan error, 1)
	go func() {
		log.Info("server starting", zap.String("addr", srv.Addr))
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
		}
	}()

	// Block until we receive a signal or the server errors out.
	select {
	case err := <-serverErr:
		return fmt.Errorf("server error: %w", err)
	case <-ctx.Done():
		log.Info("shutdown signal received")
	}

	// Graceful shutdown with a 10-second deadline.
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("graceful shutdown failed: %w", err)
	}

	log.Info("server stopped gracefully")
	return nil
}
