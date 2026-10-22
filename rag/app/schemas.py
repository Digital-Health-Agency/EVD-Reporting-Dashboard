from pydantic import BaseModel


class Citation(BaseModel):
    doc_short: str
    doc_title: str
    page: int
    score: float
    snippet: str


class ChatRequest(BaseModel):
    question: str
    top_k: int | None = None


class ChatResponse(BaseModel):
    answer: str
    mode: str
    citations: list[Citation]
    disclaimer: str
