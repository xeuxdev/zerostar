package domain

// RageReview is a user-submitted post-chat "Yelp" review.
type RageReview struct {
	ID        string `json:"id"`
	Rating    int    `json:"rating"` // 1–5, almost always 1
	Comment   string `json:"comment"`
	CreatedAt string `json:"created_at"` // RFC3339
}

// CreateRageReviewRequest is what clients POST to submit a review.
type CreateRageReviewRequest struct {
	Rating  int    `json:"rating"`
	Comment string `json:"comment"`
}
