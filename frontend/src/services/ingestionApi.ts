/**
 * STRATUM PROTOCOL — Data Ingestion Service API client
 * Communicates with the data-ingestion-service on port 8001
 * through the Vite dev proxy (/api/ingestion → /api/v1, /health/ingestion → /health)
 */

import axios from 'axios';

const BASE = '/api/ingestion';
const HEALTH_URL = '/health/ingestion';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface HealthResponse {
    status: string;
    timestamp: string;
    service: string;
}

export interface IngestionStats {
    validator: {
        validated: number;
        rejected: number;
        acceptance_rate: number;
    };
    timestamp: number;
}

export interface StreamStatus {
    producer: {
        status: 'connected' | 'disconnected';
        stats: Record<string, unknown>;
    };
    consumer: {
        status: 'running' | 'offline';
    };
    timestamp: number;
}

export interface TopicsResponse {
    raw: string;
    validated: string;
    alerts: string;
    dlq: string;
}

export type SensorCategory = 'power' | 'water' | 'traffic' | 'environmental' | 'structural' | 'cyber' | 'social';

export interface SensorPayload {
    sensor_id: string;
    source_id: string;
    category: SensorCategory;
    city_id: string;
    sector_id: string;
    timestamp_ms: number;
    values: Record<string, number>;
    unit_map?: Record<string, string>;
    metadata?: Record<string, unknown>;
}

export interface IngestResponse {
    status: string;
    sensor_id: string;
    quality_score: number;
    processing_time_ms: number;
    outliers_detected: number;
}

// ── API calls ──────────────────────────────────────────────────────────────────

/** Check service health */
export async function fetchHealth(): Promise<HealthResponse> {
    const { data } = await axios.get<HealthResponse>(HEALTH_URL);
    return data;
}

/** Get current ingestion stats (validated / rejected counts) */
export async function fetchIngestionStats(): Promise<IngestionStats> {
    const { data } = await axios.get<IngestionStats>(`${BASE}/ingest/stats`);
    return data;
}

/** Get Kafka producer / consumer stream status */
export async function fetchStreamStatus(): Promise<StreamStatus> {
    const { data } = await axios.get<StreamStatus>(`${BASE}/streams/status`);
    return data;
}

/** List active Kafka topics */
export async function fetchTopics(): Promise<TopicsResponse> {
    const { data } = await axios.get<TopicsResponse>(`${BASE}/streams/topics`);
    return data;
}

/** Ingest a sensor payload and return validation + routing result */
export async function ingestSensorData(payload: SensorPayload): Promise<IngestResponse> {
    const { data } = await axios.post<IngestResponse>(`${BASE}/ingest/`, payload);
    return data;
}

/** Build a sample sensor payload for quick testing */
export function buildSamplePayload(
    category: SensorCategory = 'power',
    cityId = 'NYC',
): SensorPayload {
    const categoryValues: Record<SensorCategory, Record<string, number>> = {
        power: { voltage: 220 + Math.random() * 10, load_kw: 1200 + Math.random() * 200 },
        water: { flow_lps: 45 + Math.random() * 5, pressure_bar: 3.2 + Math.random() * 0.5 },
        traffic: { vehicle_count: Math.floor(120 + Math.random() * 60), avg_speed_kmh: 40 + Math.random() * 20 },
        environmental: { temp_c: 22 + Math.random() * 8, humidity_pct: 60 + Math.random() * 20, aqi: Math.floor(50 + Math.random() * 30) },
        structural: { vibration_mm_s: Math.random() * 2, stress_mpa: 10 + Math.random() * 5 },
        cyber: { packets_per_sec: 5000 + Math.random() * 2000, anomaly_score: Math.random() * 0.3 },
        social: { incident_count: Math.floor(Math.random() * 10), mobility_index: 0.7 + Math.random() * 0.3 },
    };

    return {
        sensor_id: `${category.toUpperCase()}-${cityId}-${Date.now().toString(36).toUpperCase()}`,
        source_id: `stratum-frontend-test`,
        category,
        city_id: cityId,
        sector_id: `SECTOR-${Math.floor(Math.random() * 9) + 1}`,
        timestamp_ms: Date.now(),
        values: categoryValues[category],
        unit_map: {},
        metadata: { injected_by: 'stratum-ui' },
    };
}
