"""Answer generation.

Two modes:
1. Grounded extractive mode (default, no LLM): returns the most relevant
   passages verbatim-ish with citations — safe, cannot hallucinate.
2. LLM mode (LLM_ENABLED=True, e.g. Ollama): the retrieved passages are packed
   into a strict grounded prompt and the model writes the prose. Citations are
   still emitted from retrieval metadata, not the model.
"""
import json
import os
import re
import urllib.request

from . import config

SYSTEM_PROMPT = (
    "You are a Kenyan public health surveillance knowledge assistant. "
    "Answer the user's question using ONLY the guideline excerpts and any "
    "live dashboard data provided — they are the authoritative sources. If "
    "the material does not contain the answer, say so plainly; never invent "
    "case definitions, thresholds, procedures or figures. Be concise and "
    "direct: give exactly what was asked (e.g. for signs and symptoms, list "
    "only the signs and symptoms — not treatment or reporting steps unless "
    "asked). "
    "Format every answer cleanly: a one-line lead-in, then bold section "
    "labels (e.g. **Symptoms**:, **Transmission**:) followed by proper "
    "sentences or bullet points. Every bullet must be a complete, "
    "well-punctuated sentence ending with a full stop — never leave a "
    "sentence or bullet unfinished. Organise related facts under one label "
    "instead of scattering them. When live dashboard data is provided, "
    "quote its figures exactly and state the 'as of' date if given; lead "
    "with the cumulative national headline figures (confirmed cases, "
    "samples tested, people screened) in one sentence, and only give "
    "county, period or status breakdowns when the user asked for them. "
    "NEVER quote numbers found in the guideline excerpts as live figures "
    "— document numbers are examples, not real data. Keep the whole "
    "answer under six short bullets or about 80 words; if space is "
    "tight, summarise rather than trail off."
)

USER_TEMPLATE = """Question: {question}
{stats_block}
Guideline excerpts:
{context}

Answer:"""

_STATS_BLOCK = """

Live dashboard data (authoritative figures — quote exactly):
{stats}"""


def _build_context(hits: list[dict], question: str = "") -> str:
    parts = []
    for h in hits:
        # Keep prompts short — focused window per chunk, not whole chunks.
        text = _focus_window(h["text"], question, 450) if question else h["text"]
        parts.append(f"[{h['doc_short']} p.{h['page']}]\n{text}")
    return "\n\n---\n\n".join(parts)


def _norm(text: str) -> str:
    """Collapse PDF line breaks/spacing into readable prose."""
    text = re.sub(r"\s*\n\s*", " ", text)
    return re.sub(r"[ \t]{2,}", " ", text).strip()


_QSTOP = {
    "what", "when", "where", "which", "whom", "whose", "does", "should",
    "would", "could", "shall", "have", "has", "been", "with", "that", "this",
    "from", "they", "them", "their", "there", "then", "than", "into", "are",
    "the", "and", "for", "who", "how", "can", "will", "about", "give",
}


def _focus_window(text: str, question: str, width: int = 700) -> str:
    """Return the window of `text` most relevant to the question.

    Finds the sentence with the highest query-term overlap and expands a
    ~`width`-char window around it, snapped to sentence boundaries.
    """
    if len(text) <= width:
        return text
    q_terms = {t for t in re.findall(r"[a-zA-Z]{3,}", question.lower())
               if t not in _QSTOP}
    sents = re.split(r"(?<=[.!?;:])\s+|\n", text)
    best_i, best_score, pos = 0, -1.0, 0
    spans = []
    for s in sents:
        spans.append((pos, pos + len(s)))
        pos += len(s) + 1
    for i, s in enumerate(sents):
        score = len(q_terms & {t.lower() for t in re.findall(r"[a-zA-Z]{3,}", s)})
        score += s.count("sign") + s.count("symptom") if "symptom" in q_terms or "signs" in q_terms else 0
        if score > best_score:
            best_score, best_i = score, i
    start, end = spans[best_i]
    half = width // 2
    w_start = max(0, start - half)
    w_end = min(len(text), w_start + width)
    w_start = max(0, w_end - width)
    # snap to boundaries
    pre = text.rfind(". ", w_start - 1, w_end - half)
    if pre != -1 and pre < w_start + half:
        w_start = pre + 2
    nxt = text.find(". ", w_end - 60, w_end + 200)
    if nxt != -1:
        w_end = nxt + 1
    snippet = text[w_start:w_end].strip()
    return ("…" if w_start > 0 else "") + snippet + ("…" if w_end < len(text) else "")


