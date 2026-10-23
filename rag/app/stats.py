"""Live surveillance-data connector — plugs into the UHAI dashboard.

The chatbot remains a knowledge assistant grounded in the three guideline
documents, but questions asking for live figures ("how many confirmed Ebola
cases are there right now?") are answered from the dashboard's data plugin
instead of the documents.

Plugin contract — the dashboard exposes one HTTP GET endpoint:

    {UHAI_STATS_URL}?disease=<slug>&status=<status>&county=<name>&period=<period>

Any JSON it returns is treated as authoritative and passed verbatim into the
answer prompt — the model may quote figures but never invent them. Example
shape (not mandatory — the raw payload is forwarded as-is):

    {"disease": "ebola", "status": "confirmed", "period": "current",
     "count": 3, "counties": {"Mandera": 2, "Nairobi": 1},
     "as_of": "2026-10-22"}
"""
import json
import re
import urllib.parse
import urllib.request

from . import config

# Question words that signal a request for live figures rather than guidance.
_STATS_RE = re.compile(
    r"\b(how many|number of|count of|total|currently|right now|so far|"
    r"as of|latest|current(ly)? (case|cases|outbreak|reported)|"
    r"reported (case|cases|deaths)|active cases|death toll|statistics|"
    r"figures|tally|samples tested|tests conducted|screened|screening(s)?|"
    r"contacts (listed|under follow.?up)|alerts?|recoveries|"
    r"case fatality|cfr|metrics?|on the dashboard|situation update)\b",
    re.IGNORECASE,
)

_STATUS = {
    "confirmed": "confirmed",
    "suspected": "suspected",
    "probable": "probable",
    "suspect": "suspected",
    "deaths": "deaths",
    "death": "deaths",
    "died": "deaths",
    "fatalities": "deaths",
    "recovered": "recovered",
    "recoveries": "recovered",
}

# Canonical disease slugs the plugin is expected to understand.
_DISEASES = {
    "ebola": "ebola", "marburg": "marburg", "cholera": "cholera",
    "measles": "measles", "rubella": "rubella", "mpox": "mpox",
    "monkeypox": "mpox", "dengue": "dengue", "anthrax": "anthrax",
    "plague": "plague", "rabies": "rabies", "polio": "polio",
    "poliomyelitis": "polio", "yellow fever": "yellow-fever",
    "rift valley": "rift-valley-fever", "rvf": "rift-valley-fever",
    "lassa": "lassa-fever", "typhoid": "typhoid", "meningitis": "meningitis",
    "chikungunya": "chikungunya", "malaria": "malaria", "zika": "zika",
    "sars": "sars", "influenza": "influenza", "kala-azar": "kala-azar",
    "leishmaniasis": "kala-azar", "guinea worm": "dracunculiasis",
    "dracunculiasis": "dracunculiasis", "leprosy": "leprosy",
    "schistosomiasis": "schistosomiasis", "trachoma": "trachoma",
    "onchocerciasis": "onchocerciasis", "tetanus": "tetanus",
    "tuberculosis": "tuberculosis", "tb": "tuberculosis",
}

_COUNTY_RE = re.compile(
    r"\bin\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+county\b|"
    r"\b(Nairobi|Mombasa|Kisumu|Nakuru|Uasin Gishu|Kiambu|Machakos|Kajiado|"
    r"Mandera|Wajir|Garissa|Turkana|Marsabit|Isiolo|Meru|Embu|Tharaka|Kitui|"
    r"Makueni|Nyandarua|Nyeri|Kirinyaga|Murang'a|Laikipia|Samburu|"
    r"Trans[- ]Nzoia|Elgeyo|Nandi|Baringo|Kericho|Bomet|Kakamega|Vihiga|"
    r"Bungoma|Busia|Siaya|Homa Bay|Migori|Kisii|Nyamira|Narok|Taita|Kwale|"
    r"Kilifi|Tana River|Lamu|West Pokot)\b",
    re.IGNORECASE,
)


def is_stats_query(question: str) -> bool:
    """True when the question asks for live figures/counts, not guidance."""
    return bool(_STATS_RE.search(question))


