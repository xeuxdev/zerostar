package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all application configuration.
type Config struct {
	Port string

	// OpenAI
	OpenAIAPIKey string
	OpenAIModel  string

	// Rate limiting (token bucket per IP)
	RateLimitRequests int           // tokens per window
	RateLimitWindow   time.Duration // refill interval

	// CORS
	AllowedOrigins []string
}

// Load reads configuration from a .env file (if present) then from the OS environment.
func Load() (*Config, error) {
	// Best-effort: load .env if it exists (won't error if absent)
	_ = godotenv.Load()

	cfg := &Config{
		Port:         getEnv("PORT", "8080"),
		OpenAIAPIKey: mustEnv("OPENAI_API_KEY"),
		OpenAIModel:  getEnv("OPENAI_MODEL", "gpt-5.1"),
		AllowedOrigins: []string{
			getEnv("ALLOWED_ORIGIN", "http://localhost:3000"),
		},
	}

	rps, err := strconv.Atoi(getEnv("RATE_LIMIT_REQUESTS", "10"))
	if err != nil {
		return nil, fmt.Errorf("RATE_LIMIT_REQUESTS must be an integer: %w", err)
	}
	cfg.RateLimitRequests = rps

	windowSec, err := strconv.Atoi(getEnv("RATE_LIMIT_WINDOW_SECONDS", "60"))
	if err != nil {
		return nil, fmt.Errorf("RATE_LIMIT_WINDOW_SECONDS must be an integer: %w", err)
	}
	cfg.RateLimitWindow = time.Duration(windowSec) * time.Second

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func mustEnv(key string) string {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		panic(fmt.Sprintf("required environment variable %q is not set", key))
	}
	return v
}
