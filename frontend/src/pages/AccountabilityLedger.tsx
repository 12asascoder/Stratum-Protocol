import React, { useState, useEffect } from 'react';

// ==============================
// MOCK DECISIONS DATA
// ==============================
const DECISIONS = [
    {
        id: 829,
        title: 'Protocol Rebalancing #829',
        status: 'executed',
        aiRec: 'AI Rec: Shift 14.2% liquidity from Pool-A to Neutral-B',
        confidence: 98.4,
        logicTrace: '"Risk threshold 0.04% exceeded on Pool-A volatility. Neutral-B offers +2.1% safety margin vs liquidity depth."',
        merkleHash: '0x8BA2...F3E',
        timestamp: '2023-11-24 14:02:11 UTC',
        humanOverride: false,
        type: 'executed',
    },
    {
        id: 828,
        title: 'Emergency Circuit Breaker',
        status: 'human_override',
        aiRec: 'AI Rec: Halt all trading for 120 minutes',
        confidence: 64.1,
        logicTrace: '"Human Council identified external oracle delay not accounted for in AI model. Trading resumed with manual parameters."',
        merkleHash: 'SIG: 7/12 MULTI-SIG',
        timestamp: '2023-11-24 11:45:52 UTC',
        humanOverride: true,
        type: 'override',
    },
    {
        id: 44,
        title: 'Yield Optimization #44',
        status: 'pending',
        aiRec: 'Processing simulation for cross-chain bridge efficiency...',
        confidence: null,
        logicTrace: null,
        merkleHash: null,
        timestamp: null,
        humanOverride: false,
        type: 'pending',
    },
];

const BAR_HEIGHTS = [30, 45, 35, 55, 40, 70, 50, 90, 60, 100, 75];

// ==============================
// DECISION CARD
// ==============================
function DecisionCard({ decision }: { decision: typeof DECISIONS[0] }) {
    const typeClass = decision.type === 'override' ? 'override' : decision.type === 'pending' ? 'pending' : '';
    const confClass = decision.confidence !== null
        ? decision.confidence >= 90 ? 'high' : decision.confidence >= 70 ? 'medium' : 'low'
        : '';

    return (
        <div className={`decision-card ${typeClass}`} style={{ marginBottom: 12 }}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="decision-avatar">
                        {decision.type === 'executed' ? '✓' : decision.type === 'override' ? '👤' : '⏰'}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                {decision.title}
                            </div>
                            {decision.status === 'executed' && <div className="tag tag-executed">EXECUTED</div>}
                            {decision.status === 'human_override' && <div className="tag tag-override">HUMAN OVERRIDE</div>}
                            {decision.status === 'pending' && <div className="tag tag-pending">PENDING</div>}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {decision.aiRec}
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {decision.confidence !== null ? 'CONFIDENCE' : 'EST. CONFIDENCE'}
                    </div>
                    <div className={`confidence-value ${confClass}`}>
                        {decision.confidence !== null ? `${decision.confidence}%` : '—— . ——%'}
                    </div>
                </div>
            </div>

            {decision.logicTrace && (
                <>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '12px 0 4px' }}>
                        LOGIC TRACE
                    </div>
                    <div className="logic-trace">{decision.logicTrace}</div>
                </>
            )}

            {decision.merkleHash && (
                <div className="flex items-center justify-between mt-2">
                    <div className="merkle-hash">
                        {decision.humanOverride ? '🔑 ' : '◎ '}  {decision.merkleHash}
                    </div>
                    {decision.timestamp && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                            Timestamp: {decision.timestamp}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ==============================
// MAIN PAGE
// ==============================
export default function AccountabilityLedger() {
    const [activeTab, setActiveTab] = useState('ALL DECISIONS');
    const [outcomeAccuracy, setOutcomeAccuracy] = useState(1.2);

    useEffect(() => {
        const interval = setInterval(() => {
            setOutcomeAccuracy(v => Math.max(0, Math.min(5, v + (Math.random() - 0.48) * 0.1)));
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="page-container" style={{ overflowY: 'auto', display: 'flex', gap: 20 }}>
            {/* LEFT COLUMN */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Header */}
                <div style={{ marginBottom: 20 }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                        Global Accountability Ledger
                    </h1>
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-6">
                            <div className="status-dot" style={{ background: 'var(--cyan)' }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                                LIVE SYNC · IMMUTABLE GOVERNANCE TRUST LAYER
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs + Audit Button */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-0">
                        {['ALL DECISIONS', 'HUMAN OVERRIDES', 'CRITICAL ALERTS'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '8px 20px',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.06em',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: activeTab === tab ? '2px solid var(--cyan)' : '2px solid transparent',
                                    color: activeTab === tab ? 'var(--cyan)' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    transition: 'var(--transition-fast)',
                                    paddingBottom: 10,
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-primary">AUDIT DECISION</button>
                </div>

                {/* Decision Cards */}
                <div>
                    {DECISIONS
                        .filter(d => {
                            if (activeTab === 'HUMAN OVERRIDES') return d.humanOverride;
                            if (activeTab === 'CRITICAL ALERTS') return d.confidence !== null && d.confidence < 70;
                            return true;
                        })
                        .map(d => <DecisionCard key={d.id} decision={d} />)}
                </div>
            </div>

            {/* RIGHT PANEL — DELTA ANALYSIS */}
            <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">📊 Delta Analysis</div>
                    </div>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Outcome Accuracy */}
                        <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>
                                OUTCOME ACCURACY
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--green)', fontWeight: 700, marginBottom: 6 }}>
                                +{outcomeAccuracy.toFixed(1)}% VARIANCE
                            </div>
                            <div className="progress-track">
                                <div className="progress-fill green" style={{ width: '82%' }} />
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                Predicted result vs actual market response.
                            </div>
                        </div>

                        {/* Previous Decision Impact */}
                        <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8 }}>
                                PREVIOUS DECISION IMPACT
                            </div>
                            <div className="flex items-center justify-between mb-8">
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    Block #828
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>
                                    +2.4M TVL
                                </div>
                            </div>
                            {/* Bar chart */}
                            <div className="delta-bar-group" style={{ marginBottom: 0 }}>
                                {BAR_HEIGHTS.map((h, i) => (
                                    <div
                                        key={i}
                                        className={`delta-bar ${i === BAR_HEIGHTS.length - 1 ? 'highlight' : ''}`}
                                        style={{ height: `${h}%` }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Model Drift */}
                        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                            <div className="flex items-start gap-2 mb-8">
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)', marginTop: 4, flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 2 }}>
                                        Model Drift Detected
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                        Confidence intervals for BTC pairs showing 0.05% deviation from baseline logic.
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)', marginTop: 4, flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 2 }}>
                                        Next Calibration Cycle
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                        Scheduled in T-minus 4h 12m for governance node 0x91...22.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                            DOWNLOAD INTEGRITY REPORT (JSON)
                        </button>

                        {/* Chain Verified */}
                        <div style={{
                            padding: '12px 14px', background: 'rgba(0,229,255,0.05)',
                            border: '1px solid var(--border-default)', borderRadius: 8,
                        }}>
                            <div className="flex items-center gap-2 mb-1">
                                <span style={{ fontSize: 16 }}>🛡</span>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--cyan)', fontWeight: 700 }}>
                                    CHAIN-OF-CUSTODY VERIFIED
                                </div>
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: 24 }}>
                                All logic traces are cross-indexed against the Stratum Mainnet Archive.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
