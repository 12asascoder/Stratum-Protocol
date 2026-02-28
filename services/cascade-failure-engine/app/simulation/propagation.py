"""
Cascading Failure Propagation Simulator using PyTorch Geometric.
GPU-accelerated graph neural network for multi-hop failure propagation.
"""

import torch
import torch.nn.functional as F
import numpy as np
import logging
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    from torch_geometric.nn import GCNConv, GATConv
    from torch_geometric.data import Data
    HAS_PYG = True
except ImportError:
    logger.warning("PyTorch Geometric not available — using fallback CPU propagation")
    HAS_PYG = False


class FailureTrigger(str, Enum):
    EQUIPMENT_FAULT = "equipment_fault"
    CYBER_ATTACK = "cyber_attack"
    CLIMATE_EVENT = "climate_event"
    OVERLOAD = "overload"
    CASCADING = "cascading"
    HUMAN_ERROR = "human_error"


@dataclass
class FailureScenario:
    scenario_id: str
    trigger_node_ids: List[str]
    trigger_type: FailureTrigger
    trigger_severity: float  # 0-1
    climate_multiplier: float = 1.0
    cyber_injection_nodes: List[str] = None
    max_propagation_hops: int = 10
    time_window_hours: float = 24.0


@dataclass
class PropagationResult:
    scenario_id: str
    affected_nodes: List[Dict]
    cascade_paths: List[List[str]]
    collapse_probability_index: float
    time_to_failure_hours: Optional[float]
    economic_impact_usd: float
    population_at_risk: int
    simulation_duration_ms: float
    device_used: str
    hop_breakdown: Dict[int, int]  # hop_count -> affected_nodes


class GNNFailurePropagationModel(torch.nn.Module):
    """
    Graph Attention Network for failure propagation scoring.
    Input: node features (load, health, criticality, vulnerability)
    Output: failure probability per node
    """

    def __init__(self, in_channels: int = 8, hidden_channels: int = 64, out_channels: int = 1):
        super().__init__()
        if HAS_PYG:
            self.conv1 = GATConv(in_channels, hidden_channels, heads=4, concat=False)
            self.conv2 = GATConv(hidden_channels, hidden_channels, heads=4, concat=False)
            self.conv3 = GATConv(hidden_channels, out_channels, heads=1, concat=False)
        self.dropout = torch.nn.Dropout(p=0.2)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor, edge_weight: Optional[torch.Tensor] = None):
        if not HAS_PYG:
            raise RuntimeError("PyTorch Geometric required for GNN propagation")

        x = F.elu(self.conv1(x, edge_index))
        x = self.dropout(x)
        x = F.elu(self.conv2(x, edge_index))
        x = self.dropout(x)
        x = torch.sigmoid(self.conv3(x, edge_index))
        return x


