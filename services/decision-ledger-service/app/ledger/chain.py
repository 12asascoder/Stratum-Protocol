"""
STRATUM PROTOCOL — Cryptographic Hash Chain + Merkle Tree Verification
Implements the immutable decision ledger with:
- SHA-256 hash chaining (each block contains prev_hash + payload_hash)
- Merkle tree for efficient verification of any decision record
- Multi-signature support for human override entries
"""

import hashlib
import json
import time
import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

logger = logging.getLogger(__name__)


class DecisionStatus(str, Enum):
    PENDING = "pending"
    EXECUTED = "executed"
    HUMAN_OVERRIDE = "human_override"
    REJECTED = "rejected"
    EXPIRED = "expired"


class DecisionType(str, Enum):
    AI_RECOMMENDATION = "ai_recommendation"
    POLICY_ACTION = "policy_action"
    EMERGENCY_RESPONSE = "emergency_response"
    RESOURCE_REALLOCATION = "resource_reallocation"
    SIMULATION_TRIGGER = "simulation_trigger"
    GOVERNANCE_RULING = "governance_ruling"


@dataclass
class DecisionBlock:
    """
    An immutable block in the decision ledger chain.
    SHA-256 hash chained: block_hash = SHA256(block_index|prev_hash|timestamp|payload_hash)
    """
    block_index: int
    decision_id: str
    decision_type: DecisionType
    status: DecisionStatus
    payload: Dict[str, Any]

    # AI metadata
    ai_recommendation: str
    confidence_interval: Tuple[float, float]  # (lower_bound, upper_bound)
    model_version: str
    reasoning_trace: str

    # Outcome tracking
    real_world_outcome: Optional[Dict] = field(default=None)
    outcome_delta: Optional[float] = field(default=None)

    # Human override
    human_override: bool = False
    override_reason: Optional[str] = None
    override_operator_id: Optional[str] = None
    multi_sig_count: int = 0
    required_sigs: int = 1

    # Chain integrity
    prev_hash: str = "0" * 64
    payload_hash: str = ""
    block_hash: str = ""
    timestamp_ms: int = field(default_factory=lambda: int(time.time() * 1000))
    merkle_root: str = ""

    # Audit metadata
    city_id: str = ""
    operator_id: str = ""
    session_id: str = ""

    def __post_init__(self):
        if not self.decision_id:
            self.decision_id = str(uuid4())
        if not self.payload_hash:
            self.payload_hash = self._compute_payload_hash()
        if not self.block_hash:
            self.block_hash = self._compute_block_hash()

    def _compute_payload_hash(self) -> str:
        payload_str = json.dumps(self.payload, sort_keys=True, default=str)
        return hashlib.sha256(payload_str.encode()).hexdigest()

    def _compute_block_hash(self) -> str:
        block_content = "|".join([
            str(self.block_index),
            self.prev_hash,
            str(self.timestamp_ms),
            self.payload_hash,
            self.decision_type.value,
            self.status.value,
            self.model_version,
        ])
        return hashlib.sha256(block_content.encode()).hexdigest()

    def verify_integrity(self) -> bool:
        """Recompute block hash and compare to stored value."""
        expected_payload_hash = self._compute_payload_hash()
        expected_block_hash = self._compute_block_hash()
        return (
            self.payload_hash == expected_payload_hash
            and self.block_hash == expected_block_hash
        )

    def to_dict(self) -> Dict:
        return {
            "block_index": self.block_index,
            "decision_id": self.decision_id,
            "decision_type": self.decision_type.value,
            "status": self.status.value,
            "ai_recommendation": self.ai_recommendation,
            "confidence_interval": list(self.confidence_interval),
            "model_version": self.model_version,
            "reasoning_trace": self.reasoning_trace,
            "human_override": self.human_override,
            "override_reason": self.override_reason,
            "override_operator_id": self.override_operator_id,
            "multi_sig_count": self.multi_sig_count,
            "required_sigs": self.required_sigs,
            "prev_hash": self.prev_hash,
            "payload_hash": self.payload_hash,
            "block_hash": self.block_hash,
            "timestamp_ms": self.timestamp_ms,
            "timestamp_utc": datetime.utcfromtimestamp(self.timestamp_ms / 1000).isoformat(),
            "merkle_root": self.merkle_root,
            "city_id": self.city_id,
            "operator_id": self.operator_id,
            "real_world_outcome": self.real_world_outcome,
            "outcome_delta": self.outcome_delta,
        }

    @property
    def short_hash(self) -> str:
        """Display-friendly shortened hash (as seen in UI: 0x8BA2...F3E)."""
        return f"0x{self.block_hash[:4].upper()}...{self.block_hash[-3:].upper()}"


