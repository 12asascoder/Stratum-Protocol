import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

const ACTIVE_SCENARIOS = [
    {
        id: 'climate-alpha',
        title: 'CLIMATE EVENT ALPHA',
        description: 'Flood surge projected in Lower District. Critical infrastructure at 15% safety margin.',
        impact: 'HIGH',
        progress: null,
        status: 'deploy',
        urgent: true,
        type: 'critical',
    },
    {
        id: 'grid-stress',
        title: 'GRID STRESS TEST',
        description: 'Simulated 40% load increase on East-Side Substations.',
        impact: null,
        progress: 64,
        status: 'IN PROGRESS',
        urgent: false,
        type: 'progress',
    },
    {
        id: 'transit-recal',
        title: 'TRANSIT RECALIBRATION',
        description: 'Optimization of autonomous shuttle routes.',
        impact: null,
        progress: null,
        status: 'QUEUED',
        urgent: false,
        type: 'queued',
    },
];

const SOVEREIGN_LOGS = [
    'STRT-PRTCL::RE-SYNCING_CORES...',
    'DATA_STREAM_STABLE: 1,418/8',
    'AUTH_KEY: 0x82...F92A',
];

function useMapbox(containerRef: React.RefObject<HTMLDivElement>, token: string) {
    const mapRef = useRef<mapboxgl.Map | null>(null);

    useEffect(() => {
        if (!containerRef.current || !token) return;

        mapboxgl.accessToken = token;
        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-74.006, 40.7128], // New York
            zoom: 11,
            attributionControl: false,
        });

        map.on('load', () => {
            // Overlay: risk heatmap layer (mock data)
            map.addSource('risk-heatmap', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [
                        { type: 'Feature', geometry: { type: 'Point', coordinates: [-74.006, 40.7128] }, properties: { intensity: 0.8 } },
                        { type: 'Feature', geometry: { type: 'Point', coordinates: [-73.98, 40.73] }, properties: { intensity: 0.6 } },
                        { type: 'Feature', geometry: { type: 'Point', coordinates: [-74.02, 40.70] }, properties: { intensity: 0.95 } },
                    ],
                },
            });

            map.addLayer({
                id: 'risk-heat',
                type: 'heatmap',
                source: 'risk-heatmap',
                paint: {
                    'heatmap-color': [
                        'interpolate', ['linear'], ['heatmap-density'],
                        0, 'rgba(0,229,255,0)', 0.4, 'rgba(0,229,255,0.3)',
                        0.7, 'rgba(255,107,53,0.5)', 1, 'rgba(255,61,90,0.7)',
                    ],
                    'heatmap-radius': 60,
                    'heatmap-opacity': 0.5,
                },
            });
        });

        mapRef.current = map;
        return () => map.remove();
    }, [token]);

    return mapRef;
}

