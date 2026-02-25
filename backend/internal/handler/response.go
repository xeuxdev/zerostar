package handler

import (
	"encoding/json"
	"net/http"
)

// respond writes a JSON body with the given status code.
func respond(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(data)
}

// respondError writes a standardised JSON error body.
func respondError(w http.ResponseWriter, statusCode int, code, message string) {
	respond(w, statusCode, map[string]string{
		"error":   code,
		"message": message,
	})
}
