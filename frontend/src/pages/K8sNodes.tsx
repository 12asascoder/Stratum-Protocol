import React, { useState, useEffect } from 'react';

const K8S_NODES = [
    { id: 'node-us-east-1a-01', type: 'ROCm / MI300X', status: 'Ready', cpu: '42%', mem: '68%', gpu: '94%', pods: 156, labels: ['GPU', 'PROD', 'US-EAST'] },
    { id: 'node-us-east-1a-02', type: 'ROCm / MI300X', status: 'Ready', cpu: '38%', mem: '45%', gpu: '88%', pods: 142, labels: ['GPU', 'PROD', 'US-EAST'] },
    { id: 'node-us-east-1b-01', type: 'CPU / HPC-OPTIMIZED', status: 'Ready', cpu: '76%', mem: '52%', gpu: '0%', pods: 248, labels: ['CPU', 'STAGING', 'US-EAST'] },
    { id: 'node-eu-west-1a-01', type: 'ROCm / MI250X', status: 'Ready', cpu: '21%', mem: '34%', gpu: '12%', pods: 89, labels: ['GPU', 'PROD', 'EU-WEST'] },
    { id: 'node-ap-south-1a-01', type: 'ROCm / MI300X', status: 'NotReady', cpu: '0%', mem: '0%', gpu: '0%', pods: 0, labels: ['GPU', 'FAULTY', 'AP-SOUTH'] },
    { id: 'node-sa-east-1a-01', type: 'CPU / HPC-OPTIMIZED', status: 'Ready', cpu: '12%', mem: '28%', gpu: '0%', pods: 64, labels: ['CPU', 'PROD', 'SA-EAST'] },
];

function NodeRow({ node }: { node: typeof K8S_NODES[0] }) {
    return (
        <tr className="k8s-table-row">
            <td>
                <div style={{ fontWeight: 600 }}>{node.id}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{node.type}</div>
            </td>
            <td>
                <div className={`tag ${node.status === 'Ready' ? 'tag-online' : 'tag-offline'}`}>
                    {node.status.toUpperCase()}
                </div>
            </td>
            <td>
                <div className="flex items-center gap-2">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{node.cpu}</span>
                    <div className="progress-track" style={{ width: 40, height: 4 }}>
                        <div className="progress-fill" style={{ width: node.cpu }} />
                    </div>
                </div>
            </td>
            <td>
                <div className="flex items-center gap-2">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{node.mem}</span>
                    <div className="progress-track" style={{ width: 40, height: 4 }}>
                        <div className="progress-fill warning" style={{ width: node.mem }} />
                    </div>
                </div>
            </td>
            <td>
                <div className="flex items-center gap-2">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{node.gpu}</span>
                    <div className="progress-track" style={{ width: 40, height: 4 }}>
                        <div className="progress-fill" style={{ width: node.gpu }} />
                    </div>
                </div>
            </td>
            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{node.pods}</td>
            <td>
                <div className="flex gap-1">
                    {node.labels.map(l => (
                        <span key={l} style={{ fontSize: '0.55rem', padding: '2px 6px', background: 'var(--bg-elevated)', borderRadius: 4, color: 'var(--text-secondary)' }}>
                            {l}
                        </span>
                    ))}
                </div>
            </td>
        </tr>
    );
}

