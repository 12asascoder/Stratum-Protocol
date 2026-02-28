import React, { useState, useEffect, useRef, useCallback } from 'react';

// ==============================
// MOCK DATA
// ==============================
const INITIAL_LOGS = [
    { time: '14:22:01', level: 'INFO', message: 'Cluster node ', highlight: 'hpc-worker-04', suffix: ' authenticated via mTLS.' },
    { time: '14:22:05', level: 'INFO', message: 'ROCm 6.1 initialization complete on 4x MI300X.' },
    { time: '14:22:12', level: 'WARN', message: 'Memory pressure detected on ', highlight: 'inference-svc-pod-21', suffix: '.' },
    { time: '14:22:12', level: 'KEDA', message: 'Triggering scale up for HPA/Inference.' },
    { time: '14:22:14', level: 'INFO', message: 'Federated weight sync completed for ', highlight: 'BERLIN_NODE_09', suffix: '.' },
    { time: '14:22:18', level: 'LOG', message: 'Appending differential privacy noise to local gradient updates.' },
    { time: '14:22:25', level: 'INFO', message: 'Scheduling job ', highlight: 'GPT-Large-Retrain', suffix: ' to partition B.' },
    { time: '14:22:30', level: 'ERR', message: 'Unauthorized access attempt on port 8080 blocked by Istio.' },
    { time: '14:22:31', level: 'LOG', message: 'Heartbeat acknowledged from ', highlight: 'TOKYO_CENTRAL', suffix: '.' },
    { time: '14:22:45', level: 'INFO', message: 'GPU Utilization steady at 94%.' },
];

const NEW_LOG_POOL = [
    { level: 'INFO', message: 'Cascade simulation round #', highlight: '4,821', suffix: ' complete.' },
    { level: 'KEDA', message: 'Scaling inference pods from 8 → 12.' },
    { level: 'LOG', message: 'Federated model delta: 0.0003 from baseline.' },
    { level: 'WARN', message: 'High thermal load on ', highlight: 'GPU-node-07', suffix: ' — 89.2°C.' },
    { level: 'INFO', message: 'Knowledge graph updated: 147 new edges in NYC sector.' },
    { level: 'INFO', message: 'Decision #830 queued for governance audit.' },
];

const FEDERATED_NODES = [
    { id: 'NYC_CENTRAL', x: 22, y: 38, label: 'New York' },
    { id: 'BERLIN_NODE_09', x: 52, y: 25, label: 'Berlin' },
    { id: 'TOKYO_CENTRAL', x: 80, y: 40, label: 'Tokyo' },
    { id: 'DUBAI_CORE', x: 61, y: 48, label: 'Dubai' },
    { id: 'SAO_PAULO_01', x: 28, y: 68, label: 'São Paulo' },
    { id: 'LAGOS_NODE', x: 50, y: 57, label: 'Lagos' },
    { id: 'SYDNEY_EDGE', x: 84, y: 70, label: 'Sydney' },
    { id: 'MOSCOW_CLUSTER', x: 62, y: 22, label: 'Moscow' },
    { id: 'MUMBAI_DC', x: 68, y: 50, label: 'Mumbai' },
    { id: 'LONDON_PRIME', x: 47, y: 24, label: 'London' },
    { id: 'SINGAPORE_HUB', x: 78, y: 56, label: 'Singapore' },
    { id: 'TORONTO_WEST', x: 18, y: 32, label: 'Toronto' },
];

const GPU_PARTITIONS = [
    { label: 'PARTITION A (INFERENCE)', value: 88, color: 'cyan' },
    { label: 'PARTITION B (TRAINING)', value: 94, color: 'warning' },
    { label: 'PARTITION C (PRE-PROCESSING)', value: 12, color: 'cyan' },
];

// ==============================
// SUB-COMPONENTS
// ==============================

function MetricCard({
    label, value, unit, delta, deltaNeg = true, badge, bars = 8, filledBars,
}: {
    label: string; value: string; unit?: string; delta?: string; deltaNeg?: boolean;
    badge?: string; bars?: number; filledBars?: number;
}) {
    const filled = filledBars ?? Math.round((parseFloat(value) / 100) * bars);
    return (
        <div className="metric-card">
            <div className="metric-label">{label}</div>
            <div className="flex items-end gap-2">
                <div className="metric-value">{value}</div>
                {unit && <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginBottom: 6 }}>{unit}</span>}
                {delta && (
                    <span className={`metric-delta ${deltaNeg ? 'negative' : 'positive'}`} style={{ marginBottom: 8 }}>
                        {deltaNeg ? '▼' : '▲'}{delta}
                    </span>
                )}
            </div>
            {badge && (
                <div className="tag tag-active" style={{ marginBottom: 8, display: 'inline-flex' }}>{badge}</div>
            )}
            <div className="metric-bar-row">
                {Array.from({ length: bars }).map((_, i) => (
                    <div
                        key={i}
                        className={`metric-bar-seg ${i < filled ? (filled > bars * 0.85 ? 'warning' : 'filled') : ''}`}
                    />
                ))}
            </div>
        </div>
    );
}

