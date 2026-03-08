FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . ./
RUN go build -o pinflow-api .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/pinflow-api .
EXPOSE 34115
CMD ["./pinflow-api"]
