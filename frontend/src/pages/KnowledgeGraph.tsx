import React, { useEffect, useRef, useState } from 'react';

// ==============================
// MOCK DATA
// ==============================
const SECTOR_SCORES = [
    { label: 'ENERGY', angle: 90, value: 0.68 },
    { label: 'TRANSPORT', angle: 180, value: 0.82 },
    { label: 'WATER', angle: 0, value: 0.32 },
    { label: 'CYBER', angle: 270, value: 0.91 },
];

const GRAPH_NODES = [
    { id: 'power-plant-a', label: 'Power Plant A', x: 30, y: 22, status: 'critical', size: 12 },
    { id: 'azure-dc', label: 'Azure Core DC', x: 40, y: 45, status: 'warning', size: 12 },
    { id: 'gen-hospital', label: 'General Hospital', x: 62, y: 30, status: 'ok', size: 10 },
    { id: 'water-filt', label: 'Water Filtration (Down)', x: 52, y: 68, status: 'down', size: 12 },
    { id: 'edison-bridge', label: 'Edison Bridge', x: 70, y: 50, status: 'ok', size: 10 },
];

const GRAPH_EDGES = [
    { from: 'power-plant-a', to: 'azure-dc', type: 'cascade' },
    { from: 'azure-dc', to: 'water-filt', type: 'cascade' },
    { from: 'power-plant-a', to: 'gen-hospital', type: 'normal' },
    { from: 'gen-hospital', to: 'edison-bridge', type: 'normal' },
];

const RISK_FEED = [
    { time: '14:22:11', message: 'Shadow Risk Detected: Cascading failure likelihood in Sector 7 increased by 42%.', level: 'critical' },
    { time: '14:21:55', message: 'Node "Data Center Delta" re-routed via backup fiber trunk.', level: 'info' },
    { time: '14:21:33', message: 'Substation A14 load balancing engaged — 87% capacity normalized.', level: 'warning' },
];

// ==============================
// RADAR CHART
// ==============================
function RadarChart({ scores }: { scores: typeof SECTOR_SCORES }) {
    const cx = 80, cy = 80, r = 55;

    const polarToXY = (angle: number, radius: number) => ({
        x: cx + radius * Math.cos((angle - 90) * Math.PI / 180),
        y: cy + radius * Math.sin((angle - 90) * Math.PI / 180),
    });

    const points = scores.map(s => polarToXY(s.angle, s.value * r));
    const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <svg width="160" height="160" viewBox="0 0 160 160">
            {/* Grid circles */}
            {[0.25, 0.5, 0.75, 1].map(f => (
                <circle key={f} cx={cx} cy={cy} r={r * f} fill="none"
                    stroke="rgba(0,229,255,0.1)" strokeWidth="0.5" />
            ))}
            {/* Axes */}
            {scores.map((s, i) => {
                const p = polarToXY(s.angle, r);
                return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(0,229,255,0.15)" strokeWidth="0.5" />;
            })}
            {/* Data polygon */}
            <polygon points={polyPoints} fill="rgba(0,229,255,0.15)" stroke="var(--cyan)" strokeWidth="1.5" />
            {/* Data points */}
            {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--cyan)" />
            ))}
            {/* Labels */}
            {scores.map((s, i) => {
                const lp = polarToXY(s.angle, r + 14);
                return (
                    <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
                        fill="rgba(138,164,192,0.9)" fontSize="7" fontFamily="JetBrains Mono, monospace">
                        {s.label}
                    </text>
                );
            })}
        </svg>
    );
}

// ==============================
// FORCE GRAPH (SVG-based static)
// ==============================
function KnowledgeGraphCanvas() {
    const nodeMap: Record<string, typeof GRAPH_NODES[0]> = {};
    GRAPH_NODES.forEach(n => { nodeMap[n.id] = n; });

    const statusColor = (s: string) => {
        if (s === 'critical') return 'var(--red)';
        if (s === 'down') return 'var(--red)';
        if (s === 'warning') return 'var(--orange)';
        return 'rgba(0,229,255,0.6)';
    };

    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ background: '#030b12' }}>
            {/* Edges */}
            {GRAPH_EDGES.map((edge, i) => {
                const from = nodeMap[edge.from], to = nodeMap[edge.to];
                if (!from || !to) return null;
                return (
                    <line key={i}
                        x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                        stroke={edge.type === 'cascade' ? 'rgba(255,61,90,0.5)' : 'rgba(0,229,255,0.2)'}
                        strokeWidth={edge.type === 'cascade' ? '0.5' : '0.3'}
                        strokeDasharray={edge.type === 'cascade' ? '2,1' : '0'}
                    />
                );
            })}
            {/* Nodes */}
            {GRAPH_NODES.map(node => (
                <g key={node.id}>
                    <circle cx={node.x} cy={node.y} r={node.size / 2}
                        fill="var(--bg-surface-2)" stroke={statusColor(node.status)} strokeWidth="1" />
                    {node.status === 'down' && (
                        <circle cx={node.x} cy={node.y} r={node.size / 2 + 3}
                            fill="none" stroke={statusColor(node.status)} strokeWidth="0.5" opacity="0.4" />
                    )}
                    <text x={node.x} y={node.y - node.size / 2 - 2}
                        textAnchor="middle" fill="rgba(138,164,192,0.8)" fontSize="3.5"
                        fontFamily="JetBrains Mono, monospace">
                        {node.label}
                    </text>
                </g>
            ))}
        </svg>
    );
}

