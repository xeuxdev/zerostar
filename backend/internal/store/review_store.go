// Package store provides an in-memory store for rage reviews.
// In production this would be replaced by a persistent database layer
// (e.g., PostgreSQL with pgx).
package store

import (
	"fmt"
	"sync"
	"time"

	"github.com/xeuxdev/zerostar-backend/internal/domain"
)

// ReviewStore is a thread-safe, in-memory repository for rage reviews.
type ReviewStore struct {
	mu      sync.RWMutex
	reviews []domain.RageReview
	nextID  int
}

// NewReviewStore returns an empty ReviewStore.
func NewReviewStore() *ReviewStore {
	return &ReviewStore{nextID: 1}
}

// Add persists a new review and returns it with a generated ID.
func (s *ReviewStore) Add(rating int, comment string) domain.RageReview {
	s.mu.Lock()
	defer s.mu.Unlock()

	review := domain.RageReview{
		ID:        fmt.Sprintf("%d", s.nextID),
		Rating:    clampRating(rating),
		Comment:   comment,
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}
	s.reviews = append(s.reviews, review)
	s.nextID++
	return review
}

// List returns all reviews in insertion order.
func (s *ReviewStore) List() []domain.RageReview {
	s.mu.RLock()
	defer s.mu.RUnlock()

	out := make([]domain.RageReview, len(s.reviews))
	copy(out, s.reviews)
	return out
}

func clampRating(r int) int {
	if r < 1 {
		return 1
	}
	if r > 5 {
		return 5
	}
	return r
}
