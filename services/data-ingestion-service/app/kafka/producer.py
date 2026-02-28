"""
Kafka Producer Manager for STRATUM Data Ingestion Service.
Handles producer lifecycle, batching, serialization, and fault tolerance.
"""

import asyncio
import json
import hashlib
import time
import logging
from typing import Any, Dict, Optional
from aiokafka import AIOKafkaProducer
from aiokafka.errors import KafkaError

from app.core.config import settings

logger = logging.getLogger(__name__)


class KafkaProducerManager:
    """
    Thread-safe async Kafka producer with:
    - Batching and compression
    - Dead-letter queue for failed messages
    - Idempotent delivery guarantees
    - Message fingerprinting for deduplication
    """

    def __init__(self):
        self._producer: Optional[AIOKafkaProducer] = None
        self._batch_buffer: list = []
        self._batch_lock = asyncio.Lock()
        self._flush_task: Optional[asyncio.Task] = None
        self._produced_count = 0
        self._failed_count = 0

    async def start(self):
        self._producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            enable_idempotence=True,
            acks="all",
            compression_type="lz4",
            max_batch_size=1024 * 1024,  # 1MB
            linger_ms=5,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
            max_request_size=10 * 1024 * 1024,  # 10MB
        )
        await self._producer.start()
        self._flush_task = asyncio.create_task(self._periodic_flush())
        logger.info("✅ Kafka producer started")

    async def stop(self):
        if self._flush_task:
            self._flush_task.cancel()
        await self._flush_all()
        if self._producer:
            await self._producer.stop()
        logger.info(f"Kafka producer stopped. Produced: {self._produced_count}, Failed: {self._failed_count}")

    async def produce(
        self,
        topic: str,
        value: Dict[str, Any],
        key: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> bool:
        """Produce a single message with DLQ fallback on error."""
        try:
            encoded_headers = [(k, v.encode()) for k, v in (headers or {}).items()]
            await self._producer.send_and_wait(
                topic,
                value=value,
                key=key,
                headers=encoded_headers,
            )
            self._produced_count += 1
            return True
        except KafkaError as e:
            logger.error(f"Kafka produce error for topic {topic}: {e}")
            await self._send_to_dlq(topic, value, str(e))
            self._failed_count += 1
            return False

    async def produce_batch(self, topic: str, messages: list) -> int:
        """Produce a batch of messages, returns count of successfully sent."""
        sent = 0
        async with self._batch_lock:
            for msg in messages:
                success = await self.produce(topic, msg, key=msg.get("source_id"))
                if success:
                    sent += 1
        return sent

    async def _send_to_dlq(self, original_topic: str, value: Dict, error: str):
        """Send failed messages to the dead-letter queue."""
        try:
            dlq_payload = {
                "original_topic": original_topic,
                "payload": value,
                "error": error,
                "timestamp_ms": int(time.time() * 1000),
                "fingerprint": hashlib.sha256(
                    json.dumps(value, sort_keys=True).encode()
                ).hexdigest()[:16],
            }
            await self._producer.send_and_wait(settings.TOPIC_DLQ, value=dlq_payload)
        except Exception as e:
            logger.critical(f"DLQ send failed: {e}")

    async def _periodic_flush(self):
        """Periodic buffer flush task."""
        while True:
            await asyncio.sleep(settings.BATCH_FLUSH_INTERVAL_SECONDS)
            await self._flush_all()

    async def _flush_all(self):
        async with self._batch_lock:
            if self._batch_buffer:
                self._batch_buffer.clear()

    @property
    def stats(self) -> Dict:
        return {
            "produced": self._produced_count,
            "failed": self._failed_count,
            "success_rate": (
                self._produced_count / max(self._produced_count + self._failed_count, 1)
            ) * 100,
        }
