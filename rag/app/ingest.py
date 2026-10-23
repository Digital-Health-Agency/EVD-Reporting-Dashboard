"""Ingest the three official surveillance PDFs into a page-anchored chunk store.

Each chunk keeps: text, source document short-name, pdf filename, page number
and a unique chunk id — everything needed for citations.
"""
import json
import re
from dataclasses import dataclass, asdict

from pypdf import PdfReader

from . import config

DOC_META = {
    "Digital Public Health Surveillance Architecture and Roadmap.pdf": {
        "short": "DPHS-Roadmap",
        "title": "Digital Public Health Surveillance Architecture and Roadmap (KNPHI, 2026-2030)",
    },
    "IDSR Technical Guidelines for Kenya 11.05.2022_9am.pdf": {
        "short": "IDSR-TG-3ed",
        "title": "IDSR Technical Guidelines for Kenya, 3rd Edition (MoH, May 2022)",
    },
    "Decision Making Tool for Public Health Emergencies_Kenya_2025.pdf": {
        "short": "DMT-PHE-2025",
        "title": "Decision-Making Tool for Public Health Emergencies (KNPHI, 2025)",
    },
    # EVD Reporting Dashboard source documents
    "EVD Indicators.pdf": {
        "short": "EVD-Indicators",
        "title": "EVD Indicators (EVD Reporting Dashboard source document)",
    },
    "BVD-Indicators-to-be-Tracked.pdf": {
        "short": "BVD-Indicators",
        "title": "BVD Indicators to be Tracked (EVD Reporting Dashboard source document)",
    },
    "EVD Surveillance Dashboards Indicators.pdf": {
        "short": "EVD-Dashboard-Indicators",
        "title": "EVD Surveillance Dashboards Indicators (EVD Reporting Dashboard source document)",
    },
    "EVD dataset.pdf": {
        "short": "EVD-Dataset",
        "title": "EVD Dataset (EVD Reporting Dashboard source document)",
    },
    "Ebola_Surveillance_Dashboard_Developer_Implementation_Guide.pdf": {
        "short": "EVD-Impl-Guide",
        "title": "Ebola Surveillance Dashboard Developer Implementation Guide",
    },
    "NDL_EVD_Bronze_Silver_Marts_Gold_Mapping.xlsx.pdf": {
        "short": "EVD-Marts-Mapping",
        "title": "NDL EVD Bronze/Silver Marts to Gold Mapping",
    },
}


def _clean(text: str) -> str:
    text = re.sub(r"[\ud800-\udfff]", " ", text)  # strip surrogate chars
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


@dataclass
class Chunk:
    id: str
    text: str
    doc_short: str
    doc_title: str
    pdf_file: str
    page: int


def chunk_page(text: str, size: int, overlap: int):
    """Split page text into overlapping chunks on paragraph/sentence bounds."""
    if len(text) <= size:
        yield text
        return
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        if end < len(text):
            # prefer to break at paragraph, then sentence, then space
            window = text[start:end]
            cut = max(window.rfind("\n\n"), window.rfind(". "), window.rfind(" "))
            if cut > size // 2:
                end = start + cut + 1
        yield text[start:end].strip()
        start = end - overlap if end - overlap > start else end


def ingest() -> list[Chunk]:
    chunks: list[Chunk] = []
    for pdf_name, meta in DOC_META.items():
        path = config.PDF_DIR / pdf_name
        reader = PdfReader(str(path))
        for i, page in enumerate(reader.pages, start=1):
            raw = _clean(page.extract_text() or "")
            if len(raw) < 40:  # skip near-empty / image-only pages
                continue
            for j, piece in enumerate(chunk_page(raw, config.CHUNK_SIZE, config.CHUNK_OVERLAP)):
                chunks.append(Chunk(
                    id=f"{meta['short']}:{i}:{j}",
                    text=piece,
                    doc_short=meta["short"],
                    doc_title=meta["title"],
                    pdf_file=pdf_name,
                    page=i,
                ))
    return chunks


def main():
    config.STORE_DIR.mkdir(parents=True, exist_ok=True)
    chunks = ingest()
    out = config.STORE_DIR / "chunks.jsonl"
    with out.open("w", encoding="utf-8") as f:
        for c in chunks:
            f.write(json.dumps(asdict(c), ensure_ascii=False) + "\n")
    print(f"Wrote {len(chunks)} chunks to {out}")


if __name__ == "__main__":
    main()
