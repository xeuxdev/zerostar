.PHONY: run dev build lint test tidy

## dev: start the dev server with hot-reload (requires air)
dev:
	air

## run: start the dev server without hot-reload (reads .env)
run:
	go run ./cmd/api/...

## build: compile to bin/api
build:
	go build -o bin/api ./cmd/api/...

## test: run all tests
test:
	go test -race -count=1 ./...

## lint: run staticcheck and vet
lint:
	go vet ./...

## tidy: tidy and verify the module
tidy:
	go mod tidy
	go mod verify