// ==============================
// MAIN PAGE
// ==============================
export default function KnowledgeGraph() {
    const [resilience, setResilience] = useState(84.2);

    useEffect(() => {
        const interval = setInterval(() => {
            setResilience(v => Math.max(70, Math.min(95, v + (Math.random() - 0.5) * 0.5)));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            {/* LEFT SIDEBAR */}
            <div style={{
                width: 220, flexShrink: 0, background: 'var(--bg-surface)',
                borderRight: '1px solid var(--border-subtle)', padding: '20px 16px',
                display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto',
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6ee7f7, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🌀</div>
                    <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)' }}>STRATUM Protocol</div>
                    </div>
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--cyan)', letterSpacing: '0.1em', marginBottom: 4 }}>URBAN NERVOUS SYSTEM</div>
                <button className="layer-btn active" style={{ justifyContent: 'flex-start', width: '100%' }}>
                    <span>🕸</span> Urban Knowledge Graph
                </button>
                <button className="layer-btn" style={{ justifyContent: 'flex-start', width: '100%' }}>
                    <span>〰</span> Risk Propagation
                </button>
                <button className="layer-btn" style={{ justifyContent: 'flex-start', width: '100%' }}>
                    <span>⊞</span> Monte Carlo Engine
                </button>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 16, marginBottom: 8 }}>
                    SCENARIO SIMULATORS
                </div>
                <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'space-between' }}>
                    SIMULATE CYBER ATTACK <span>⚡</span>
                </button>
                <button style={{
                    width: '100%', padding: '8px 14px', borderRadius: 6,
                    background: 'rgba(0,229,255,0.1)', border: '1px solid var(--border-default)',
                    color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                    fontWeight: 600, letterSpacing: '0.06em', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    SIMULATE FLASH FLOOD <span>💧</span>
                </button>

                {/* Bottom stats */}
                <div style={{ marginTop: 'auto', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Graph Nodes</span>
                        <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>12,482</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', marginBottom: 8 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Edge Weights</span>
                        <div className="tag tag-active" style={{ padding: '1px 6px' }}>Active</div>
                    </div>
                    <div className="progress-track" style={{ height: 2 }}>
                        <div className="progress-fill" style={{ width: '72%' }} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                        Processing real-time dependency streams from urban telemetry.
                    </div>
                </div>
            </div>

            {/* CENTER — GRAPH */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Graph header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
                        Urban Knowledge Graph
                    </h2>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Cascading Path: </span>
                        <span style={{ color: 'var(--red)', fontWeight: 700 }}>Grid Failure → Substation A14</span>
                    </div>
                </div>

                {/* Graph canvas */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <KnowledgeGraphCanvas />
                </div>

                {/* Risk Propagation Feed */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="card-title">
                            <span>🔄</span> Risk Propagation Feed
                        </div>
                        <div className="tag tag-active">LIVE ANALYSIS</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {RISK_FEED.map((entry, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <div style={{
                                    width: 3, flexShrink: 0, alignSelf: 'stretch', borderRadius: 2,
                                    background: entry.level === 'critical' ? 'var(--red)' : entry.level === 'warning' ? 'var(--orange)' : 'var(--cyan)',
                                }} />
                                <div>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--cyan)', marginRight: 8 }}>{entry.time}</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{entry.message}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div style={{
                width: 260, flexShrink: 0, borderLeft: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)', padding: '20px 16px', overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: 16,
            }}>
                {/* Sector Scoring Radar */}
                <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>
                        ⦿ Sector Scoring
                    </div>
                    <div className="flex justify-center">
                        <RadarChart scores={SECTOR_SCORES} />
                    </div>
                </div>

                {/* Sector Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                        { label: 'Energy Resilience', value: 68, color: 'cyan' },
                        { label: 'Water Security', value: 32, color: 'critical' },
                        { label: 'Cyber Hardening', value: 91, color: 'green' },
                    ].map(item => (
                        <div key={item.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: item.value < 40 ? 'var(--red)' : 'var(--text-secondary)' }}>{item.value}%</span>
                            </div>
                            <div className="progress-track">
                                <div
                                    className={`progress-fill ${item.value < 40 ? 'critical' : item.color}`}
                                    style={{ width: `${item.value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Critical Dependencies */}
                <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase' }}>
                        Critical Dependencies
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div className="dep-card">
                            <div className="dep-icon warning">⚠</div>
                            <div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Main Grid Substation</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Controls 85% of downstream filtration logic.</div>
                            </div>
                        </div>
                        <div className="dep-card">
                            <div className="dep-icon info">〰</div>
                            <div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Regional Fiber Node 9</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Primary comms for all emergency services.</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Global Resilience */}
                <div style={{
                    padding: '16px', background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)', borderRadius: 10, textAlign: 'center',
                }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6 }}>
                        GLOBAL RESILIENCE
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--cyan)' }}>
                        {resilience.toFixed(1)}%
                    </div>
                    <div className="progress-track" style={{ marginTop: 8 }}>
                        <div className="progress-fill" style={{ width: `${resilience}%` }} />
                    </div>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    ↓ EXPORT RISK REPORT
                </button>
            </div>
        </div>
    );
}
