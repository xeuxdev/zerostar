package handler

import (
	"net/http"
)

// Health handles GET /health.
func Health(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "zero-star-therapy",
	})
}
