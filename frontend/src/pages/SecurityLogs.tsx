import React, { useState, useEffect, useRef } from 'react';

const SECURITY_EVENTS = [
    { time: '13:42:01', level: 'INFO', source: 'mTLS_ROUTER', message: 'Node-04 authenticated successfully via client-certificate-01.' },
    { time: '13:42:05', level: 'WARN', source: 'WAF_INGRESS', message: 'Rate-limiting active for IP 192.168.1.1 — 429 response sent.' },
    { time: '13:42:12', level: 'ERR', source: 'ISTIO_POLICY', message: 'Unauthorized service-to-service call blocked: engine-svc → database-svc.' },
    { time: '13:42:18', level: 'AUDIT', source: 'VAULT_KMS', message: 'Secret "API_KEY_STRATUM" accessed by service account "sa-742".' },
    { time: '13:42:25', level: 'SCAN', source: 'TRIVY_OPERATOR', message: 'Vulnerability scan completed for pod: inference-v2.0. Result: 0 Critical, 2 Medium.' },
    { time: '13:42:31', level: 'NET', source: 'CALICO_NODE', message: 'Policy "block-all-external" applied to newly created namespace: testing.' },
];

function LogRow({ log }: { log: typeof SECURITY_EVENTS[0] }) {
    const levelColor = {
        INFO: 'var(--cyan)',
        WARN: 'var(--warning)',
        ERR: 'var(--red)',
        AUDIT: 'var(--purple)',
        SCAN: 'var(--green)',
        NET: 'var(--blue)',
    }[log.level] || 'var(--text-primary)';

    return (
        <div className="log-row p-2 border-b border-subtle last:border-0 hover:bg-elevated transition-colors">
            <div className="flex gap-4 items-center">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', width: '70px' }}>[{log.time}]</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: levelColor, width: '60px', fontWeight: 600 }}>{log.level}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)', width: '120px' }}>{log.source}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', flex: 1 }}>{log.message}</span>
            </div>
        </div>
    );
}

export default function SecurityLogs() {
    const [threatLevel, setThreatLevel] = useState('LOW');
    const [activeThreats, setActiveThreats] = useState(0);

    return (
        <div className="page-container" style={{ overflowY: 'auto' }}>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                        SECURITY LOGS & THREAT INTEL
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
                        Audit trails and cyber defense telemetry.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="metric-min-card">
                        <div className="metric-min-label">THREAT LEVEL</div>
                        <div className="metric-min-value" style={{ color: 'var(--green)' }}>{threatLevel}</div>
                    </div>
                    <div className="metric-min-card">
                        <div className="metric-min-label">ACTIVE THREATS</div>
                        <div className="metric-min-value">{activeThreats}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="card">
                        <div className="card-header"><div className="card-title">ACCESS POLICIES</div></div>
                        <div className="card-body">
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-muted)' }}>mTLS FORCED</span>
                                    <span style={{ color: 'var(--green)' }}>✓ ENABLED</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-muted)' }}>RBAC SYNC</span>
                                    <span style={{ color: 'var(--green)' }}>✓ ACTIVE</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-muted)' }}>IP WHITELIST</span>
                                    <span style={{ color: 'var(--warning)' }}>! PARTIAL</span>
                                </div>
                                <button className="btn btn-primary btn-sm w-full mt-4">MANAGE POLICIES</button>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header"><div className="card-title">NETWORK SCANNER</div></div>
                        <div className="card-body">
                             <div className="text-center py-4">
                                 <div style={{ fontSize: '2rem', marginBottom: 8 }}>🛡️</div>
                                 <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>SYSTEM PROTECTED</div>
                                 <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>Last scan: 14m ago</div>
                                 <button className="btn btn-ghost btn-xs mt-4">RUN SCAN NOW</button>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="card lg:col-span-3">
                    <div className="card-header">
                        <div className="card-title">LIVE SECURITY EVENT STREAM</div>
                        <div className="flex gap-2">
                             <input className="log-input text-xs px-2 py-1" placeholder="Filter logs..." style={{ width: 150 }} />
                             <button className="btn btn-ghost btn-sm">EXPORT</button>
                        </div>
                    </div>
                    <div className="card-body" style={{ background: 'var(--bg-surface-2)', minHeight: '400px' }}>
                         <div className="security-log-container">
                             {SECURITY_EVENTS.map((log, i) => (
                                 <LogRow key={i} log={log} />
                             ))}
                             {/* Fill empty space with fake noise for aesthetics */}
                             {Array.from({ length: 15 }).map((_, i) => (
                                 <div key={i} style={{ opacity: 0.1, pointerEvents: 'none' }}>
                                     <LogRow log={{ time: '00:00:00', level: 'DEBUG', source: 'TRACE', message: 'Trace packet acknowledged by gateway. No anomalies detected.' }} />
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="card">
                    <div className="card-header"><div className="card-title">MTLS HANDSHAKE LATENCY</div></div>
                    <div className="card-body">
                        <div className="metric-min-value" style={{ fontSize: '1.5rem', color: 'var(--cyan)' }}>12.4ms</div>
                        <div className="progress-track mt-4" style={{ height: 4 }}>
                             <div className="progress-fill" style={{ width: '45%' }} />
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><div className="card-title">VAULT REQ RATE</div></div>
                    <div className="card-body">
                        <div className="metric-min-value" style={{ fontSize: '1.5rem', color: 'var(--cyan)' }}>142 / sec</div>
                        <div className="progress-track mt-4" style={{ height: 4 }}>
                             <div className="progress-fill warning" style={{ width: '82%' }} />
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><div className="card-title">FAIL2BAN BLOCKED</div></div>
                    <div className="card-body">
                        <div className="metric-min-value" style={{ fontSize: '1.5rem', color: 'var(--cyan)' }}>1,024 IPs</div>
                        <div className="progress-track mt-4" style={{ height: 4 }}>
                             <div className="progress-fill" style={{ width: '15%' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
