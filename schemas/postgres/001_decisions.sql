-- STRATUM PROTOCOL — PostgreSQL Schema v1.0
-- Decision Ledger, Users, Policies, Audit Trail

-- ===========================================================================
-- EXTENSIONS
-- ===========================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================================================
-- USERS & RBAC
-- ===========================================================================
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username      VARCHAR(64) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(32) NOT NULL CHECK (role IN ('OPERATOR', 'ANALYST', 'GOVERNOR', 'ADMIN', 'AUDITOR')),
    city_id       VARCHAR(16),
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    last_login    TIMESTAMPTZ
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_city ON users(city_id);

-- ===========================================================================
-- DECISION LEDGER (Immutable Append-Only)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS decision_blocks (
    id                  BIGSERIAL PRIMARY KEY,
    block_index         BIGINT UNIQUE NOT NULL,
    decision_id         UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    decision_type       VARCHAR(64) NOT NULL,
    status              VARCHAR(32) NOT NULL CHECK (status IN ('pending', 'executed', 'human_override', 'rejected', 'expired')),

    -- AI Metadata
    ai_recommendation   TEXT NOT NULL,
    confidence_lower    NUMERIC(5,4) NOT NULL,
    confidence_upper    NUMERIC(5,4) NOT NULL,
    model_id            VARCHAR(128) NOT NULL,
    model_version       VARCHAR(64) NOT NULL,
    reasoning_trace     TEXT,

    -- Payload
    payload_json        JSONB NOT NULL,

    -- Cryptographic Chain
    prev_hash           CHAR(64) NOT NULL,
    payload_hash        CHAR(64) NOT NULL,
    block_hash          CHAR(64) UNIQUE NOT NULL,
    merkle_root         CHAR(64),

    -- Human Override
    human_override      BOOLEAN DEFAULT FALSE,
    override_reason     TEXT,
    override_operator   UUID REFERENCES users(id),
    multi_sig_json      JSONB,

    -- Outcome Tracking
    real_world_outcome  JSONB,
    outcome_delta       NUMERIC(12,6),
    outcome_recorded_at TIMESTAMPTZ,

    -- Context
    city_id             VARCHAR(16) NOT NULL,
    session_id          UUID,
    operator_id         UUID REFERENCES users(id),

    -- Timing (cannot be updated after insert — enforced by trigger)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TRIGGER: Prevent any updates or deletes to ensure immutability
CREATE OR REPLACE FUNCTION enforce_ledger_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Allow only outcome fields to be updated
        IF OLD.block_hash != NEW.block_hash OR
           OLD.payload_hash != NEW.payload_hash OR
           OLD.prev_hash != NEW.prev_hash THEN
            RAISE EXCEPTION 'Ledger blocks are immutable — cryptographic fields cannot be modified';
        END IF;
    END IF;
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Ledger blocks are immutable — delete is forbidden';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_immutability_guard
BEFORE UPDATE OR DELETE ON decision_blocks
FOR EACH ROW EXECUTE FUNCTION enforce_ledger_immutability();

CREATE INDEX idx_decisions_city        ON decision_blocks(city_id);
CREATE INDEX idx_decisions_status      ON decision_blocks(status);
CREATE INDEX idx_decisions_type        ON decision_blocks(decision_type);
CREATE INDEX idx_decisions_created_at  ON decision_blocks(created_at DESC);
CREATE INDEX idx_decisions_block_hash  ON decision_blocks(block_hash);
CREATE INDEX idx_decisions_model       ON decision_blocks(model_id, model_version);

-- ===========================================================================
-- POLICY SIMULATION RESULTS
-- ===========================================================================
CREATE TABLE IF NOT EXISTS policy_simulations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_name     VARCHAR(255) NOT NULL,
    city_id             VARCHAR(16) NOT NULL,
    scenario_type       VARCHAR(64) NOT NULL,
    mc_samples          INTEGER NOT NULL DEFAULT 10000,
    status              VARCHAR(32) NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    results_json        JSONB,
    pareto_frontier     JSONB,
    feasibility_score   NUMERIC(5,4),
    risk_score          NUMERIC(5,4),
    roi_score           NUMERIC(8,4),
    triggered_by        UUID REFERENCES users(id),
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_simulations_city   ON policy_simulations(city_id);
CREATE INDEX idx_simulations_status ON policy_simulations(status);

-- ===========================================================================
-- AUDIT TRAIL
-- ===========================================================================
CREATE TABLE IF NOT EXISTS audit_events (
    id              BIGSERIAL PRIMARY KEY,
    event_type      VARCHAR(64) NOT NULL,
    actor_id        UUID REFERENCES users(id),
    actor_ip        INET,
    target_resource VARCHAR(128),
    target_id       VARCHAR(255),
    action          VARCHAR(64) NOT NULL,
    before_state    JSONB,
    after_state     JSONB,
    metadata        JSONB,
    city_id         VARCHAR(16),
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit trail is also immutable
CREATE RULE no_update_audit AS ON UPDATE TO audit_events DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_events DO INSTEAD NOTHING;

CREATE INDEX idx_audit_actor     ON audit_events(actor_id);
CREATE INDEX idx_audit_timestamp ON audit_events(timestamp DESC);
CREATE INDEX idx_audit_type      ON audit_events(event_type);
CREATE INDEX idx_audit_city      ON audit_events(city_id);

-- ===========================================================================
-- AI MODEL REGISTRY
-- ===========================================================================
CREATE TABLE IF NOT EXISTS model_registry (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id        VARCHAR(128) NOT NULL,
    version         VARCHAR(64) NOT NULL,
    service_name    VARCHAR(64) NOT NULL,
    artifact_uri    TEXT NOT NULL,
    checksum_sha256 CHAR(64) NOT NULL,
    metrics         JSONB,
    is_active       BOOLEAN DEFAULT FALSE,
    deployed_by     UUID REFERENCES users(id),
    deployed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(model_id, version)
);