def extract_params(question: str) -> dict:
    """Pull disease / status / county / period out of the question."""
    q = question.lower()
    params: dict[str, str] = {}

    for name, slug in _DISEASES.items():
        if name in q:
            params["disease"] = slug
            break

    for word, status in _STATUS.items():
        if re.search(rf"\b{word}\b", q):
            params["status"] = status
            break

    m = _COUNTY_RE.search(question)
    if m:
        params["county"] = (m.group(1) or m.group(2)).strip()

    if re.search(r"\b(today|right now|currently|current|latest|as of)\b", q):
        params["period"] = "current"
    elif "this week" in q:
        params["period"] = "this-week"
    elif "this month" in q:
        params["period"] = "this-month"
    elif "this year" in q:
        params["period"] = "this-year"

    return params


def fetch_stats(params: dict) -> dict | None:
    """Call the UHAI dashboard stats plugin. Returns parsed JSON or None."""
    if not config.UHAI_STATS_URL:
        return None
    url = f"{config.UHAI_STATS_URL}?{urllib.parse.urlencode(params)}"
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=config.STATS_TIMEOUT) as r:
            return json.loads(r.read())
    except Exception:
        return None


def _fnum(x) -> str:
    return f"{x:,}" if isinstance(x, (int, float)) else "—"


def _pct(part, whole) -> str:
    try:
        if not whole:
            return "—"
        return f"{part / whole * 100:.1f}%"
    except Exception:
        return "—"


def format_answer(question: str, payload: dict) -> str:
    """Compose a short, accurate answer from the live metrics payload.

    Deterministic — every number comes straight from the API, so the
    response can never hallucinate. Leads with whatever the question asked
    for, then the cumulative national headline figures.
    """
    q = question.lower()
    m = payload.get("metrics", {}) or {}
    cases = m.get("cases", {}) or {}
    labs = m.get("labs", {}) or {}
    poe = m.get("poe", {}) or {}
    geo = m.get("geography", {}) or {}
    as_of = payload.get("as_of") or m.get("meta", {}).get("lastUpdated", "")
    as_of = str(as_of)[:10]

    confirmed = cases.get("confirmed")
    suspected = cases.get("suspected")
    total = cases.get("totalCases")
    deaths = cases.get("deaths")
    tested = labs.get("testsDone")
    screened = poe.get("totalScreened")
    alerts = poe.get("alerts")

    headline = (
        f"As of {as_of}: {_fnum(confirmed)} confirmed, "
        f"{_fnum(suspected)} suspected ({_fnum(total)} total cases), "
        f"{_fnum(deaths)} deaths, {_fnum(tested)} lab samples tested, "
        f"{_fnum(screened)} people screened at points of entry "
        f"({_fnum(alerts)} screening alerts)."
    )

    leads = []
    if re.search(r"\b(fatality|cfr|death rate|mortality)\b", q):
        leads.append(
            f"**Case fatality rate:** {_pct(deaths, confirmed)} "
            f"({_fnum(deaths)} death{'s' if deaths != 1 else ''} out of "
            f"{_fnum(confirmed)} confirmed cases).")
    if re.search(r"\bconfirmed\b", q) and not leads:
        leads.append(f"**Confirmed cases:** {_fnum(confirmed)}.")
    if re.search(r"\b(sample|samples|tested|tests|lab|laborator)\w*\b", q):
        leads.append(
            f"**Samples tested:** {_fnum(tested)} "
            f"({_fnum(labs.get('positive'))} positive, "
            f"{_pct(labs.get('positive'), tested)} positivity).")
    if re.search(r"\bscreen(ed|ing|ings)\b", q):
        leads.append(
            f"**Screened at points of entry:** {_fnum(screened)} "
            f"({_fnum(alerts)} alerts triggered).")
    if re.search(r"\bdeaths?\b|died|fatalit", q) and not leads:
        leads.append(f"**Deaths:** {_fnum(deaths)}.")

    cm = _COUNTY_RE.search(question)
    if cm and geo.get("byCounty"):
        name = (cm.group(1) or cm.group(2)).lower()
        for row in geo["byCounty"]:
            if row.get("county", "").lower() == name:
                leads.insert(0,
                    f"**{row['county'].title()} County:** "
                    f"{_fnum(row.get('totalCases'))} total cases, "
                    f"{_fnum(row.get('confirmed'))} confirmed, "
                    f"{_fnum(row.get('deaths'))} deaths.")
                break

    lines = leads if leads else []
    lines.append(f"**National totals** — {headline}")
    return "\n".join(lines)
