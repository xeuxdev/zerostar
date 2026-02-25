package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"go.uber.org/zap"

	"github.com/xeuxdev/zerostar-backend/internal/domain"
	"github.com/xeuxdev/zerostar-backend/internal/store"
)

// ReviewHandler handles rage review endpoints.
type ReviewHandler struct {
	store *store.ReviewStore
	log   *zap.Logger
}

// NewReviewHandler creates a ReviewHandler.
func NewReviewHandler(s *store.ReviewStore, log *zap.Logger) *ReviewHandler {
	return &ReviewHandler{store: s, log: log}
}

// Create handles POST /api/v1/reviews.
func (h *ReviewHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateRageReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", "Invalid JSON. Much like your life choices.")
		return
	}

	if strings.TrimSpace(req.Comment) == "" {
		respondError(w, http.StatusBadRequest, "empty_comment", "An empty review. You can't even complain correctly.")
		return
	}

	review := h.store.Add(req.Rating, req.Comment)
	h.log.Info("rage review submitted", zap.String("id", review.ID), zap.Int("rating", review.Rating))
	respond(w, http.StatusCreated, review)
}

// List handles GET /api/v1/reviews.
func (h *ReviewHandler) List(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, map[string]interface{}{
		"reviews": h.store.List(),
	})
}
