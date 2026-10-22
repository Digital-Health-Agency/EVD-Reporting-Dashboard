# Surveillance Assistant (RAG Chatbot) — Server Deployment Guide

The dashboard ships a floating chat widget (bottom-right bubble → right-side
panel) backed by a separate Python service, `ph_surveillance_rag`. It answers
questions grounded in the surveillance guideline PDFs and the EVD dashboard
indicator documents in `docs/`, and can quote live dashboard metrics.

## Architecture

```
Browser ──► Next.js /api/rag/chat ──► ph_surveillance_rag  :8300  (FastAPI)
                │                          │ retrieval: FAISS + MiniLM embeddings
                │                          └─► llama-server :8081  (GGUF LLM, OpenAI API)
                └─ /api/rag/stats ◄── RAG fetches live metrics here
                       └─► proxies to NestJS SERVER_URL /api/analytics/metrics
```

## 1. Get the RAG service code

Copy/clone `ph_surveillance_rag` onto the server (it is a standalone project,
separate from this repo).

## 2. Download and optimize the LLM

The chatbot uses llama.cpp (`llama-server`) serving a GGUF model on port 8081.

Option A — via Ollama (easiest):
```bash
ollama pull qwen2.5-coder:1.5b        # ~986 MB, good speed on CPU
ollama show qwen2.5-coder:1.5b        # note the blob sha256 path
# blob lives at ~/.ollama/models/blobs/sha256-<digest>
```

Option B — download the GGUF directly:
```bash
mkdir -p ~/models
curl -L -o ~/models/qwen2.5-coder-1.5b.gguf \
  "https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf"
```

Install llama.cpp and start the server (CPU-tuned flags):
```bash
llama-server -m <model.gguf> \
    --port 8081 --ctx-size 8192 -t 8 --cache-reuse 256 &
```
- `-t 8` — match to the server's CPU core count.
- `--cache-reuse 256` — caches the fixed system prompt; large latency win.

## 3. Configure the RAG service

```bash
cd ph_surveillance_rag
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Copy the EVD dashboard docs into the corpus (already registered in
`app/ingest.py`'s `DOC_META`):
```bash
cp <dashboard-repo>/docs/*.pdf data/pdfs/
.venv/bin/python -m app.ingest     # builds store/chunks.jsonl
```

Start the API (defaults shown in `run.sh`):
```bash
UHAI_STATS_URL="http://<dashboard-host>:3000/api/rag/stats" \
  .venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8300
```

`UHAI_STATS_URL` must point at the dashboard's `/api/rag/stats` route — that is
how the assistant reads live figures (cases, samples tested, screenings).

## 4. Configure the dashboard `.env`

```bash
# .env.local — never commit this file
SERVER_URL=http://<nestjs-api-host>:4000   # existing backend API
NEXT_PUBLIC_SERVER_URL=http://<nestjs-api-host>:4000
RAG_URL=http://<rag-host>:8300             # the FastAPI chatbot service
```

Then run the dashboard:
```bash
npm ci
npm run dev        # or: npm run build && npm start
```

## 5. Smoke test

```bash
# RAG service health (should report chunks: 3916)
curl http://localhost:8300/health

# Chat through the dashboard proxy
curl -X POST http://localhost:3000/api/rag/chat \
  -H 'Content-Type: application/json' \
  -d '{"question":"What are the signs and symptoms of Ebola?"}'

# Live stats bridge (needs the NestJS backend running)
curl http://localhost:3000/api/rag/stats
```

Open the dashboard — the blue chat bubble appears bottom-right; clicking it
opens the assistant panel on the right side of the screen.
