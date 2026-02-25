package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"unicode"

	"github.com/sashabaranov/go-openai"
	"go.uber.org/zap"

	"github.com/xeuxdev/zerostar-backend/internal/domain"
)

// AIService is the contract the chat handler needs from its AI backend.
type AIService interface {
	Chat(ctx context.Context, history []domain.Message, userMessage string) (string, error)
	ChatStream(ctx context.Context, history []domain.Message, userMessage string) (*openai.ChatCompletionStream, error)
	Diagnose(ctx context.Context, history []domain.Message) (string, error)
}

// ChatHandler handles chat and diagnosis endpoints.
type ChatHandler struct {
	ai  AIService
	log *zap.Logger
}

// NewChatHandler creates a ChatHandler.
func NewChatHandler(ai AIService, log *zap.Logger) *ChatHandler {
	return &ChatHandler{ai: ai, log: log}
}

// Chat handles POST /api/v1/chat.
// To support streaming, it checks if the request wants SSE, but defaults to JSON if not.
// Wait, the new client will just read the stream. Let's make it stream by default.
func (h *ChatHandler) Chat(w http.ResponseWriter, r *http.Request) {
	var req domain.ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", "Could not parse request body. Try using valid JSON next time.")
		return
	}

	if strings.TrimSpace(req.Message) == "" {
		respondError(w, http.StatusBadRequest, "empty_message", "You sent an empty message. Groundbreaking.")
		return
	}

	req.Message = strings.TrimSpace(req.Message)
	rageMode := isRaging(req.Message)

	stream, err := h.ai.ChatStream(r.Context(), req.History, req.Message)
	if err != nil {
		h.log.Error("chat AI stream error", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "ai_error", "The AI is having a moment. Unlike you, it has an excuse.")
		return
	}
	defer stream.Close()

	// Set headers for SSE
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		h.log.Error("Streaming not supported by response writer")
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	// Send initial metadata event with rageMode
	initData, _ := json.Marshal(map[string]any{"type": "start", "rage_mode": rageMode})
	w.Write([]byte("data: " + string(initData) + "\n\n"))
	flusher.Flush()

	for {
		resp, err := stream.Recv()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			h.log.Error("stream element error", zap.Error(err))
			break
		}

		if len(resp.Choices) > 0 {
			content := resp.Choices[0].Delta.Content
			if content != "" {
				chunkData, _ := json.Marshal(map[string]any{"type": "chunk", "content": content})
				w.Write([]byte("data: " + string(chunkData) + "\n\n"))
				flusher.Flush()
			}
		}
	}

	w.Write([]byte("data: {\"type\": \"done\"}\n\n"))
	flusher.Flush()
}

// Diagnose handles POST /api/v1/diagnose.
func (h *ChatHandler) Diagnose(w http.ResponseWriter, r *http.Request) {
	var req domain.DiagnoseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid_request", "Could not parse request body.")
		return
	}

	diagnosis, err := h.ai.Diagnose(r.Context(), req.History)
	if err != nil {
		h.log.Error("diagnose AI error", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "ai_error", "Diagnosis failed. The irony is not lost.")
		return
	}

	respond(w, http.StatusOK, domain.DiagnoseResponse{Diagnosis: diagnosis})
}

// isRaging returns true if the message looks like the user is "raging"
// (all caps with mostly letters, or excessive exclamation/question marks).
func isRaging(msg string) bool {
	if len(msg) < 5 {
		return false
	}

	var letters, upper, punct int
	for _, r := range msg {
		if unicode.IsLetter(r) {
			letters++
			if unicode.IsUpper(r) {
				upper++
			}
		}
		if r == '!' || r == '?' {
			punct++
		}
	}

	return (letters > 0 && upper*100/letters > 70) || punct >= 3
}
