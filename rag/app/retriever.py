"""Embedding + FAISS retrieval over the chunk store.

Falls back to a numpy cosine index if faiss is unavailable (e.g. no wheel for
the local Python version).
"""
import json
import re

import numpy as np

from . import config

_STOPWORDS = {
    "what", "when", "where", "which", "whom", "whose", "does", "should",
    "would", "could", "shall", "have", "has", "been", "with", "that", "this",
    "from", "they", "them", "their", "there", "then", "than", "into", "are",
    "the", "and", "for", "who", "how", "can", "will", "about", "case",
    "public", "health", "disease", "event",
}

try:
    import faiss  # type: ignore
    _HAS_FAISS = True
except Exception:
    _HAS_FAISS = False

_model = None


def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(config.EMBEDDING_MODEL)
    return _model


def load_chunks() -> list[dict]:
    path = config.STORE_DIR / "chunks.jsonl"
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]


class VectorStore:
    def __init__(self):
        self.chunks = load_chunks()
        self.embeddings = self._load_or_encode()
        if _HAS_FAISS:
            self.index = faiss.IndexFlatIP(self.embeddings.shape[1])
            self.index.add(self.embeddings)
        else:
            self.index = None

    def _load_or_encode(self) -> np.ndarray:
        """Reuse the embeddings baked into the image at build time; only
        re-encode when the cache is missing or stale (chunk-count or
        content mismatch)."""
        emb_path = config.STORE_DIR / "embeddings.npy"
        sig_path = config.STORE_DIR / "corpus.sig"
        import hashlib
        sig = hashlib.sha1(
            "|".join(c["text"][:40] for c in self.chunks).encode()
        ).hexdigest()
        if emb_path.exists() and sig_path.exists() \
                and sig_path.read_text().strip() == sig:
            emb = np.load(emb_path)
            if emb.shape[0] == len(self.chunks):
                return emb.astype("float32")
        model = get_model()
        texts = [c["text"] for c in self.chunks]
        emb = np.asarray(
            model.encode(texts, batch_size=64, show_progress_bar=True,
                         normalize_embeddings=True),
            dtype="float32",
        )
        np.save(emb_path, emb)
        sig_path.write_text(sig)
        return emb

    def search(self, query: str, k: int = config.TOP_K) -> list[dict]:
        model = get_model()
        q = np.asarray(model.encode(
            [query], normalize_embeddings=True), dtype="float32")
        pool = k * 4
        if self.index is not None:
            scores, idx = self.index.search(q, pool)
            pairs = [(int(i), float(s))
                     for i, s in zip(idx[0], scores[0]) if i >= 0]
        else:
            sims = (self.embeddings @ q[0])
            idx = np.argsort(-sims)[:pool]
            pairs = [(int(i), float(sims[i])) for i in idx]

        # Lexical rerank: boost chunks whose vocabulary actually covers the
        # question's content words (semantic similarity alone over-fetches
        # related-but-wrong passages, e.g. treatment vs signs/symptoms).
        q_terms = {t for t in re.findall(r"[a-zA-Z]{4,}", query.lower())
                   if t not in _STOPWORDS}
        ql = query.lower()
        wants_signs = any(w in ql for w in (
            "sign", "symptom", "look like", "present"))
        wants_def = any(w in ql for w in (
            "definition", "suspected", "identif", "diagnos"))
        # disease/topic entities in the query (multi-word or capitalized terms)
        entities = [t for t in re.findall(r"[a-zA-Z]{4,}", ql) if t not in _STOPWORDS
                    and t not in ("signs", "symptoms", "sign", "symptom",
                                  "definition", "suspected", "confirmed")]
        results = []
        for i, score in pairs:
            c = dict(self.chunks[i])
            low = c["text"].lower()
            c_terms = set(re.findall(r"[a-zA-Z]{4,}", low))
            overlap = len(q_terms & c_terms) / max(len(q_terms), 1)
            bonus = 0.15 * overlap
            # Intent boost: definition/clinical-presentation language
            if wants_signs or wants_def:
                # Proximity bonus: an entity mentioned within ~250 chars of
                # definition/symptom language is almost certainly the
                # disease's case-definition or clinical-description card.
                for ent in entities:
                    for m in re.finditer(re.escape(ent), low):
                        win = low[max(0, m.start() - 250): m.end() + 250]
                        if re.search(r"(case definition|suspected case|confirmed case|"
                                     r"signs? (and|or) symptoms|characterized|"
                                     r"presents with|clinical features)", win):
                            bonus += 0.10
                            break
                    else:
                        continue
                    break
            # Form/template penalty: data-capture forms and annex templates
            # answer "what fields to fill", not clinical questions
            if not re.search(r"\b(form|template|field|fill)\b", ql):
                if re.search(r"(ddmm|yyyy|annex \d|reporting form|investigation form|"
                             r"line listing form)", low):
                    bonus -= 0.08
            c["score"] = round(score + bonus, 4)
            results.append(c)
        results.sort(key=lambda c: -c["score"])
        return results[:k]
