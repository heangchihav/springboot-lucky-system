# Military/Bank-Grade Security Implementation

This document describes the security architecture implemented for this application.

## Security Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TLS 1.3 + HSTS                           │
│              (Transport Layer Security)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Access JWT (3 minutes)                  │    │
│  │  • ver claim (token version)                         │    │
│  │  • jti claim (unique token ID)                       │    │
│  │  • uid claim (user ID)                               │    │
│  │  • Short-lived for minimal exposure                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Redis Token Blacklist (Optional)           │    │
│  │  • JTI blacklist for immediate revocation            │    │
│  │  • User token version cache                          │    │
│  │  • Auto-expiring entries                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Refresh Token (7 days)                  │    │
│  │  • Token rotation on each use                        │    │
│  │  • SHA-256 hashing (never stored plain)              │    │
│  │  • Device fingerprint binding                        │    │
│  │  • Token family tracking (theft detection)           │    │
│  └─────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              User token_version                      │    │
│  │  • Increment to invalidate ALL tokens                │    │
│  │  • Global session revocation                         │    │
│  │  • Password change triggers increment                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 1. TLS 1.3 + HSTS
- **HSTS Header**: Forces HTTPS with 1-year max-age
- **Preload**: Ready for browser preload lists
- **Include Subdomains**: Protects all subdomains

### 2. Short-Lived Access Tokens (3 minutes)
- Minimizes exposure window if token is compromised
- Contains `ver` claim for version validation
- Contains `jti` claim for blacklist checking
- Stateless validation (no database lookup required)

### 3. Refresh Token Rotation
- Each refresh token can only be used ONCE
- New token issued on each refresh
- Old token marked as used
- Token family tracking detects theft

### 4. Token Hashing
- Refresh tokens stored as SHA-256 hash
- Plain text token returned only once to client
- Even database breach doesn't expose tokens

### 5. Device Binding (Enhanced)
- Tokens bound to device fingerprint
- **Multi-factor validation on refresh:**
  - User-Agent hash (SHA-256)
  - IP prefix (/24 for IPv4, /64 for IPv6)
  - Optional client device ID
- **Mismatch triggers FULL token revocation** for user
- Prevents token theft even if attacker has the token

### 6. Token Family Tracking
- All rotated tokens share a family ID
- If used token is reused → entire family revoked
- Detects token theft scenarios

### 7. User Token Version
- Stored in User entity
- Included in JWT `ver` claim
- Increment to invalidate ALL user tokens
- Used for: password change, logout all, security events

### 8. Redis Blacklist (Optional)
- Immediate token revocation via JTI blacklist
- Entries auto-expire with token TTL
- Graceful degradation if Redis unavailable

### 9. JTI Tracking (Redis)
- Tracks last 2 active JTIs per device
- Validates JTI on every request
- Detects IP changes during session (suspicious activity)
- Prevents token replay attacks

### 10. Rate Limiting (Redis)
- **Endpoint-specific limits:**
  - `/login`: 5 requests/minute per IP
  - `/refresh`: 10 requests/minute per IP
  - `/logout`: 5 requests/minute per IP
  - `/me`: 60 requests/minute per user
- Returns `429 Too Many Requests` with `Retry-After` header
- Sliding window algorithm for accuracy

### 11. Brute Force Protection
- Account locks after 5 failed attempts
- 15-minute lockout duration
- Automatic unlock after expiry

### 12. Security Headers
- **X-Frame-Options**: DENY (clickjacking protection)
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Content-Security-Policy**: Strict CSP rules
- **Permissions-Policy**: Restricts browser features

## API Endpoints

### Authentication
```
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/logout-all
GET  /api/auth/me
```

### Login Request
```json
{
  "username": "user@example.com",
  "password": "secure-password"
}
```

### Login Response
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHNlY3VyZSByZWZyZXNoIHRva2Vu...",
  "accessTokenExpiresIn": 180,
  "refreshTokenExpiresIn": 604800,
  "tokenType": "Bearer"
}
```

## Configuration

### Required Environment Variables

```bash
# JWT Secret (minimum 32 characters)
JWT_SECRET=your-256-bit-secret-key-minimum-32-characters

# Redis (optional but recommended)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Cookie security (set to true in production with HTTPS)
COOKIE_SECURE=true
```

### Application Properties

```properties
# JWT Configuration
security.jwt.secret=${JWT_SECRET}
security.jwt.access-token-expiration-minutes=3
security.jwt.issuer=secure-app

# Refresh Token
security.refresh-token.expiration-days=7
security.refresh-token.max-devices=5

# HSTS
security.hsts.enabled=true
security.hsts.max-age-seconds=31536000

# Brute Force Protection
security.brute-force.max-attempts=5
security.brute-force.lock-duration-minutes=15

# Token Blacklist
security.blacklist.enabled=true
```

## Database Schema

### Users Table (Extended)
```sql
ALTER TABLE users ADD COLUMN token_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN account_locked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN lock_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT TRUE;
```

### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    token_family VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id),
    device_fingerprint VARCHAR(64) NOT NULL,
    device_name VARCHAR(255),
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    user_token_version BIGINT NOT NULL
);

CREATE INDEX idx_refresh_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_token_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_token_family ON refresh_tokens(token_family);
```

## Security Scenarios

### Scenario 1: Token Theft Detection
1. Attacker steals refresh token
2. Attacker uses token → gets new token pair
3. Legitimate user tries to use old token
4. System detects reuse → revokes ENTIRE token family
5. Both attacker and user must re-authenticate

### Scenario 2: Password Change
1. User changes password
2. System increments `token_version`
3. All existing JWTs become invalid (ver mismatch)
4. All refresh tokens become invalid
5. User must re-authenticate on all devices

### Scenario 3: Suspicious Activity
1. Admin detects suspicious activity
2. Admin increments user's `token_version`
3. All sessions immediately invalidated
4. User must re-authenticate

### Scenario 4: Device Stolen
1. User reports device stolen
2. User logs out from all devices
3. System revokes all refresh tokens
4. System increments `token_version`
5. Stolen device's tokens become useless

## Production Checklist

- [ ] Generate secure JWT secret (256-bit minimum)
- [ ] Enable HTTPS/TLS 1.3
- [ ] Set `COOKIE_SECURE=true`
- [ ] Configure Redis for token blacklist
- [ ] Set up database backups
- [ ] Enable audit logging
- [ ] Configure rate limiting at load balancer
- [ ] Set up monitoring and alerting
- [ ] Review and test all security headers
- [ ] Perform penetration testing

## Generating Secure JWT Secret

```bash
# Using OpenSSL
openssl rand -base64 32

# Using /dev/urandom
head -c 32 /dev/urandom | base64
```
