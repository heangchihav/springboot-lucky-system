# Branch Report Service

A Rust Actix Web microservice for managing branch sales reports.

## Overview

This service provides REST APIs for:
- Creating branch sales reports
- Retrieving reports by branch
- Listing all reports
- Health checks for monitoring

## API Endpoints

### Health Checks
- `GET /health` - Basic health check
- `GET /actuator/health` - Spring Boot compatible health check

### Branch Reports
- `GET /api/branch-reports/reports` - List all reports
- `GET /api/branch-reports/reports/branch/{branch_id}` - Get reports by branch
- `POST /api/branch-reports/reports` - Create a new report

## Data Model

```rust
struct BranchReport {
    id: Uuid,
    branch_id: i32,
    report_date: DateTime<Utc>,
    total_sales: f64,
    total_orders: i32,
    created_at: DateTime<Utc>,
}
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Service port (default: 8085)

## Database Schema

```sql
CREATE TABLE branch_reports (
    id UUID PRIMARY KEY,
    branch_id INTEGER NOT NULL,
    report_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_sales DECIMAL(10,2) NOT NULL,
    total_orders INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_branch_reports_branch_id ON branch_reports(branch_id);
CREATE INDEX idx_branch_reports_date ON branch_reports(report_date);
```

## Development

### Prerequisites
- Rust 1.75+
- PostgreSQL 12+

### Running Locally

```bash
# Set environment variables
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/branchreport_service_db"
export PORT=8085

# Run the service
cargo run
```

### Building Docker Image

```bash
docker build -t branchreport-service .
```

## Integration

This service integrates with the existing microservices architecture:

- **Gateway**: Routes `/api/branch-reports/**` to this service
- **Database**: Uses dedicated `branchreport_service_db` PostgreSQL database
- **Monitoring**: Provides health endpoints for Kubernetes probes
- **Authentication**: Receives user context headers from gateway

## Deployment

The service is deployed alongside other microservices via:
- Docker Compose (development)
- Kubernetes (production)

See the main project README for deployment instructions.
