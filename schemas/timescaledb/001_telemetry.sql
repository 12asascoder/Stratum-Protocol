-- STRATUM PROTOCOL — TimescaleDB Time-Series Schema
-- Urban telemetry hypertables for power, water, traffic, environmental sensors

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ===========================================================================
-- SENSOR TELEMETRY (primary hypertable)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS sensor_telemetry (
    time            TIMESTAMPTZ        NOT NULL,
    sensor_id       VARCHAR(64)        NOT NULL,
    city_id         VARCHAR(16)        NOT NULL,
    sector_id       VARCHAR(32)        NOT NULL,
    category        VARCHAR(32)        NOT NULL, -- power, water, traffic, environmental, structural, cyber
    metric_key      VARCHAR(64)        NOT NULL,
    value           DOUBLE PRECISION   NOT NULL,
    unit            VARCHAR(32),
    quality_score   REAL               DEFAULT 1.0,
    source_id       VARCHAR(64),
    is_outlier      BOOLEAN            DEFAULT FALSE,
    metadata        JSONB
);

SELECT create_hypertable(
    'sensor_telemetry', 'time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Compression policy — compress chunks older than 7 days
SELECT add_compression_policy('sensor_telemetry', INTERVAL '7 days');

-- Retention policy — drop data older than 2 years
SELECT add_retention_policy('sensor_telemetry', INTERVAL '2 years');

-- Continuous aggregates — 1-minute, 1-hour, 1-day rollups
CREATE MATERIALIZED VIEW sensor_telemetry_1min
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', time) AS bucket,
    sensor_id, city_id, category, metric_key,
    avg(value)  AS avg_value,
    min(value)  AS min_value,
    max(value)  AS max_value,
    stddev(value) AS stddev_value,
    count(*)    AS sample_count
FROM sensor_telemetry
GROUP BY bucket, sensor_id, city_id, category, metric_key
WITH NO DATA;

SELECT add_continuous_aggregate_policy('sensor_telemetry_1min',
    start_offset => INTERVAL '2 hours',
    end_offset   => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute');

CREATE MATERIALIZED VIEW sensor_telemetry_1hour
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    sensor_id, city_id, category, metric_key,
    avg(value)  AS avg_value,
    min(value)  AS min_value,
    max(value)  AS max_value,
    count(*)    AS sample_count
FROM sensor_telemetry
GROUP BY bucket, sensor_id, city_id, category, metric_key
WITH NO DATA;

SELECT add_continuous_aggregate_policy('sensor_telemetry_1hour',
    start_offset => INTERVAL '2 days',
    end_offset   => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Indexes
CREATE INDEX ON sensor_telemetry (sensor_id, time DESC);
CREATE INDEX ON sensor_telemetry (city_id, category, time DESC);
CREATE INDEX ON sensor_telemetry (sector_id, time DESC);
CREATE INDEX ON sensor_telemetry (is_outlier, time DESC) WHERE is_outlier = TRUE;

-- ===========================================================================
-- INFRASTRUCTURE STRESS METRICS
-- ===========================================================================
CREATE TABLE IF NOT EXISTS infra_stress_metrics (
    time                TIMESTAMPTZ      NOT NULL,
    node_id             VARCHAR(64)      NOT NULL,
    city_id             VARCHAR(16)      NOT NULL,
    stress_score        REAL             NOT NULL, -- 0-1
    fatigue_index       REAL,
    load_factor         REAL,
    health_score        REAL,
    failure_probability REAL,
    maintenance_due     BOOLEAN          DEFAULT FALSE,
    metadata            JSONB
);

SELECT create_hypertable(
    'infra_stress_metrics', 'time',
    chunk_time_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

CREATE INDEX ON infra_stress_metrics (node_id, time DESC);
CREATE INDEX ON infra_stress_metrics (failure_probability, time DESC) WHERE failure_probability > 0.5;

-- ===========================================================================
-- SIMULATION TRACE EVENTS
-- ===========================================================================
CREATE TABLE IF NOT EXISTS simulation_trace_events (
    time            TIMESTAMPTZ   NOT NULL,
    simulation_id   UUID          NOT NULL,
    city_id         VARCHAR(16)   NOT NULL,
    event_type      VARCHAR(64)   NOT NULL,
    hop             INTEGER,
    affected_node   VARCHAR(64),
    probability     REAL,
    payload         JSONB
);

SELECT create_hypertable(
    'simulation_trace_events', 'time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);