class MerkleTree:
    """
    Merkle tree for efficient batch verification of decision blocks.
    Allows O(log n) proof generation for any individual record.
    """

    def __init__(self, block_hashes: List[str]):
        self.leaves = block_hashes[:]
        self.tree = self._build_tree(block_hashes)

    def _build_tree(self, leaves: List[str]) -> List[List[str]]:
        if not leaves:
            return [[]]

        tree = [leaves[:]]
        while len(tree[-1]) > 1:
            level = tree[-1]
            # Duplicate last element if odd number
            if len(level) % 2 == 1:
                level = level + [level[-1]]
            next_level = [
                self._hash_pair(level[i], level[i + 1])
                for i in range(0, len(level), 2)
            ]
            tree.append(next_level)
        return tree

    @staticmethod
    def _hash_pair(left: str, right: str) -> str:
        combined = left + right
        return hashlib.sha256(combined.encode()).hexdigest()

    @property
    def root(self) -> str:
        if not self.tree or not self.tree[-1]:
            return "0" * 64
        return self.tree[-1][0]

    def get_proof(self, leaf_index: int) -> List[Dict]:
        """Generate a Merkle proof for leaf at given index."""
        if leaf_index >= len(self.leaves):
            raise IndexError(f"Leaf index {leaf_index} out of range")

        proof = []
        idx = leaf_index

        for level in self.tree[:-1]:
            # Pad to even if needed
            padded = level + ([level[-1]] if len(level) % 2 == 1 else [])
            if idx % 2 == 0:
                sibling_idx = idx + 1
                direction = "right"
            else:
                sibling_idx = idx - 1
                direction = "left"

            if sibling_idx < len(padded):
                proof.append({"hash": padded[sibling_idx], "direction": direction})
            idx //= 2

        return proof

    def verify_proof(self, leaf_hash: str, leaf_index: int, proof: List[Dict]) -> bool:
        """Verify a Merkle proof against the stored root."""
        current = leaf_hash
        for step in proof:
            sibling = step["hash"]
            if step["direction"] == "right":
                current = self._hash_pair(current, sibling)
            else:
                current = self._hash_pair(sibling, current)
        return current == self.root


class DecisionChain:
    """
    In-memory append-only decision chain manager.
    Persisted to PostgreSQL via the ledger repository.
    """

    def __init__(self):
        self._blocks: List[DecisionBlock] = []
        self._merkle_tree: Optional[MerkleTree] = None

    def append(self, block_data: Dict) -> DecisionBlock:
        prev_hash = self._blocks[-1].block_hash if self._blocks else "0" * 64
        block = DecisionBlock(
            block_index=len(self._blocks),
            prev_hash=prev_hash,
            **block_data,
        )
        self._blocks.append(block)
        self._rebuild_merkle()

        logger.info(
            f"📋 Block #{block.block_index} appended — "
            f"ID: {block.decision_id[:8]} | Hash: {block.short_hash} | "
            f"Type: {block.decision_type} | Confidence: {block.confidence_interval}"
        )
        return block

    def _rebuild_merkle(self):
        hashes = [b.block_hash for b in self._blocks]
        self._merkle_tree = MerkleTree(hashes)
        # Update last block with current Merkle root
        if self._blocks:
            self._blocks[-1].merkle_root = self._merkle_tree.root

    def verify_chain_integrity(self) -> Tuple[bool, List[int]]:
        """Verify all blocks. Returns (is_valid, list_of_corrupt_indices)."""
        corrupted = []
        for i, block in enumerate(self._blocks):
            if not block.verify_integrity():
                corrupted.append(i)
            if i > 0:
                if block.prev_hash != self._blocks[i - 1].block_hash:
                    if i not in corrupted:
                        corrupted.append(i)
        return len(corrupted) == 0, corrupted

    def get_merkle_root(self) -> str:
        return self._merkle_tree.root if self._merkle_tree else "0" * 64

    def get_proof(self, block_index: int) -> Dict:
        return {
            "block_index": block_index,
            "leaf_hash": self._blocks[block_index].block_hash,
            "proof": self._merkle_tree.get_proof(block_index),
            "root": self.get_merkle_root(),
        }

    @property
    def length(self) -> int:
        return len(self._blocks)

    @property
    def head(self) -> Optional[DecisionBlock]:
        return self._blocks[-1] if self._blocks else None
