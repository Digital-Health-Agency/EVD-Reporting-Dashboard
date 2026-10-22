import os
import re
import time
from collections import OrderedDict
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from . import config, stats
from .generator import GREETING_REPLY, answer, is_greeting
from .retriever import VectorStore
from .schemas import ChatRequest, ChatResponse, Citation

store: VectorStore | None = None

_CACHE_MAX = int(os.environ.get("CACHE_MAX", "200"))
_CACHE_TTL = float(os.environ.get("CACHE_TTL", "3600"))
_STATS_CACHE_TTL = float(os.environ.get("STATS_CACHE_TTL", "60"))
_cache: "OrderedDict[str, tuple[float, ChatResponse]]" = OrderedDict()


def _cache_key(question: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", "", question.lower())).strip()


def _cache_get(question: str) -> ChatResponse | None:
    key = _cache_key(question)
    hit = _cache.get(key)
    if hit is None:
        return None
    ts, resp = hit
    ttl = _STATS_CACHE_TTL if resp.mode in ("stats", "llm+stats") else _CACHE_TTL
    if time.time() - ts > ttl:
        _cache.pop(key, None)
        return None
    _cache.move_to_end(key)
    return resp


def _cache_put(question: str, resp: ChatResponse) -> None:
    if resp.mode in ("stats-unavailable", "no-hit"):
        return
    _cache[_cache_key(question)] = (time.time(), resp)
    _cache.move_to_end(_cache_key(question))
    while len(_cache) > _CACHE_MAX:
        _cache.popitem(last=False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global store
    store = VectorStore()
    yield


app = FastAPI(
    title="Kenya PH Surveillance RAG Assistant",
    version="0.1.0",
    lifespan=lifespan,
)

# Prototype: open CORS so any frontend (e.g. the UHAI dashboard) can call /chat
# directly from the browser. Restrict origins before production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "chunks": len(store.chunks) if store else 0,
        "llm_enabled": config.LLM_ENABLED,
    }


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    assert store is not None
    if is_greeting(req.question):
        return ChatResponse(answer=GREETING_REPLY, mode="greeting",
                            citations=[], disclaimer=config.DISCLAIMER)
    cached = _cache_get(req.question)
    if cached is not None:
        return cached
    data = None
    unavailable = False
    wants_stats = stats.is_stats_query(req.question)
    if wants_stats and config.UHAI_STATS_URL:
        data = stats.fetch_stats(stats.extract_params(req.question))
    if wants_stats and data is not None:
        # Live figures are computed deterministically — instant and exact.
        resp = ChatResponse(answer=stats.format_answer(req.question, data),
                            mode="stats", citations=[],
                            disclaimer=config.DISCLAIMER)
        _cache_put(req.question, resp)
        return resp
    hits = store.search(req.question, k=req.top_k or config.TOP_K)
    unavailable = wants_stats and data is None
    text, mode = answer(req.question, hits, stats=data,
                        stats_unavailable=unavailable)
    citations = [
        Citation(
            doc_short=h["doc_short"],
            doc_title=h["doc_title"],
            page=h["page"],
            score=h["score"],
            snippet=h["text"][:280],
        )
        for h in hits
    ]
    resp = ChatResponse(answer=text, mode=mode, citations=citations,
                        disclaimer=config.DISCLAIMER)
    _cache_put(req.question, resp)
    return resp


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(config.BASE_DIR / "app" / "static" / "index.html")


app.mount("/static", StaticFiles(directory=config.BASE_DIR / "app" / "static"), name="static")
