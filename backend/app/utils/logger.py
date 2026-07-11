import logging
import os
from logging.handlers import RotatingFileHandler

# Define logs directory and file path
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "app.log")

# Create a formatter
log_formatter = logging.Formatter(
    fmt="%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d) - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Setup root logger
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
root_logger.addHandler(console_handler)

# Rotating File handler (max 10MB per file, keep 5 backups)
file_handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=10 * 1024 * 1024,
    backupCount=5,
    encoding="utf-8"
)
file_handler.setFormatter(log_formatter)
root_logger.addHandler(file_handler)

# Export get_logger function
def get_logger(name: str) -> logging.Logger:
    """
    Returns a logger instance for the given module name.
    """
    return logging.getLogger(name)

# Initial logs to indicate logger is working
logger = get_logger("app.init")
logger.info(f"Logging initialized. Log file path: {LOG_FILE}")
