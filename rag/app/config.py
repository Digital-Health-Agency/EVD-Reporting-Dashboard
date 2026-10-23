import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PDF_DIR = BASE_DIR / "data" / "pdfs"
STORE_DIR = BASE_DIR / "store"

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Chunking
CHUNK_SIZE = 900          # characters
CHUNK_OVERLAP = 150

# Retrieval
TOP_K = 3
MIN_SCORE = 0.25          # cosine similarity floor for "grounded" answers

# LLM (CPU): llama.cpp server serving a GGUF model, OpenAI-compatible API.
# Start with:
#   llama-server -m <gguf> --port 8081 --ctx-size 8192 -t 8
LLM_ENABLED = os.environ.get("LLM_ENABLED", "true").lower() != "false"
LLM_URL = os.environ.get("LLM_URL", "http://localhost:8081/v1/chat/completions")
LLM_TIMEOUT = float(os.environ.get("LLM_TIMEOUT", "20"))  # seconds; on timeout we fall back to extractive

# UHAI dashboard data plugin — live case/statistics source.
# Set UHAI_STATS_URL to the plugin endpoint, e.g.
#   http://dashboard-host/api/surveillance/stats
# Leave empty to disable live-data answers.
UHAI_STATS_URL = os.environ.get("UHAI_STATS_URL", "").rstrip("/")
STATS_TIMEOUT = 15  # seconds

DISCLAIMER = (
    "This assistant summarizes Kenya's official disease surveillance guidance "
    "and EVD dashboard indicators for reference only. It does not replace "
    "clinical judgement or the current IDSR/DMT-PHE guidelines — always "
    "confirm against the source document cited."
)
