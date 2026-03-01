import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    fetchHealth,
    fetchIngestionStats,
    fetchStreamStatus,
    fetchTopics,
    ingestSensorData,
    buildSamplePayload,
    SensorCategory,
    SensorPayload,
} from '../services/ingestionApi';

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusDot({ ok }: { ok: boolean }) {
    return (
        <span style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: ok ? 'var(--green)' : 'var(--red)',
            boxShadow: ok ? '0 0 6px var(--green)' : '0 0 6px var(--red)',
            marginRight: 6, flexShrink: 0,
        }} />
    );
}

function ServiceHealthBanner({ healthy, timestamp }: { healthy: boolean; timestamp?: string }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 18px',
            background: healthy ? 'rgba(0,255,136,0.05)' : 'rgba(255,59,59,0.08)',
            border: `1px solid ${healthy ? 'var(--green)' : 'var(--red)'}`,
            borderRadius: 8,
        }}>
            <StatusDot ok={healthy} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: healthy ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                {healthy ? 'DATA INGESTION SERVICE · ONLINE' : 'DATA INGESTION SERVICE · OFFLINE'}
            </span>
            {timestamp && (
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    last checked: {new Date(timestamp).toLocaleTimeString()}
                </span>
            )}
        </div>
    );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
    return (
        <div className="metric-card">
            <div className="metric-label">{label}</div>
            <div className="metric-value" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
            {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
        </div>
    );
}

function TopicPill({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--cyan)', width: 90, flexShrink: 0 }}>{label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{value}</span>
        </div>
    );
}

// ── Ingest test panel ──────────────────────────────────────────────────────────

const SENSOR_CATEGORIES: SensorCategory[] = ['power', 'water', 'traffic', 'environmental', 'structural', 'cyber', 'social'];
const CITY_IDS = ['NYC', 'LDN', 'TKY', 'DXB', 'SAO', 'LAG', 'SYD'];

interface IngestEntry {
    id: number;
    ts: string;
    sensor_id: string;
    category: string;
    city: string;
    quality: number;
    outliers: number;
    time_ms: number;
    status: 'ok' | 'err';
    error?: string;
}