function FallbackMap() {
    return (
        <div style={{
            width: '100%', height: '100%',
            background: 'radial-gradient(ellipse at center, #0a1e3a 0%, #030b12 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Fake city grid */}
            <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.15 }}>
                {Array.from({ length: 20 }).map((_, i) => (
                    <React.Fragment key={i}>
                        <line x1={i * 60} y1={0} x2={i * 60} y2="100%" stroke="#00e5ff" strokeWidth="0.5" />
                        <line x1={0} y1={i * 60} x2="100%" y2={i * 60} stroke="#00e5ff" strokeWidth="0.5" />
                    </React.Fragment>
                ))}
            </svg>
            <div style={{
                fontFamily: 'var(--font-mono)', textAlign: 'center',
                color: 'var(--text-muted)', fontSize: '0.85rem',
            }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🗺</div>
                <div>New York</div>
                <div style={{ fontSize: '0.65rem', marginTop: 4 }}>Add VITE_MAPBOX_ACCESS_TOKEN to enable live map</div>
            </div>
            {/* Mock overlaid data points */}
            {[
                { x: '35%', y: '40%' }, { x: '55%', y: '35%' },
                { x: '45%', y: '55%' }, { x: '65%', y: '50%' },
            ].map((pos, i) => (
                <div key={i} style={{
                    position: 'absolute', left: pos.x, top: pos.y,
                    width: 8, height: 8, borderRadius: '50%',
                    background: i === 0 ? 'var(--red)' : 'var(--cyan)',
                    boxShadow: `0 0 12px ${i === 0 ? 'var(--red)' : 'var(--cyan)'}`,
                    transform: 'translate(-50%, -50%)',
                }} />
            ))}
        </div>
    );
}

export default function SovereignIntelligence() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useMapbox(mapContainerRef, MAPBOX_TOKEN);
    const [energyDemand, setEnergyDemand] = useState(88.4);
    const [popAtRisk] = useState('1.2M');
    const [infraIntegrity, setInfraIntegrity] = useState(94.2);
    const [activeLayer, setActiveLayer] = useState('Power');
    const [timelinePos, setTimelinePos] = useState(50);
    const [simTime] = useState('T + 04:22:15');

    useEffect(() => {
        const interval = setInterval(() => {
            setEnergyDemand(v => Math.max(80, Math.min(95, v + (Math.random() - 0.5) * 0.3)));
            setInfraIntegrity(v => Math.max(90, Math.min(97, v + (Math.random() - 0.5) * 0.2)));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Main content area */}
            <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
                {/* LEFT PANEL — Urban Pulse Stats */}
                <div style={{
                    width: 240, flexShrink: 0, background: 'rgba(5,13,20,0.92)',
                    backdropFilter: 'blur(12px)', zIndex: 10,
                    borderRight: '1px solid var(--border-subtle)',
                    padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16,
                    overflowY: 'auto',
                }}>
                    {/* Alert banner */}
                    <div className="alert-banner warning">
                        <span>●</span> NODE FAILURE WARNING: SECTOR 7G
                    </div>

                    {/* Title */}
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--cyan)', letterSpacing: '0.1em' }}>
                        URBAN PULSE STATS
                    </div>

                    {/* Population at Risk */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Population at Risk</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{popAtRisk}</div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--red)' }}>+0.4% from last hour</div>
                        <div className="progress-track" style={{ marginTop: 6 }}>
                            <div className="progress-fill critical" style={{ width: '68%' }} />
                        </div>
                    </div>

                    {/* Infrastructure Integrity */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Infrastructure Integrity</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{infraIntegrity.toFixed(1)}%</div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>Nominal Operating Range</div>
                        <div className="progress-track" style={{ marginTop: 6 }}>
                            <div className="progress-fill" style={{ width: `${infraIntegrity}%` }} />
                        </div>
                    </div>

                    {/* Energy Demand */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Energy Demand</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{energyDemand.toFixed(1)}%</div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--yellow)' }}>High Load — Balancing Active</div>
                        <div className="progress-track" style={{ marginTop: 6 }}>
                            <div className="progress-fill warning" style={{ width: `${energyDemand}%` }} />
                        </div>
                    </div>

                    {/* Layer Controls */}
                    <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 10 }}>
                            LAYER CONTROLS
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            {[
                                { name: 'Power', icon: '⚡' },
                                { name: 'Water', icon: '💧' },
                                { name: 'Transit', icon: '🚇' },
                                { name: 'Comms', icon: '📡' },
                            ].map(layer => (
                                <button
                                    key={layer.name}
                                    className={`layer-btn ${activeLayer === layer.name ? 'active' : ''}`}
                                    onClick={() => setActiveLayer(layer.name)}
                                    style={{ fontSize: '0.68rem' }}
                                >
                                    <span>{layer.icon}</span> {layer.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Global Diagnostics */}
                    <div style={{ marginTop: 'auto' }}>
                        <button className="diagnostics-btn" style={{ width: '100%', justifyContent: 'center' }}>
                            <span>⚙</span> RUN GLOBAL DIAGNOSTICS
                        </button>
                    </div>
                </div>

                {/* MAP */}
                <div style={{ flex: 1, position: 'relative' }}>
                    {MAPBOX_TOKEN ? (
                        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <FallbackMap />
                    )}

                    {/* Map controls overlay */}
                    <div style={{
                        position: 'absolute', right: 16, top: 16, zIndex: 10,
                        display: 'flex', flexDirection: 'column', gap: 6,
                    }}>
                        {['+', '−', '⊙'].map(icon => (
                            <button key={icon} style={{
                                width: 32, height: 32, borderRadius: 4,
                                background: 'rgba(10,22,40,0.9)', border: '1px solid var(--border-default)',
                                color: 'var(--text-primary)', fontSize: '1rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>{icon}</button>
                        ))}
                    </div>
                </div>

                {/* RIGHT PANEL — Active Scenarios */}
                <div style={{
                    width: 280, flexShrink: 0, background: 'rgba(5,13,20,0.92)',
                    backdropFilter: 'blur(12px)', zIndex: 10,
                    borderLeft: '1px solid var(--border-subtle)',
                    padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12,
                    overflowY: 'auto',
                }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                        ACTIVE SCENARIOS
                    </div>

                    {ACTIVE_SCENARIOS.map(sc => (
                        <div
                            key={sc.id}
                            className={`scenario-card ${sc.type === 'critical' ? 'active-scenario' : sc.type === 'progress' ? 'in-progress' : ''}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="scenario-title">
                                    {sc.title}
                                </div>
                                {sc.urgent && <span style={{ color: 'var(--red)', fontSize: '1.1rem' }}>!</span>}
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '6px 0' }}>
                                {sc.description}
                            </div>
                            {sc.impact && (
                                <div className="flex items-center justify-between mt-2">
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                                        IMPACT SCALE: <span style={{ color: 'var(--red)', fontWeight: 700 }}>HIGH</span>
                                    </div>
                                    <button className="btn btn-danger btn-sm">DEPLOY</button>
                                </div>
                            )}
                            {sc.progress !== null && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--orange)' }}>STATUS: IN PROGRESS</div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--orange)' }}>{sc.progress}%</div>
                                    </div>
                                    <div className="progress-track">
                                        <div className="progress-fill warning" style={{ width: `${sc.progress}%` }} />
                                    </div>
                                </div>
                            )}
                            {sc.type === 'queued' && (
                                <div className="flex items-center justify-between">
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>STATUS: QUEUED</div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>🔒</span>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Sovereign Link Status */}
                    <div style={{ marginTop: 8 }}>
                        <div className="flex items-center justify-between mb-2">
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>Sovereign Link Status</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--green)', fontWeight: 700 }}>ENCRYPTED</div>
                        </div>
                        <div className="sovereign-terminal">
                            {SOVEREIGN_LOGS.map((line, i) => (
                                <div key={i} className="sovereign-terminal-line">{line}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* SIMULATION TIMELINE */}
            <div className="timeline-bar">
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'var(--bg-elevated)', padding: '4px 10px',
                    borderRadius: 4, border: '1px solid var(--border-subtle)',
                }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>SIMULATION MODE</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--cyan)', minWidth: 90 }}>
                    {simTime}
                </div>

                {/* Timeline marks */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                    <div className="timeline-label">-24H</div>
                    <div className="timeline-label" style={{ color: 'var(--orange)', fontSize: '0.5rem' }}>—— 24H HISTORY ——</div>
                    <div className="timeline-track" style={{ flex: 1 }}>
                        <div className="timeline-track-current" style={{ width: `${timelinePos}%` }} />
                        <div
                            className="timeline-thumb"
                            style={{ left: `${timelinePos}%` }}
                            onMouseDown={(e) => {
                                const track = e.currentTarget.parentElement!;
                                const rect = track.getBoundingClientRect();
                                const onMove = (ev: MouseEvent) => {
                                    const p = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
                                    setTimelinePos(p);
                                };
                                const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                                window.addEventListener('mousemove', onMove);
                                window.addEventListener('mouseup', onUp);
                            }}
                        />
                    </div>
                    <div className="timeline-label" style={{ color: 'var(--cyan)', fontSize: '0.5rem' }}>—— 48H PROJECTION ——</div>
                    <div className="timeline-label">+48H</div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm">RESET TIMELINE</button>
                    <button className="btn btn-primary btn-sm">COMMIT PREDICTION</button>
                </div>
            </div>
        </div>
    );
}
