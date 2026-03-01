import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import EngineRoom from './pages/EngineRoom';
import AccountabilityLedger from './pages/AccountabilityLedger';
import KnowledgeGraph from './pages/KnowledgeGraph';
import SovereignIntelligence from './pages/SovereignIntelligence';
import FederatedNetwork from './pages/FederatedNetwork';
import K8sNodes from './pages/K8sNodes';
import SecurityLogs from './pages/SecurityLogs';
import DataIngestion from './pages/DataIngestion';
import '../src/styles/global.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, staleTime: 5000 },
    },
});

function Navigation() {
    const location = useLocation();

    const getRouteLabel = () => {
        const map: Record<string, string> = {
            '/engine-room': 'HPC Cluster',
            '/ledger': 'Global Ledger',
            '/knowledge-graph': 'Digital Nervous System',
            '/sovereign': 'Sovereign Intelligence',
            '/federated': 'Federated Network',
            '/k8s': 'K8s Nodes',
            '/security': 'Security Logs',
            '/ingestion': 'Data Ingestion',
        };
        return map[location.pathname] || 'Dashboard';
    };

    return (
        <nav className="stratum-nav">
            <div className="nav-brand">
                <div className="nav-brand-icon">S</div>
                <div>
                    <div className="nav-brand-text">STRATUM PROTOCOL</div>
                    <div className="nav-brand-subtitle">ENGINE ROOM</div>
                </div>
            </div>

            <div className="nav-tabs">
                <NavLink to="/engine-room" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                    HPC Cluster
                </NavLink>
                <NavLink to="/knowledge-graph" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                    Knowledge Graph
                </NavLink>
                <NavLink to="/ledger" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                    Ledger
                </NavLink>
                <NavLink to="/sovereign" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                    Sovereign Intelligence
                </NavLink>
                <NavLink to="/federated" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                    Federated Network
                </NavLink>
                <NavLink to="/k8s" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                    K8s Nodes
                </NavLink>
                <NavLink to="/security" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                    Security Logs
                </NavLink>
                <NavLink to="/ingestion" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
                    Ingestion
                </NavLink>
            </div>

            <div className="nav-right">
                <div className="status-badge">
                    <span className="status-dot" />
                    SYSTEM HEALTHY · ROCm 6.1
                </div>
                <div className="nav-user">
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                            Admin_Terminal_01
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }}>
                            Node: US-EAST-1A
                        </div>
                    </div>
                    <div className="nav-avatar">A</div>
                </div>
            </div>
        </nav>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <div className="stratum-app">
                    <Navigation />
                    <div className="stratum-main">
                        <Routes>
                            <Route path="/" element={<EngineRoom />} />
                            <Route path="/engine-room" element={<EngineRoom />} />
                            <Route path="/ledger" element={<AccountabilityLedger />} />
                            <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
                            <Route path="/sovereign" element={<SovereignIntelligence />} />
                            <Route path="/federated" element={<FederatedNetwork />} />
                            <Route path="/k8s" element={<K8sNodes />} />
                            <Route path="/security" element={<SecurityLogs />} />
                            <Route path="/ingestion" element={<DataIngestion />} />
                        </Routes>
                    </div>
                </div>
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: 'var(--bg-surface-2)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-default)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                        },
                    }}
                />
            </BrowserRouter>
        </QueryClientProvider>
    );
}
