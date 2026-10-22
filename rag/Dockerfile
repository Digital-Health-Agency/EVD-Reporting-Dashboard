# Kenya PH Surveillance RAG service — CPU build
FROM python:3.12-slim AS base
WORKDIR /app

# CPU-only torch keeps the image small; install before requirements so
# sentence-transformers resolves it instead of pulling the CUDA build.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY data ./data

# Bake the chunk store and embedding index into the image so cold starts
# don't recompute ~4k embeddings.
RUN python -m app.ingest \
 && python -c "from app.retriever import VectorStore; VectorStore()"

ENV LLM_URL=http://localhost:8081/v1/chat/completions
EXPOSE 8300
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8300"]
