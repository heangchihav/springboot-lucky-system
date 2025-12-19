--liquibase formatted sql

--changeset cascade:002-create-refresh-tokens
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='refresh_tokens';
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL,
    token_family VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    device_fingerprint VARCHAR(64) NOT NULL,
    device_name VARCHAR(255),
    ip_address VARCHAR(45),
    ip_prefix VARCHAR(45) NOT NULL,
    user_agent_hash VARCHAR(64) NOT NULL,
    device_id VARCHAR(64),
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    user_token_version BIGINT NOT NULL
);

ALTER TABLE refresh_tokens
    ADD CONSTRAINT uk_refresh_tokens_token_hash UNIQUE (token_hash);

ALTER TABLE refresh_tokens
    ADD CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

CREATE INDEX idx_refresh_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_token_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_token_family ON refresh_tokens(token_family);