function WaveformChart() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>();
    const offset = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            // Grid lines
            ctx.strokeStyle = 'rgba(0,229,255,0.06)';
            ctx.lineWidth = 1;
            for (let x = 0; x < w; x += 40) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
            }

            // Wave 1
            ctx.strokeStyle = 'rgba(0,229,255,0.7)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let x = 0; x <= w; x++) {
                const y = h / 2 + Math.sin((x + offset.current) * 0.04) * (h * 0.3)
                    + Math.sin((x + offset.current) * 0.015) * (h * 0.12);
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Wave 2 (dashed)
            ctx.strokeStyle = 'rgba(0,229,255,0.25)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            for (let x = 0; x <= w; x++) {
                const y = h / 2 + Math.sin((x + offset.current * 0.8) * 0.05 + 1) * (h * 0.2);
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            offset.current += 1.5;
            animRef.current = requestAnimationFrame(draw);
        };

        draw();
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, []);

    return (
        <div style={{ width: '100%', height: '70px', position: 'relative' }}>
            <div style={{
                position: 'absolute', top: 4, left: 8,
                fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                color: 'var(--cyan)', letterSpacing: '0.08em',
            }}>
                INTER-GPU LATENCY: 1.2MS
            </div>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
}

function ProgressBar({ label, value, color = 'cyan' }: { label: string; value: number; color?: string }) {
    return (
        <div className="progress-bar-container" style={{ marginBottom: 6 }}>
            <div className="progress-label">{label}</div>
            <div className="progress-track">
                <div
                    className={`progress-fill ${color}`}
                    style={{ width: `${value}%` }}
                />
            </div>
            <div className="progress-value">{value}%</div>
        </div>
    );
}

interface LogEntry { time: string; level: string; message: string; highlight?: string; suffix?: string; }

function SystemLogStream({ logs }: { logs: LogEntry[] }) {
    const bodyRef = useRef<HTMLDivElement>(null);
    const [cmd, setCmd] = useState('');

    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="log-stream" style={{ height: '100%' }}>
            <div className="log-stream-header">
                <div className="log-stream-dots">
                    <div className="log-dot log-dot-red" />
                    <div className="log-dot log-dot-yellow" />
                    <div className="log-dot log-dot-green" />
                </div>
                <div className="log-stream-title">SYSTEM_LOG_STREAM</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>⤢</div>
            </div>
            <div className="log-body" ref={bodyRef} style={{ maxHeight: 280, overflowY: 'auto' }}>
                {logs.map((log, i) => (
                    <div key={i} className="log-entry">
                        <span className="log-time">[{log.time}]</span>
                        <span className={`log-level-${log.level}`}>{log.level}:</span>
                        <span className="log-message">
                            {log.message}
                            {log.highlight && <span className="log-highlight">{log.highlight}</span>}
                            {log.suffix && <span>{log.suffix}</span>}
                        </span>
                    </div>
                ))}
            </div>
            <div className="log-input-row">
                <span className="log-prompt">$</span>
                <input
                    className="log-input"
                    value={cmd}
                    onChange={e => setCmd(e.target.value)}
                    placeholder="Execute command..."
                />
            </div>
        </div>
    );
}

