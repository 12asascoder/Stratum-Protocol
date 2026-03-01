"""
Kafka and MQTT Consumer Manager for STRATUM Data Ingestion Service.
Handles MQTT ingestion from urban sensors and bridges to Kafka.
"""

import asyncio
import logging
import paho.mqtt.client as mqtt
from aiokafka import AIOKafkaConsumer
from typing import Optional, List

from app.core.config import settings

logger = logging.getLogger(__name__)

class KafkaConsumerManager:
    """
    Manages MQTT and Kafka consumers.
    Bridges MQTT telemetry streams to the internal Kafka bus.
    """

    def __init__(self):
        self._mqtt_client: Optional[mqtt.Client] = None
        self._kafka_consumer: Optional[AIOKafkaConsumer] = None
        self._is_running = False

    async def start(self):
        """Start consumers."""
        self._is_running = True
        
        # 1. Initialize MQTT Client
        self._mqtt_client = mqtt.Client(client_id="stratum-ingestion-service")
        if settings.MQTT_USERNAME:
            self._mqtt_client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)
        
        self._mqtt_client.on_connect = self._on_mqtt_connect
        self._mqtt_client.on_message = self._on_mqtt_message
        
        try:
            self._mqtt_client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT)
            self._mqtt_client.loop_start()
            logger.info(f"✅ MQTT connected to {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}")
        except Exception as e:
            logger.error(f"❌ Failed to connect to MQTT broker: {e}")

        # 2. Could also start a Kafka consumer if needed for internal processing
        # logger.info("✅ Kafka consumer manager ready")

    async def stop(self):
        """Stop consumers."""
        self._is_running = False
        if self._mqtt_client:
            self._mqtt_client.loop_stop()
            self._mqtt_client.disconnect()
        
        if self._kafka_consumer:
            await self._kafka_consumer.stop()
        
        logger.info("🛑 Consumer manager stopped")

    def _on_mqtt_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("Connected to MQTT broker")
            for topic in settings.MQTT_TOPICS:
                client.subscribe(topic)
                logger.info(f"Subscribed to MQTT topic: {topic}")
        else:
            logger.error(f"Failed to connect to MQTT broker, return code {rc}")

    def _on_mqtt_message(self, client, userdata, msg):
        """Handle incoming MQTT messages and bridge to Kafka."""
        try:
            # Here we would normally validate and then use a producer to send to Kafka
            # For now we'll just log
            logger.debug(f"Received MQTT message on {msg.topic}")
            # Implementation would use app.state.producer to send to TOPIC_RAW_SENSOR_DATA
        except Exception as e:
            logger.error(f"Error handling MQTT message: {e}")

    @property
    def is_healthy(self) -> bool:
        return self._is_running
