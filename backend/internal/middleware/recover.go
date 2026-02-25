package middleware

import (
	"encoding/json"
	"net/http"

	"go.uber.org/zap"
)

// Recoverer is a middleware that recovers from panics, logs the error with zap,
// and returns a clean 500 JSON response rather than crashing the server.
func Recoverer(log *zap.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rec := recover(); rec != nil {
					log.Error("panic recovered",
						zap.Any("panic", rec),
						zap.String("path", r.URL.Path),
					)

					w.Header().Set("Content-Type", "application/json; charset=utf-8")
					w.WriteHeader(http.StatusInternalServerError)
					_ = json.NewEncoder(w).Encode(map[string]string{
						"error":   "internal_server_error",
						"message": "Something exploded on our end. Somehow, still not your fault.",
					})
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}
