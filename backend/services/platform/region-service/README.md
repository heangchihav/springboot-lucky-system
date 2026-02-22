# Region Service

A professional Rust-based microservice for managing geographical regions, sub-areas, and branches.

## Architecture

This service follows a clean, layered architecture pattern:

```
src/
├── config/           # Configuration management
├── db/               # Database layer
│   ├── connection.rs    # Database connection handling
│   ├── migrations.rs   # Database schema migrations
│   ├── queries.rs      # Database query operations
│   └── mod.rs          # Module exports
├── errors/           # Error handling and types
├── handlers/         # HTTP request handlers
├── models/           # Data models and structs
├── routes/           # API route configuration
├── services/         # Business logic layer
│   ├── area_service.rs     # Area business logic
│   ├── subarea_service.rs  # Sub-area business logic
│   ├── branch_service.rs    # Branch business logic
│   └── mod.rs             # Module exports
├── utils/            # Utility functions
│   ├── response.rs        # API response helpers
│   └── mod.rs             # Module exports
└── main.rs           # Application entry point
```

## Features

- **Clean Architecture**: Separation of concerns with distinct layers
- **Error Handling**: Comprehensive error types and HTTP response mapping
- **Database Migrations**: Automatic schema creation and updates
- **Validation**: Input validation at service layer
- **Logging**: Structured logging with appropriate levels
- **API Documentation**: RESTful API with consistent response format

## API Endpoints

### Health Check
- `GET /api/region/health` - Basic health check
- `GET /api/region/actuator/health` - Spring Boot compatible health check

### Areas
- `GET /api/region/areas` - List all areas
- `GET /api/region/areas/{id}` - Get specific area
- `POST /api/region/areas` - Create new area
- `PUT /api/region/areas/{id}` - Update area
- `DELETE /api/region/areas/{id}` - Delete area

### Sub-Areas
- `GET /api/region/sub-areas` - List all sub-areas
- `GET /api/region/sub-areas/{id}` - Get specific sub-area
- `POST /api/region/sub-areas` - Create new sub-area
- `PUT /api/region/sub-areas/{id}` - Update sub-area
- `DELETE /api/region/sub-areas/{id}` - Delete sub-area

### Branches
- `GET /api/region/branches` - List all branches
- `GET /api/region/branches/{id}` - Get specific branch
- `POST /api/region/branches` - Create new branch
- `PUT /api/region/branches/{id}` - Update branch
- `DELETE /api/region/branches/{id}` - Delete branch

## Configuration

The service uses environment variables for configuration:

- `SERVER_HOST`: Server host (default: 0.0.0.0)
- `SERVER_PORT`: Server port (default: 8086)
- `DATABASE_URL`: PostgreSQL connection URL
- `RUST_LOG`: Logging level (default: info)

## Database Schema

The service manages three main entities:

1. **Areas**: Top-level geographical regions
2. **Sub-Areas**: Sub-divisions within areas
3. **Branches**: Physical locations within sub-areas

All entities include:
- UUID-based primary keys
- Created and updated timestamps
- Proper foreign key relationships
- Optimized indexes for performance

## Development

### Prerequisites
- Rust 1.88+
- PostgreSQL 12+
- Docker (optional)

### Running Locally
```bash
# Set environment variables
export DATABASE_URL="postgres://user:password@localhost:5432/region_service_db"
export SERVER_PORT=8086

# Run the service
cargo run
```

### Running with Docker
```bash
# Build and run
docker compose up --build region-service

# Or run full stack
docker compose up --build
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Error Handling

The service includes comprehensive error handling:

- **ValidationError**: Input validation failures (400 Bad Request)
- **DatabaseError**: Database operation failures (500 Internal Server Error)
- **NotFound**: Resource not found (404 Not Found)
- **InternalError**: Unexpected internal errors (500 Internal Server Error)

## Logging

Structured logging includes:
- Service startup information
- Database connection status
- Request/response logging
- Error details with context

## Security

- Input validation at service layer
- SQL injection prevention through parameterized queries
- Proper error message sanitization
- CORS configuration through gateway

## Performance

- Database connection pooling
- Optimized queries with proper indexing
- Efficient JSON serialization
- Minimal memory footprint

## Testing

The service structure supports comprehensive testing:
- Unit tests for business logic
- Integration tests for API endpoints
- Database migration tests
- Error handling tests