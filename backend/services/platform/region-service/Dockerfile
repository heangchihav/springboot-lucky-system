# Use Rust image
FROM rust:1.88-slim

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy source code
COPY . .

# Build the application
RUN cargo build --release

# Create app user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Change ownership to appuser
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8086

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8086/api/region/health || exit 1

# Run the application
CMD ["./target/release/region-service"]
