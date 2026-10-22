"""Evaluation harness — measures retrieval + answer accuracy on gold questions.

Run:  .venv/bin/python eval.py            (uses the running service's code,
but loads its own VectorStore — no server needed)

Metrics reported:
  * Retrieval hit-rate: expected source doc+page appears in top-k citations
  * Answer accuracy:    required keyphrase groups all present in the answer
  * Latency:            mean / p50 per question

Each gold item: question, `must` = list of keyphrase groups (a group passes
if ANY alternative matches), and `doc`/`pages` = expected citation.
"""
import re
import statistics
import sys
import time

from app.generator import answer
from app.retriever import VectorStore

GOLD = [
    {
        "q": "What is the suspected case definition for Ebola?",
        "must": [["fever"],
                 ["bleed", "haemorrhag", "hemorrhag"],
                 ["contact", "dead", "sudden"]],
        "doc": "IDSR", "pages": {115, 514, 111},
    },
    {
        "q": "What are the signs and symptoms of cholera?",
        "must": [["watery"], ["diarrh"], ["dehydrat"]],
        "doc": "IDSR", "pages": set(range(90, 130)) | set(range(360, 520)),
    },
    {
        "q": "How is a suspected measles case identified?",
        "must": [["fever"], ["rash"],
                 ["cough", "coryza", "conjunctivitis", "runny"]],
        "doc": "IDSR", "pages": set(range(60, 540)),
    },
    {
        "q": "When should a public health event be escalated to the national level?",
        "must": [["county", "capacity", "spread", "international", "cross-border",
                  "level 2", "national"]],
        "doc": "DMT", "pages": set(range(30, 90)),
    },
    {
        "q": "What is the 7-1-7 target for detecting an outbreak?",
        "must": [["7", "seven"], ["detect"]],
        "doc": "DMT", "pages": set(range(1, 90)),
    },
    {
        "q": "What is the suspected case definition for Mpox?",
        "must": [["rash", "lesion", "skin"]],
        "doc": "IDSR", "pages": set(range(60, 540)),
    },
    {
        "q": "What are the signs and symptoms of anthrax?",
        "must": [["skin", "cutaneous", "sore", "eschar", "ulcer",
                  "fever", "itch"]],
        "doc": "IDSR", "pages": set(range(60, 540)),
    },
    {
        "q": "What should a health worker do when a case meets the definition of a priority disease?",
        "must": [["report", "notify", "fill", "alert"]],
        "doc": "IDSR", "pages": set(range(30, 540)),
    },
    {
        "q": "What is the suspected case definition for meningococcal meningitis?",
        "must": [["fever"], ["neck", "stiffness", "headache", "meningeal",
                            "bulging"]],
        "doc": "IDSR", "pages": set(range(60, 540)),
    },
    {
        "q": "What are the immediate response actions within 24 hours for cholera under 7-1-7?",
        "must": [["report", "notify", "investigat", "alert", "confirm",
                  "activate"]],
        "doc": "DMT", "pages": set(range(1, 90)),
    },
    {
        "q": "What is the suspected case definition for yellow fever?",
        "must": [["fever"], ["jaundice"]],
        "doc": "IDSR", "pages": set(range(60, 540)),
    },
    {
        "q": "Who is responsible for activating the incident management system during a public health emergency?",
        "must": [["county", "KNPHI", "national", "PHEOC", "ministry", "IMS"]],
        "doc": "", "pages": set(range(1, 600)),
    },
]


def _match(group: list[str], text: str) -> bool:
    t = text.lower()
    return any(re.search(re.escape(alt), t) for alt in group)


def main():
    print("Loading index…")
    store = VectorStore()
    print(f"Loaded {len(store.chunks)} chunks. Evaluating {len(GOLD)} gold questions.\n")

    r_hits = a_hits = 0
    lat = []
    rows = []
    for i, item in enumerate(GOLD, 1):
        t0 = time.time()
        hits = store.search(item["q"], k=4)
        text, mode = answer(item["q"], hits)
        dt = time.time() - t0
        lat.append(dt)

        ret_ok = any(
            (not item["doc"] or item["doc"].lower() in h["doc_short"].lower())
            and h["page"] in item["pages"]
            for h in hits
        )
        ans_ok = all(_match(g, text) for g in item["must"])
        r_hits += ret_ok
        a_hits += ans_ok
        rows.append((i, item["q"][:52], ret_ok, ans_ok, mode, dt))
        print(f"[{i:2}] {'R✓' if ret_ok else 'R✗'} {'A✓' if ans_ok else 'A✗'} "
              f"{dt:5.1f}s {mode:10} {item['q'][:60]}")

    n = len(GOLD)
    print("\n===== RESULTS =====")
    print(f"Retrieval accuracy (right doc+page in top-4): {r_hits}/{n} = {100*r_hits/n:.0f}%")
    print(f"Answer accuracy (all keypoints present):      {a_hits}/{n} = {100*a_hits/n:.0f}%")
    print(f"Mean latency: {statistics.mean(lat):.1f}s   p50: {statistics.median(lat):.1f}s")


if __name__ == "__main__":
    sys.exit(main())