function FederatedNetworkMap() {
    return (
        <div className="fed-map" style={{ height: 220, background: '#030b12', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Simple world map outline approximation */}
                <rect width="100" height="100" fill="#030b12" />
                {/* Connection lines between nodes */}
                {FEDERATED_NODES.map((from, i) =>
                    FEDERATED_NODES.slice(i + 1, i + 3).map((to, j) => (
                        <line
                            key={`${i}-${j}`}
                            x1={from.x} y1={from.y}
                            x2={to.x} y2={to.y}
                            stroke="rgba(0,229,255,0.1)"
                            strokeWidth="0.3"
                            strokeDasharray="1,2"
                        />
                    ))
                )}
            </svg>
            {FEDERATED_NODES.map(node => (
                <div
                    key={node.id}
                    className="fed-node"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    title={node.label}
                />
            ))}
        </div>
    );
}

// ==============================
// MAIN PAGE
// ==============================
export default function EngineRoom() {
    const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
    const [gpuUtil, setGpuUtil] = useState(94.1);
    const [rocmBw, setRocmBw] = useState(4.2);
    const [k8sPods, setK8sPods] = useState(1248);
    const [clusterLoad, setClusterLoad] = useState(42.8);
    const logPoolIdx = useRef(0);

    // Simulate live updates
    useEffect(() => {
        const interval = setInterval(() => {
            setGpuUtil(v => Math.max(85, Math.min(99, v + (Math.random() - 0.5) * 1.5)));
            setRocmBw(v => Math.max(3.5, Math.min(5.0, v + (Math.random() - 0.5) * 0.3)));
            setClusterLoad(v => Math.max(35, Math.min(60, v + (Math.random() - 0.5) * 1)));

            // Add new log entry
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            const newLog = { ...NEW_LOG_POOL[logPoolIdx.current % NEW_LOG_POOL.length], time: timeStr };
            logPoolIdx.current++;
            setLogs(prev => [...prev.slice(-20), newLog]);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="page-container" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* TOP METRIC CARDS */}
            <div className="grid-4-col">
                <MetricCard
                    label="Stitch Compute Utilization"
                    value={`${clusterLoad.toFixed(1)}%`}
                    delta="2.1%"
                    deltaNeg
                    bars={10}
                    filledBars={Math.round((clusterLoad / 100) * 10)}
                />
                <MetricCard
                    label="Instinct MI300X Util"
                    value={`${gpuUtil.toFixed(1)}%`}
                    delta="12.4%"
                    deltaNeg
                    bars={8}
                    filledBars={7}
                />
                <MetricCard
                    label="ROCm Memory BW"
                    value={`${rocmBw.toFixed(1)}`}
                    unit="TB/s ↑PEAK"
                    bars={8}
                    filledBars={6}
                />
                <MetricCard
                    label="Active K8s Pods"
                    value={k8sPods.toLocaleString()}
                    badge="KEDA ACTIVE"
                    bars={0}
                />
            </div>

            {/* GPU PERFORMANCE + K8S HEALTH */}
            <div className="grid-2-col">
                {/* GPU Performance Matrix */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">📈 GPU Performance Matrix (ROCm Stack)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div className="tag tag-active">REALTIME</div>
                            <button className="btn btn-ghost btn-sm">EXPORT</button>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="metric-label" style={{ marginBottom: 12 }}>COMPUTE LOAD BY PARTITION</div>
                        {GPU_PARTITIONS.map(p => (
                            <ProgressBar key={p.label} label={p.label} value={p.value} color={p.value > 80 ? 'warning' : 'cyan'} />
                        ))}
                        <div style={{ marginTop: 16 }}>
                            <WaveformChart />
                        </div>
                    </div>
                </div>

                {/* K8s Cluster Health */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">⚙ K8s Cluster Health</div>
                    </div>
                    <div className="card-body">
                        {[
                            { icon: '⊟', label: 'NODE GROUPS', value: '08 / 08 Active', status: 'online' },
                            { icon: '✓', label: 'MASTER API', value: '', tag: 'ONLINE', status: 'online' },
                            { icon: '↑', label: 'AUTO-SCALER', value: '', tag: 'KEDA: IDLE', status: 'idle' },
                        ].map(row => (
                            <div key={row.label} className="k8s-row">
                                <div className="flex items-center gap-3">
                                    <div className="k8s-icon">{row.icon}</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                                        {row.label}
                                    </div>
                                </div>
                                {row.value && (
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                        {row.value}
                                    </div>
                                )}
                                {row.tag && (
                                    <div className={`tag ${row.status === 'online' ? 'tag-online' : 'tag-idle'}`}>{row.tag}</div>
                                )}
                            </div>
                        ))}
                        {/* K8s health summary */}
                        <div style={{ marginTop: 16, padding: '12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>HEALTHY</span>
                                <span style={{ color: 'var(--green)' }}>1,240</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', marginTop: 4 }}>
                                <span style={{ color: 'var(--text-muted)' }}>SCALING</span>
                                <span style={{ color: 'var(--cyan)' }}>+8</span>
                            </div>
                            <div style={{ marginTop: 8 }}>
                                <div className="progress-track">
                                    <div className="progress-fill" style={{ width: `${(1240 / 1248) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FEDERATED NETWORK + LOG STREAM */}
            <div className="grid-2-col">
                {/* Federated Network Status */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">🌐 Federated Network Status</div>
                        <div className="tag tag-active">SYNC: ACTIVE (12 SITES)</div>
                    </div>
                    <div className="card-body">
                        <FederatedNetworkMap />
                    </div>
                </div>

                {/* System Log Stream */}
                <SystemLogStream logs={logs} />
            </div>

            {/* BOTTOM STATUS BAR */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 24,
                padding: '10px 20px',
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 8, flexShrink: 0,
            }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    🌡 AVG CORE TEMP: <span style={{ color: 'var(--cyan)' }}>62.4°C</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    ⚡ POWER DRAW: <span style={{ color: 'var(--cyan)' }}>2.4 kW</span>
                </div>
                <div className="flex-1" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>CLUSTER CAPACITY: 75%</div>
                    <div className="progress-track" style={{ width: 120 }}>
                        <div className="progress-fill warning" style={{ width: '75%' }} />
                    </div>
                </div>
                <button className="btn btn-danger btn-sm">EMERGENCY SHUTDOWN</button>
            </div>
        </div>
    );
}