class CascadeFailureSimulator:
    """
    Master simulation engine integrating GNN, climate, cyber, and economic models.
    """

    def __init__(self, device: str = "cpu"):
        self.device = torch.device(device)
        self.gnn_model = None
        if HAS_PYG:
            self.gnn_model = GNNFailurePropagationModel().to(self.device)
        logger.info(f"🔥 CascadeFailureSimulator initialized on {device}")

    def build_graph_tensor(
        self, nodes: List[Dict], edges: List[Dict]
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """Convert graph dict to PyG tensors."""
        node_features = []
        for node in nodes:
            features = [
                node.get("load_factor", 0.5),
                node.get("health_score", 1.0),
                node.get("criticality_score", 0.5),
                node.get("vulnerability_index", 0.5),
                1.0 if node.get("status") == "OPERATIONAL" else 0.0,
                node.get("age_years", 10) / 100.0,
                node.get("redundancy_level", 1) / 5.0,
                node.get("maintenance_lag_days", 0) / 365.0,
            ]
            node_features.append(features)

        node_id_to_idx = {n["node_id"]: i for i, n in enumerate(nodes)}
        edge_sources, edge_targets, edge_weights = [], [], []
        for edge in edges:
            src = node_id_to_idx.get(edge["from_node_id"])
            tgt = node_id_to_idx.get(edge["to_node_id"])
            if src is not None and tgt is not None:
                edge_sources.append(src)
                edge_targets.append(tgt)
                edge_weights.append(edge.get("weight", 1.0))

        x = torch.tensor(node_features, dtype=torch.float32, device=self.device)
        edge_index = torch.tensor(
            [edge_sources, edge_targets], dtype=torch.long, device=self.device
        )
        edge_weight = torch.tensor(edge_weights, dtype=torch.float32, device=self.device)
        return x, edge_index, edge_weight

    def simulate_propagation(
        self,
        scenario: FailureScenario,
        nodes: List[Dict],
        edges: List[Dict],
    ) -> PropagationResult:
        """
        Run GPU-accelerated cascade propagation simulation.
        Returns failure probabilities, affected nodes, and economic impact.
        """
        import time
        start_time = time.perf_counter()

        node_id_to_idx = {n["node_id"]: i for i, n in enumerate(nodes)}

        if HAS_PYG and self.gnn_model is not None:
            x, edge_index, edge_weight = self.build_graph_tensor(nodes, edges)

            # Inject failure at trigger nodes
            for trigger_id in scenario.trigger_node_ids:
                idx = node_id_to_idx.get(trigger_id)
                if idx is not None:
                    x[idx, 1] = 0.0  # Set health to 0
                    x[idx, 0] = 1.5 * scenario.trigger_severity  # Overload

            # Apply climate multiplier to all nodes
            x[:, 2] *= scenario.climate_multiplier

            with torch.no_grad():
                failure_probs = self.gnn_model(x, edge_index, edge_weight)
                failure_probs = failure_probs.squeeze(-1).cpu().numpy()
        else:
            # CPU fallback: BFS-based propagation
            failure_probs = self._cpu_fallback_propagation(
                scenario, nodes, edges, node_id_to_idx
            )

        # Classify affected nodes
        affected = []
        hop_breakdown = {}
        for i, node in enumerate(nodes):
            prob = float(failure_probs[i])
            if prob > 0.15:
                affected_info = dict(node)
                affected_info["failure_probability"] = round(prob, 4)
                affected_info["risk_level"] = (
                    "CRITICAL" if prob > 0.75 else
                    "HIGH" if prob > 0.5 else
                    "MEDIUM" if prob > 0.3 else "LOW"
                )
                affected.append(affected_info)

        # Collapse probability = max single-node failure prob weighted by criticality
        collapse_prob = float(np.average(
            [a["failure_probability"] for a in affected],
            weights=[a.get("criticality_score", 0.5) for a in affected],
        )) if affected else 0.0

        # Economic impact (simplified I/O model)
        economic_impact = sum(
            a.get("economic_value_usd_daily", 1_000_000) * a["failure_probability"]
            for a in affected
        )

        # Population at risk
        population_at_risk = sum(
            int(a.get("population_served", 10_000) * a["failure_probability"])
            for a in affected
        )

        # Time to failure estimation (exponential decay model)
        if collapse_prob > 0.5:
            time_to_failure = max(0.5, (1.0 - collapse_prob) * scenario.time_window_hours)
        else:
            time_to_failure = None

        duration_ms = (time.perf_counter() - start_time) * 1000

        return PropagationResult(
            scenario_id=scenario.scenario_id,
            affected_nodes=affected,
            cascade_paths=[],  # Populated by separate path-tracing query
            collapse_probability_index=round(collapse_prob * 100, 2),
            time_to_failure_hours=time_to_failure,
            economic_impact_usd=round(economic_impact, 2),
            population_at_risk=population_at_risk,
            simulation_duration_ms=round(duration_ms, 2),
            device_used=str(self.device),
            hop_breakdown=hop_breakdown,
        )

    def _cpu_fallback_propagation(
        self,
        scenario: FailureScenario,
        nodes: List[Dict],
        edges: List[Dict],
        node_id_to_idx: Dict,
    ) -> np.ndarray:
        """BFS-based failure propagation for CPU fallback."""
        probs = np.zeros(len(nodes))
        adjacency: Dict[int, List[Tuple[int, float]]] = {}

        for edge in edges:
            src = node_id_to_idx.get(edge["from_node_id"])
            tgt = node_id_to_idx.get(edge["to_node_id"])
            if src is not None and tgt is not None:
                adjacency.setdefault(src, []).append((tgt, edge.get("weight", 1.0)))

        queue = []
        for trigger_id in scenario.trigger_node_ids:
            idx = node_id_to_idx.get(trigger_id)
            if idx is not None:
                probs[idx] = scenario.trigger_severity
                queue.append((idx, scenario.trigger_severity))

        visited = set(idx for idx, _ in queue)
        hop = 0

        while queue and hop < scenario.max_propagation_hops:
            next_queue = []
            for node_idx, current_prob in queue:
                for neighbor_idx, weight in adjacency.get(node_idx, []):
                    propagated_prob = current_prob * weight * 0.7 * scenario.climate_multiplier
                    if propagated_prob > 0.05 and neighbor_idx not in visited:
                        probs[neighbor_idx] = max(probs[neighbor_idx], propagated_prob)
                        visited.add(neighbor_idx)
                        next_queue.append((neighbor_idx, propagated_prob))
            queue = next_queue
            hop += 1

        return probs
