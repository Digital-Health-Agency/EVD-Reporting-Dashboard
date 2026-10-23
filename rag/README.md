# Kenya Public Health Surveillance RAG Assistant (prototype)

A grounded Q&A service over Kenya's three official disease-surveillance
documents. It answers questions about case definitions, reporting steps,
thresholds, escalation and the e-surveillance roadmap — **only** from the
source documents, with **source-document + page citations** for every answer.

## Corpus (exactly these three documents)

| Short name | Document |
|---|---|
| `IDSR-TG-3ed` | IDSR Technical Guidelines for Kenya, 3rd Edition (MoH, May 2022) — 600 pp |
| `DMT-PHE-2025` | Decision-Making Tool for Public Health Emergencies (KNPHI, 2025) — 77 pp |
| `DPHS-Roadmap` | Digital Public Health Surveillance Architecture & Roadmap (KNPHI, 2026–2030) — 83 pp |

## Architecture

```
data/pdfs/*.pdf ──► app/ingest.py ──► store/chunks.jsonl
                      (pypdf, page-anchored, ~900-char overlapping chunks)

query ──► all-MiniLM-L6-v2 embedding ──► FAISS IndexFlatIP (cosine)
      ──► top-k chunks ──► app/generator.py
            ├─ llm mode (default): llama.cpp `llama-server` serving the
            │   qwen2 GGUF (Ollama model blob), OpenAI-compatible /v1/chat,
            │   strict grounded system prompt, concise summarised answer
            └─ extractive fallback: verbatim passage windows if LLM is down
      ──► FastAPI /chat ──► answer + disclaimer
```

- **Extractive mode is deliberate for the prototype**: answers are verbatim
  excerpts from the guidelines, so the service cannot invent case definitions
  or thresholds. The LLM hook (`config.LLM_ENABLED`) plugs in later without
  changing retrieval or citation plumbing.
- Citations come from retrieval metadata (document + PDF page), never from
  the model — they are trustworthy regardless of which generator is active.

## Setup & run

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt   # CPU-only torch recommended:
# .venv/bin/pip install torch --index-url https://download.pytorch.org/whl/cpu

.venv/bin/python -m app.ingest              # → store/chunks.jsonl (3,045 chunks)

# LLM backend (CPU) — llama.cpp serving an Ollama GGUF blob:
llama-server -m ~/.ollama/models/blobs/sha256-<model-blob> \
    --port 8081 --ctx-size 8192 -t 8 &

.venv/bin/uvicorn app.main:app --port 8300
```

Behavior:

- Greetings ("hi", "hello", "habari", …) get a welcome + how-to-help reply
  with no retrieval.
- Questions are reranked (semantic + lexical + intent bonuses, form-template
  penalty), grounded against the three documents, and summarised by the LLM.
  If the LLM is unreachable the API falls back to verbatim passages.
- `LLM_ENABLED` in `app/config.py` toggles the LLM; `LLM_URL` points to any
  OpenAI-compatible server (llama.cpp, Ollama, vLLM).

## Live dashboard data (UHAI plugin)

Questions asking for live figures — "how many confirmed Ebola cases
currently?", "number of reported cholera deaths in Mandera" — are routed to
the UHAI dashboard data plugin instead of the documents. `app/stats.py`
detects the intent, extracts disease/status/county/period, and calls:

    GET {UHAI_STATS_URL}?disease=<slug>&status=<status>&county=<name>&period=<period>

The plugin's JSON is passed verbatim into the grounded prompt — the model
quotes figures exactly, never invents them. If the plugin is unset or
unreachable, the assistant says so and offers guideline help instead.

Enable it with an environment variable before `run.sh`:

    export UHAI_STATS_URL="http://dashboard-host/api/surveillance/stats"

- Chat UI: http://localhost:8300/
- API docs: http://localhost:8300/docs
- `GET /health`, `POST /chat {"question": "...", "top_k": 6}`

## Files

```
app/
  config.py      chunking, model, top-k, LLM toggle, disclaimer
  ingest.py      PDF → page-anchored chunks (store/chunks.jsonl)
  retriever.py   SentenceTransformer + FAISS search (numpy fallback)
  generator.py   LLM answer (grounded prompt) + extractive fallback
  stats.py       UHAI dashboard data plugin connector (live figures)
  main.py        FastAPI app: /health, /chat, chat UI
  schemas.py     pydantic request/response models
data/pdfs/       the three source PDFs (do not add others)
store/           generated chunk + embedding store
```

## Design guardrails

- `MIN_SCORE` floor: low-relevance questions get an honest "not found"
  instead of a fabricated answer.
- Every response ends with a non-clinical-advice disclaimer.
- Nothing is paraphrased by AI in extractive mode — citations are exact.

## Roadmap

1. ✅ Retrieval + citations prototype (this)
2. Ollama CPU LLM (`phi3:mini`/`llama3.2`) with grounded prompt for prose answers
3. Retrieval eval set (gold questions → expected pages) + reranker tuning
4. Fine-tune embedding model on domain Q&A pairs if recall needs it
5. UHAI dashboard integration (embed chat widget / call `/chat` from dashboard)

## Not in scope

- Any document beyond the three listed above
- Clinical advice, diagnosis or treatment recommendations
