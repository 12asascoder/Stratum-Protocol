"""
Data Validation & Schema Enforcement for STRATUM Ingestion Service.
Validates incoming telemetry payloads, enforces schema, detects outliers.
"""

import numpy as np
import logging
import time
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field, validator
from datetime import datetime

logger = logging.getLogger(__name__)


class SensorCategory(str, Enum):
    POWER = "power"
    WATER = "water"
    TRAFFIC = "traffic"
    ENVIRONMENTAL = "environmental"
    STRUCTURAL = "structural"
    CYBER = "cyber"
    SOCIAL = "social"


class SensorPayload(BaseModel):
    """Canonical urban sensor telemetry payload schema."""

    sensor_id: str = Field(..., min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_\-\.]+$")
    source_id: str = Field(..., description="Source system identifier")
    category: SensorCategory
    city_id: str = Field(..., description="ISO 3166 city code e.g. NYC, LDN, TKY")
    sector_id: str = Field(..., description="Grid sector within city")
    timestamp_ms: int = Field(..., description="Unix timestamp in milliseconds")
    values: Dict[str, float] = Field(..., description="Named metric readings")
    unit_map: Dict[str, str] = Field(default_factory=dict, description="Units for each value key")
    quality_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Data quality 0-1")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

    @validator("timestamp_ms")
    def timestamp_must_be_recent(cls, v):
        now_ms = int(time.time() * 1000)
        max_age_ms = 5 * 60 * 1000  # 5 minutes
        if now_ms - v > max_age_ms:
            raise ValueError(f"Timestamp too old: {now_ms - v}ms ago")
        return v

    @validator("values")
    def values_must_not_be_empty(cls, v):
        if not v:
            raise ValueError("Sensor payload must contain at least one value")
        return v


class ValidationResult(BaseModel):
    valid: bool
    payload: Optional[SensorPayload]
    errors: List[str] = Field(default_factory=list)
    outlier_flags: Dict[str, bool] = Field(default_factory=dict)
    quality_score: float = 1.0
    processing_time_ms: float = 0.0


class OutlierDetector:
    """
    Z-score + IQR hybrid outlier detection with rolling window baselines.
    Maintains per-sensor rolling statistics for adaptive thresholding.
    """

    def __init__(self, z_threshold: float = 3.5, window_size: int = 100):
        self.z_threshold = z_threshold
        self.window_size = window_size
        self._sensor_history: Dict[str, Dict[str, List[float]]] = {}

    def detect(self, sensor_id: str, values: Dict[str, float]) -> Dict[str, bool]:
        """Returns dict of {metric_key: is_outlier}."""
        if sensor_id not in self._sensor_history:
            self._sensor_history[sensor_id] = {}

        outlier_flags = {}
        for key, val in values.items():
            history = self._sensor_history[sensor_id].setdefault(key, [])
            history.append(val)

            # Keep rolling window
            if len(history) > self.window_size:
                history.pop(0)

            # Need at least 10 samples for meaningful stats
            if len(history) < 10:
                outlier_flags[key] = False
                continue

            arr = np.array(history[:-1])  # Exclude current point for stats
            mean = np.mean(arr)
            std = np.std(arr)

            if std == 0:
                outlier_flags[key] = False
                continue

            z_score = abs((val - mean) / std)

            # IQR check
            q1, q3 = np.percentile(arr, [25, 75])
            iqr = q3 - q1
            iqr_outlier = val < (q1 - 1.5 * iqr) or val > (q3 + 1.5 * iqr)

            outlier_flags[key] = z_score > self.z_threshold or iqr_outlier

        return outlier_flags


class TimeSeriesNormalizer:
    """Normalizes sensor values using min-max or z-score normalization."""

    def normalize_minmax(
        self, values: Dict[str, float], bounds: Dict[str, Tuple[float, float]]
    ) -> Dict[str, float]:
        normalized = {}
        for key, val in values.items():
            if key in bounds:
                min_v, max_v = bounds[key]
                if max_v > min_v:
                    normalized[key] = (val - min_v) / (max_v - min_v)
                else:
                    normalized[key] = 0.0
            else:
                normalized[key] = val
        return normalized


class SchemaValidator:
    """Main validator combining schema enforcement, outlier detection, and quality scoring."""

    def __init__(self):
        self.outlier_detector = OutlierDetector()
        self.normalizer = TimeSeriesNormalizer()
        self._validated_count = 0
        self._rejected_count = 0

    def validate(self, raw_data: Dict[str, Any]) -> ValidationResult:
        start_time = time.perf_counter()
        errors = []
        outlier_flags = {}

        try:
            payload = SensorPayload(**raw_data)
        except Exception as e:
            self._rejected_count += 1
            return ValidationResult(
                valid=False,
                payload=None,
                errors=[str(e)],
                processing_time_ms=(time.perf_counter() - start_time) * 1000,
            )

        # Outlier detection
        outlier_flags = self.outlier_detector.detect(payload.sensor_id, payload.values)
        outlier_count = sum(outlier_flags.values())

        # Quality score computation
        outlier_penalty = outlier_count * 0.1
        quality_score = max(0.0, 1.0 - outlier_penalty)

        if payload.quality_score is not None:
            quality_score = (quality_score + payload.quality_score) / 2

        self._validated_count += 1

        return ValidationResult(
            valid=True,
            payload=payload,
            errors=errors,
            outlier_flags=outlier_flags,
            quality_score=quality_score,
            processing_time_ms=(time.perf_counter() - start_time) * 1000,
        )

    @property
    def stats(self):
        return {
            "validated": self._validated_count,
            "rejected": self._rejected_count,
            "acceptance_rate": (
                self._validated_count
                / max(self._validated_count + self._rejected_count, 1)
            ) * 100,
        }