def _extractive_answer(question: str, hits: list[dict]) -> str:
    """Compose a readable answer from retrieved passages without an LLM.

    Returns only the passage windows most relevant to the question — verbatim
    text, so nothing is paraphrased or invented.
    """
    out = []
    for h in hits[:2]:
        out.append(_focus_window(_norm(h["text"]), question))
    return "\n\n".join(out)


def _stats_block(stats: dict | None) -> str:
    if stats is None:
        return ""
    return _STATS_BLOCK.format(stats=json.dumps(stats, indent=2))


def _llm_answer(question: str, hits: list[dict],
                stats: dict | None = None) -> str | None:
    payload = {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",
             "content": USER_TEMPLATE.format(
                 question=question,
                 stats_block=_stats_block(stats),
                 context=_build_context(hits, question))},
        ],
        "temperature": 0.1,
        "repeat_penalty": 1.2,
        "max_tokens": int(os.environ.get("MAX_TOKENS", "320")),
        "stream": False,
    }
    try:
        req = urllib.request.Request(
            config.LLM_URL,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=config.LLM_TIMEOUT) as r:
            data = json.loads(r.read())
            return _tidy(data["choices"][0]["message"]["content"].strip())
    except Exception:
        return None


def _tidy(text: str) -> str:
    """Trim a response so it never ends mid-sentence."""
    end = max(text.rfind(". "), text.rfind("!"), text.rfind("?"),
              text.rfind(".\n"))
    if end != -1 and len(text) - end > 12:
        text = text[:end + 1]
    return text.strip()


_GREETING_RE = re.compile(
    r"^\s*(hi|hello|hey|hola|good (morning|afternoon|evening)|jambo|habari|"
    r"how are you|what'?s up|greetings|sasa|niaje|mambo|hujambo)\b[\s!.?]*$",
    re.IGNORECASE,
)

GREETING_REPLY = (
    "Hello! Ask me anything about the surveillance guidelines, EVD dashboard "
    "indicators, or current case figures."
)


def is_greeting(text: str) -> bool:
    return bool(_GREETING_RE.match(text.strip()))


def _stats_fallback(stats: dict) -> str:
    """Readable rendering of live data when the LLM is unavailable."""
    return ("Live data from the surveillance dashboard:\n\n"
            + json.dumps(stats, indent=2))


def answer(question: str, hits: list[dict],
           stats: dict | None = None,
           stats_unavailable: bool = False) -> tuple[str, str]:
    """Returns (answer_text, mode)."""
    if stats is not None:
        if config.LLM_ENABLED:
            text = _llm_answer(question, hits, stats)
            if text:
                return text, "llm+stats"
        return _stats_fallback(stats), "stats"
    if stats_unavailable:
        return ("This question needs live figures from the surveillance "
                "dashboard, but the data plugin is not connected right now. "
                "I can still help with guideline questions — for example, "
                "case definitions, signs and symptoms, reporting steps and "
                "escalation thresholds.", "stats-unavailable")
    if not hits or hits[0]["score"] < config.MIN_SCORE:
        return ("I'm sorry, I'm unable to answer that — it isn't covered "
                "in the surveillance guidelines, EVD dashboard documents, "
                "or live dashboard data I can access. Try asking about "
                "case definitions, signs and symptoms, reporting steps, "
                "dashboard indicators, or current case figures.", "no-hit")
    if config.LLM_ENABLED:
        text = _llm_answer(question, hits)
        if text:
            return text, "llm"
    return _extractive_answer(question, hits), "extractive"
