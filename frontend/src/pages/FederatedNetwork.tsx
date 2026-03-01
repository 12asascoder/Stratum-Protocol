import React, { useState, useEffect } from 'react';

const FEDERATED_NODES = [
    { id: 'NYC_CENTRAL', x: 22, y: 38, label: 'New York', status: 'online', load: 45, latency: '12ms' },
    { id: 'BERLIN_NODE_09', x: 52, y: 25, label: 'Berlin', status: 'online', load: 78, latency: '45ms' },
    { id: 'TOKYO_CENTRAL', x: 80, y: 40, label: 'Tokyo', status: 'online', load: 92, latency: '110ms' },
    { id: 'DUBAI_CORE', x: 61, y: 48, label: 'Dubai', status: 'online', load: 34, latency: '68ms' },
    { id: 'SAO_PAULO_01', x: 28, y: 68, label: 'São Paulo', status: 'idle', load: 12, latency: '142ms' },
    { id: 'LAGOS_NODE', x: 50, y: 57, label: 'Lagos', status: 'online', load: 56, latency: '95ms' },
    { id: 'SYDNEY_EDGE', x: 84, y: 70, label: 'Sydney', status: 'online', load: 28, latency: '156ms' },
    { id: 'MOSCOW_CLUSTER', x: 62, y: 22, label: 'Moscow', status: 'offline', load: 0, latency: '∞' },
    { id: 'MUMBAI_DC', x: 68, y: 50, label: 'Mumbai', status: 'online', load: 65, latency: '82ms' },
    { id: 'LONDON_PRIME', x: 47, y: 24, label: 'London', status: 'online', load: 81, latency: '38ms' },
    { id: 'SINGAPORE_HUB', x: 78, y: 56, label: 'Singapore', status: 'online', load: 72, latency: '88ms' },
    { id: 'TORONTO_WEST', x: 18, y: 32, label: 'Toronto', status: 'online', load: 41, latency: '24ms' },
];

function NodeCard({ node }: { node: typeof FEDERATED_NODES[0] }) {
    return (
        <div className="card" style={{ padding: '16px' }}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>{node.id}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{node.label}</div>
                </div>
                <div className={`tag ${node.status === 'online' ? 'tag-online' : node.status === 'idle' ? 'tag-idle' : 'tag-offline'}`}>
                    {node.status.toUpperCase()}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>COMPUTE LOAD</div>
                    <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', color: node.load > 80 ? 'var(--warning)' : 'var(--cyan)' }}>
                        {node.load}%
                    </div>
                </div>
                <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>LATENCY (RTT)</div>
                    <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {node.latency}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 12 }}>
                <div className="progress-track" style={{ height: 4 }}>
                    <div 
                        className={`progress-fill ${node.load > 80 ? 'warning' : ''}`} 
                        style={{ width: `${node.load}%` }} 
                    />
                </div>
            </div>
        </div>
    );
}

export default function FederatedNetwork() {
    const [syncProgress, setSyncProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setSyncProgress(p => (p >= 100 ? 0 : p + 0.5));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="page-container" style={{ overflowY: 'auto' }}>
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                        FEDERATED NETWORK
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
                        Real-time synchronization across global intelligence nodes.
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                        GLOBAL SYNC PROGRESS
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="progress-track" style={{ width: 200 }}>
                            <div className="progress-fill" style={{ width: `${syncProgress}%` }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--cyan)' }}>
                            {Math.floor(syncProgress)}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="card lg:col-span-2" style={{ position: 'relative', height: '400px', background: 'var(--bg-surface-2)', overflow: 'hidden' }}>
                    <div className="card-header" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, background: 'linear-gradient(to bottom, var(--bg-surface-2), transparent)' }}>
                        <div className="card-title">GEOSPATIAL TOPOLOGY</div>
                        <div className="tag tag-active">12 SITES ACTIVE</div>
                    </div>
                    
                    {/* Map Background visualization */}
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
                        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {FEDERATED_NODES.map((from, i) =>
                                FEDERATED_NODES.slice(i + 1, i + 3).map((to, j) => (
                                    <line
                                        key={`${i}-${j}`}
                                        x1={from.x} y1={from.y}
                                        x2={to.x} y2={to.y}
                                        stroke="var(--cyan)"
                                        strokeWidth="0.2"
                                        strokeDasharray="1,2"
                                    />
                                ))
                            )}
                        </svg>
                    </div>

                    {/* Node points */}
                    {FEDERATED_NODES.map(node => (
                        <div
                            key={node.id}
                            className={`fed-node ${node.status}`}
                            style={{ 
                                position: 'absolute',
                                left: `${node.x}%`, 
                                top: `${node.y}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            <div className="node-pulse" style={{ animationDelay: `${Math.random() * 2}s` }} />
                            <div className="node-tooltip">
                                <div style={{ fontWeight: 600 }}>{node.label}</div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{node.status.toUpperCase()} | {node.load}%</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <div className="card-header">
                        <div className="card-title">NETWORK STATISTCS</div>
                    </div>
                    <div className="card-body">
                        <div className="space-y-6">
                            {[
                                { label: 'TOTAL THROUGHPUT', value: '42.8 GB/s', trend: '+12%', color: 'var(--cyan)' },
                                { label: 'AVERAGE LATENCY', value: '64ms', trend: '-4ms', color: 'var(--green)' },
                                { label: 'DATA INTEGRITY', value: '99.999%', trend: 'OPTIMAL', color: 'var(--cyan)' },
                                { label: 'ACTIVE TUNNELS', value: '842', trend: '+14', color: 'var(--cyan)' },
                            ].map((stat, i) => (
                                <div key={i} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                                    <div className="flex justify-between items-end mt-1">
                                        <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{stat.value}</div>
                                        <div style={{ fontSize: '0.7rem', color: stat.color, fontWeight: 600 }}>{stat.trend}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                NODE CLUSTERS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {FEDERATED_NODES.map(node => (
                    <NodeCard key={node.id} node={node} />
                ))}
            </div>
        </div>
    );
}
