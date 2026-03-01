import logging
import sys


def configure_logging(level: str = "INFO") -> None:
    """Configure structured logging for the ingestion service."""
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
        stream=sys.stdout,
        force=True,
    )
    # Quiet noisy third-party loggers
    logging.getLogger("aiokafka").setLevel(logging.WARNING)
    logging.getLogger("paho").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