export default function K8sNodes() {
    const [totalPods, setTotalPods] = useState(1248);

    useEffect(() => {
        const interval = setInterval(() => {
            setTotalPods(p => p + (Math.random() > 0.5 ? 1 : -1));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="page-container" style={{ overflowY: 'auto' }}>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                        K8S NODES & ORCHESTRATION
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
                        Cluster resource management and pod orchestration layer.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="metric-min-card">
                        <div className="metric-min-label">TOTAL CLUSTER PODS</div>
                        <div className="metric-min-value">{totalPods.toLocaleString()}</div>
                    </div>
                    <div className="metric-min-card">
                        <div className="metric-min-label">GPU UTILIZATION</div>
                        <div className="metric-min-value" style={{ color: 'var(--warning)' }}>84.2%</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <div className="card lg:col-span-1">
                    <div className="card-header"><div className="card-title">CLUSTER HEALTH</div></div>
                    <div className="card-body">
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span style={{ color: 'var(--text-muted)' }}>CONTROL PLANE</span>
                                <span style={{ color: 'var(--green)' }}>● HEALTHY</span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ color: 'var(--text-muted)' }}>ETCD STATUS</span>
                                <span style={{ color: 'var(--green)' }}>● OPTIMAL</span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ color: 'var(--text-muted)' }}>SCHEDULER</span>
                                <span style={{ color: 'var(--cyan)' }}>● ACTIVE</span>
                            </div>
                            <div style={{ marginTop: 24 }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 8 }}>RESOURCE QUOTA (TOTAL)</div>
                                <div className="progress-track" style={{ height: 8 }}>
                                    <div className="progress-fill" style={{ width: '75%' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                                    <span>75% ALLOCATED</span>
                                    <span>2.4 TB TOTAL</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card lg:col-span-3">
                    <div className="card-header">
                        <div className="card-title">INFRASTRUCTURE NODES</div>
                        <div className="flex gap-2">
                             <button className="btn btn-ghost btn-sm">REFRESH</button>
                             <button className="btn btn-primary btn-sm">ADD NODE</button>
                        </div>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="k8s-table">
                            <thead>
                                <tr>
                                    <th>NAME / TYPE</th>
                                    <th>STATUS</th>
                                    <th>CPU</th>
                                    <th>MEM</th>
                                    <th>GPU</th>
                                    <th style={{ textAlign: 'right' }}>PODS</th>
                                    <th>LABELS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {K8S_NODES.map(node => (
                                    <NodeRow key={node.id} node={node} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="card">
                    <div className="card-header"><div className="card-title">KEDA AUTO-SCALING</div></div>
                    <div className="card-body">
                        <div className="flex items-center justify-between p-3 bg-elevated rounded-lg border border-subtle mb-3">
                            <div>
                                <div style={{ fontWeight: 600 }}>inference-service-hpa</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Trigger: GPU_UTIL &gt; 85%</div>
                            </div>
                            <div className="tag tag-online">SCALE_UP</div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-elevated rounded-lg border border-subtle">
                            <div>
                                <div style={{ fontWeight: 600 }}>worker-retry-hpa</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Trigger: QUEUE_LENGTH &gt; 100</div>
                            </div>
                            <div className="tag tag-idle">IDLE</div>
                        </div>
                    </div>
                </div>

                <div className="card lg:col-span-2">
                    <div className="card-header"><div className="card-title">RECENT CLUSTER EVENTS</div></div>
                    <div className="card-body">
                         {[
                            { time: '2m ago', type: 'Normal', reason: 'Scheduled', message: 'Successfully assigned default/inference-pod-x82 to node-us-east-1a-01' },
                            { time: '4m ago', type: 'Warning', reason: 'BackOff', message: 'Back-off restarting failed container training-worker in pod training-job-92' },
                            { time: '7m ago', type: 'Normal', reason: 'ScalingReplicaSet', message: 'Scaled up replica set inference-service-74c to 12' },
                         ].map((event, i) => (
                             <div key={i} className="flex gap-4 p-2 border-b border-subtle last:border-0">
                                 <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', width: '60px' }}>{event.time}</div>
                                 <div>
                                     <div className="flex gap-2 items-center">
                                         <span style={{ fontWeight: 600, fontSize: '0.75rem', color: event.type === 'Warning' ? 'var(--warning)' : 'var(--cyan)' }}>[{event.reason}]</span>
                                         <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{event.message}</span>
                                     </div>
                                 </div>
                             </div>
                         ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
