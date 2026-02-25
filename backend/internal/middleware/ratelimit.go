package middleware

import (
	"encoding/json"
	"net"
	"net/http"
	"sync"
	"time"

	"go.uber.org/zap"
	"golang.org/x/time/rate"
)

// rateLimitEntry wraps a per-IP limiter together with the time it was last seen.
type rateLimitEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// RateLimiter is a middleware that enforces a per-IP token-bucket rate limit.
type RateLimiter struct {
	mu       sync.Mutex
	limiters map[string]*rateLimitEntry
	r        rate.Limit // tokens replenished per second
	b        int        // bucket size (burst)
	log      *zap.Logger
}

// NewRateLimiter constructs a RateLimiter.
//
//   - requests is the maximum number of requests allowed per window.
//   - window is the duration of the sliding window (e.g. 1 minute).
//
// Internally this translates to a token bucket with:
//
//	rate  = requests / window (tokens/second)
//	burst = requests           (maximum burst)
func NewRateLimiter(requests int, window time.Duration, log *zap.Logger) *RateLimiter {
	rl := &RateLimiter{
		limiters: make(map[string]*rateLimitEntry),
		r:        rate.Limit(float64(requests) / window.Seconds()),
		b:        requests,
		log:      log,
	}

	// Background goroutine that evicts entries not seen in 5× the window.
	go rl.cleanup(window * 5)

	return rl
}

func (rl *RateLimiter) getLimiter(ip string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	entry, ok := rl.limiters[ip]
	if !ok {
		entry = &rateLimitEntry{
			limiter: rate.NewLimiter(rl.r, rl.b),
		}
		rl.limiters[ip] = entry
	}

	entry.lastSeen = time.Now()
	return entry.limiter
}

func (rl *RateLimiter) cleanup(ttl time.Duration) {
	ticker := time.NewTicker(ttl / 2)
	defer ticker.Stop()

	for range ticker.C {
		rl.mu.Lock()
		for ip, entry := range rl.limiters {
			if time.Since(entry.lastSeen) > ttl {
				delete(rl.limiters, ip)
			}
		}
		rl.mu.Unlock()
	}
}

// Handler returns a chi-compatible middleware handler.
func (rl *RateLimiter) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := realIP(r)
		limiter := rl.getLimiter(ip)

		if !limiter.Allow() {
			rl.log.Warn("rate limit exceeded", zap.String("ip", ip))

			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.Header().Set("Retry-After", "60")
			w.WriteHeader(http.StatusTooManyRequests)

			_ = json.NewEncoder(w).Encode(map[string]string{
				"error":   "rate_limit_exceeded",
				"message": "Go get a job.",
			})
			return
		}

		next.ServeHTTP(w, r)
	})
}

// realIP extracts the most accurate client IP, honouring common proxy headers.
func realIP(r *http.Request) string {
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		// X-Forwarded-For can be a comma-separated list; the leftmost is the client.
		if host, _, err := net.SplitHostPort(ip); err == nil {
			return host
		}
		return ip
	}
	host, _, _ := net.SplitHostPort(r.RemoteAddr)
	return host
}
