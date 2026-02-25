package domain

// Role represents who authored a message in the conversation.
type Role string

const (
	RoleUser  Role = "user"
	RoleModel Role = "model"
)

// Message is a single turn in a conversation.
type Message struct {
	Role    Role   `json:"role"`
	Content string `json:"content"`
}

// ChatRequest is the payload the client sends when starting/continuing a session.
type ChatRequest struct {
	// History is the ordered list of prior turns (oldest first).
	// The client is responsible for maintaining this slice across turns.
	History []Message `json:"history"`

	// Message is the new user message for this turn.
	Message string `json:"message"`
}

// ChatResponse is what we return on a successful turn.
type ChatResponse struct {
	Reply   string    `json:"reply"`
	History []Message `json:"history"` // updated history including this turn
}

// DiagnoseRequest asks the AI to produce a "clinical summary" of the session.
type DiagnoseRequest struct {
	History []Message `json:"history"`
}

// DiagnoseResponse wraps the blunt clinical diagnosis.
type DiagnoseResponse struct {
	Diagnosis string `json:"diagnosis"`
}