function IngestTestPanel() {
    const [category, setCategory] = useState<SensorCategory>('power');
    const [city, setCity] = useState('NYC');
    const [rawPayload, setRawPayload] = useState('');
    const [useCustom, setUseCustom] = useState(false);
    const [results, setResults] = useState<IngestEntry[]>([]);
    const idRef = React.useRef(0);

    const mutation = useMutation({
        mutationFn: (payload: SensorPayload) => ingestSensorData(payload),
        onSuccess: (data, vars) => {
            const entry: IngestEntry = {
                id: ++idRef.current,
                ts: new Date().toLocaleTimeString(),
                sensor_id: data.sensor_id,
                category: vars.category,
                city: vars.city_id,
                quality: data.quality_score,
                outliers: data.outliers_detected,
                time_ms: Math.round(data.processing_time_ms),
                status: 'ok',
            };
            setResults(prev => [entry, ...prev].slice(0, 50));
            toast.success(`Accepted · quality ${(data.quality_score * 100).toFixed(0)}%`, { duration: 2000 });
        },
        onError: (err: unknown) => {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || String(err);
            const entry: IngestEntry = {
                id: ++idRef.current,
                ts: new Date().toLocaleTimeString(),
                sensor_id: '—',
                category,
                city,
                quality: 0,
                outliers: 0,
                time_ms: 0,
                status: 'err',
                error: msg,
            };
            setResults(prev => [entry, ...prev].slice(0, 50));
            toast.error(`Rejected: ${msg}`, { duration: 3000 });
        },
    });

    const handleFire = () => {
        let payload: SensorPayload;
        if (useCustom) {
            try {
                payload = JSON.parse(rawPayload) as SensorPayload;
            } catch {
                toast.error('Invalid JSON payload');
                return;
            }
        } else {
            payload = buildSamplePayload(category, city);
            setRawPayload(JSON.stringify(payload, null, 2));
        }
        mutation.mutate(payload);
    };

    const handleGenerate = () => {
        const p = buildSamplePayload(category, city);
        setRawPayload(JSON.stringify(p, null, 2));
        setUseCustom(true);
    };

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">⚡ INGEST TEST PANEL</div>
                <div className="tag tag-active">LIVE</div>
            </div>
            <div className="card-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {/* Controls */}
                <div style={{ minWidth: 240, flex: '0 0 240px' }}>
                    <div style={{ marginBottom: 12 }}>
                        <div className="metric-label" style={{ marginBottom: 4 }}>SENSOR CATEGORY</div>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value as SensorCategory)}
                            style={{
                                width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                                borderRadius: 6, padding: '6px 10px',
                                fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-primary)',
                            }}
                        >
                            {SENSOR_CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <div className="metric-label" style={{ marginBottom: 4 }}>CITY NODE</div>
                        <select
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            style={{
                                width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                                borderRadius: 6, padding: '6px 10px',
                                fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-primary)',
                            }}
                        >
                            {CITY_IDS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <input
                            type="checkbox"
                            id="use-custom"
                            checked={useCustom}
                            onChange={e => setUseCustom(e.target.checked)}
                            style={{ accentColor: 'var(--cyan)' }}
                        />
                        <label htmlFor="use-custom" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            CUSTOM PAYLOAD
                        </label>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                        <button className="btn btn-ghost btn-sm w-full" onClick={handleGenerate}>
                            GENERATE SAMPLE
                        </button>
                        <button
                            className="btn btn-primary btn-sm w-full"
                            onClick={handleFire}
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? 'SENDING...' : '▶ FIRE INGEST'}
                        </button>
                    </div>
                </div>

                {/* Payload editor */}
                <div style={{ flex: '1 1 280px', minWidth: 280 }}>
                    <div className="metric-label" style={{ marginBottom: 4 }}>PAYLOAD PREVIEW / EDITOR</div>
                    <textarea
                        value={rawPayload}
                        onChange={e => { setRawPayload(e.target.value); setUseCustom(true); }}
                        placeholder='Click "GENERATE SAMPLE" to populate...'
                        style={{
                            width: '100%', height: 210, resize: 'vertical',
                            background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
                            borderRadius: 6, padding: '10px 12px',
                            fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                            color: 'var(--text-primary)', lineHeight: 1.6,
                            outline: 'none', boxSizing: 'border-box',
                        }}
                    />
                </div>
            </div>

            {/* Results table */}
            {results.length > 0 && (
                <div style={{ margin: '0 16px 16px', overflow: 'hidden', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                                {['TIME', 'SENSOR_ID', 'CAT', 'CITY', 'QUALITY', 'OUTLIERS', 'PROC_MS', 'STATUS'].map(h => (
                                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.08em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(r => (
                                <tr key={r.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                    <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{r.ts}</td>
                                    <td style={{ padding: '6px 10px', color: 'var(--cyan)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sensor_id}</td>
                                    <td style={{ padding: '6px 10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{r.category}</td>
                                    <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{r.city}</td>
                                    <td style={{ padding: '6px 10px', color: r.quality > 0.8 ? 'var(--green)' : r.quality > 0.5 ? 'var(--warning)' : 'var(--red)' }}>
                                        {r.status === 'ok' ? `${(r.quality * 100).toFixed(0)}%` : '—'}
                                    </td>
                                    <td style={{ padding: '6px 10px', color: r.outliers > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>{r.status === 'ok' ? r.outliers : '—'}</td>
                                    <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{r.status === 'ok' ? `${r.time_ms}ms` : '—'}</td>
                                    <td style={{ padding: '6px 10px' }}>
                                        {r.status === 'ok' ? (
                                            <span className="tag tag-online" style={{ fontSize: '0.6rem' }}>ACCEPTED</span>
                                        ) : (
                                            <span className="tag tag-offline" style={{ fontSize: '0.6rem' }} title={r.error}>REJECTED</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DataIngestion() {
    const qc = useQueryClient();

    const healthQ = useQuery({
        queryKey: ['ingestion-health'],
        queryFn: fetchHealth,
        refetchInterval: 15_000,
        retry: false,
    });

    const statsQ = useQuery({
        queryKey: ['ingestion-stats'],
        queryFn: fetchIngestionStats,
        refetchInterval: 5_000,
        retry: false,
    });

    const streamQ = useQuery({
        queryKey: ['ingestion-streams'],
        queryFn: fetchStreamStatus,
        refetchInterval: 8_000,
        retry: false,
    });

    const topicsQ = useQuery({
        queryKey: ['ingestion-topics'],
        queryFn: fetchTopics,
        staleTime: 60_000,
        retry: false,
    });

    const handleRefreshAll = useCallback(() => {
        qc.invalidateQueries({ queryKey: ['ingestion-health'] });
        qc.invalidateQueries({ queryKey: ['ingestion-stats'] });
        qc.invalidateQueries({ queryKey: ['ingestion-streams'] });
    }, [qc]);

    const isHealthy = healthQ.data?.status === 'healthy';
    const stats = statsQ.data;
    const stream = streamQ.data;
    const topics = topicsQ.data;

    const validated = stats?.validator?.validated ?? 0;
    const rejected = stats?.validator?.rejected ?? 0;
    const acceptRate = stats ? stats.validator.acceptance_rate.toFixed(1) : '—';

    return (
        <div className="page-container" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                        DATA INGESTION PIPELINE
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
                        Kafka producer pool · MQTT ingestion · Schema validation · Outlier detection
                    </p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={handleRefreshAll}>
                    ↺ REFRESH
                </button>
            </div>

            {/* Health banner */}
            {healthQ.isError ? (
                <ServiceHealthBanner healthy={false} />
            ) : (
                <ServiceHealthBanner healthy={isHealthy} timestamp={healthQ.data?.timestamp} />
            )}

            {/* Stat cards */}
            <div className="grid-4-col">
                <StatCard
                    label="VALIDATED EVENTS"
                    value={statsQ.isError ? '—' : validated.toLocaleString()}
                    sub="since last restart"
                    color="var(--green)"
                />
                <StatCard
                    label="REJECTED EVENTS"
                    value={statsQ.isError ? '—' : rejected.toLocaleString()}
                    sub="schema / outlier failures"
                    color={rejected > 0 ? 'var(--warning)' : 'var(--text-primary)'}
                />
                <StatCard
                    label="ACCEPT RATE"
                    value={statsQ.isError ? '—' : `${acceptRate}%`}
                    sub="validated / (validated + rejected)"
                    color={parseFloat(acceptRate) >= 90 ? 'var(--green)' : 'var(--warning)'}
                />
                <StatCard
                    label="KAFKA PRODUCER"
                    value={streamQ.isError ? '—' : (stream?.producer?.status ?? '—').toUpperCase()}
                    sub={stream ? `consumer: ${stream.consumer?.status ?? '—'}` : 'fetching...'}
                    color={stream?.producer?.status === 'connected' ? 'var(--cyan)' : 'var(--red)'}
                />
            </div>

            {/* Streams + Topics */}
            <div className="grid-2-col">
                {/* Stream Status */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">🔗 STREAM STATUS</div>
                        {stream && (
                            <div className="tag tag-active">LIVE</div>
                        )}
                    </div>
                    <div className="card-body">
                        {streamQ.isLoading && (
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Connecting to service...
                            </div>
                        )}
                        {streamQ.isError && (
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--red)' }}>
                                ⚠ Could not reach data-ingestion-service. Is it running?
                            </div>
                        )}
                        {stream && (
                            <>
                                {[
                                    {
                                        label: 'KAFKA PRODUCER',
                                        ok: stream.producer?.status === 'connected',
                                        value: stream.producer?.status?.toUpperCase() ?? '—',
                                    },
                                    {
                                        label: 'KAFKA CONSUMER',
                                        ok: stream.consumer?.status === 'running',
                                        value: stream.consumer?.status?.toUpperCase() ?? '—',
                                    },
                                ].map(row => (
                                    <div key={row.label} className="k8s-row" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <StatusDot ok={row.ok} />
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.label}</span>
                                        </div>
                                        <span style={{
                                            fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                                            color: row.ok ? 'var(--green)' : 'var(--red)',
                                            fontWeight: 600,
                                        }}>{row.value}</span>
                                    </div>
                                ))}
                                <div style={{ marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                    Updated: {new Date(stream.timestamp * 1000).toLocaleTimeString()}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Active Topics */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">📡 KAFKA TOPICS</div>
                    </div>
                    <div className="card-body">
                        {topicsQ.isLoading && (
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Loading topics...
                            </div>
                        )}
                        {topicsQ.isError && (
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--red)' }}>
                                ⚠ Could not fetch topics.
                            </div>
                        )}
                        {topics && (
                            <>
                                <TopicPill label="RAW" value={topics.raw} />
                                <TopicPill label="VALIDATED" value={topics.validated} />
                                <TopicPill label="ALERTS" value={topics.alerts} />
                                <TopicPill label="DLQ" value={topics.dlq} />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Ingest test panel */}
            <IngestTestPanel />

            {/* Schema reference */}
            <div className="card">
                <div className="card-header">
                    <div className="card-title">📋 SENSOR PAYLOAD SCHEMA</div>
                    <button className="btn btn-ghost btn-sm">VIEW DOCS</button>
                </div>
                <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {[
                        { field: 'sensor_id', type: 'string', note: 'Alphanumeric, 3–64 chars' },
                        { field: 'source_id', type: 'string', note: 'Origin system identifier' },
                        { field: 'category', type: 'enum', note: 'power | water | traffic | environmental | structural | cyber | social' },
                        { field: 'city_id', type: 'string', note: 'ISO 3166 city code (NYC, LDN…)' },
                        { field: 'sector_id', type: 'string', note: 'Grid sector within city' },
                        { field: 'timestamp_ms', type: 'int', note: 'Unix epoch ms — must be within 5 min' },
                        { field: 'values', type: 'Dict[str, float]', note: 'Named metric readings (non-empty)' },
                        { field: 'unit_map', type: 'Dict[str, str]', note: 'Optional — unit labels per key' },
                        { field: 'metadata', type: 'object', note: 'Optional — arbitrary key/value tags' },
                    ].map(row => (
                        <div key={row.field} style={{
                            flex: '1 1 260px', padding: '8px 12px',
                            background: 'var(--bg-elevated)', borderRadius: 6,
                            border: '1px solid var(--border-subtle)',
                        }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 2 }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 600 }}>{row.field}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: 3 }}>{row.type}</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{row.note}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
