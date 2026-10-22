export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RAG_URL = (process.env.RAG_URL || "http://localhost:8300").replace(/\/$/, "");

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid request body" }, { status: 400 });
  }

  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) {
    return Response.json({ message: "Question is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`${RAG_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, top_k: body.top_k }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) {
      return Response.json(
        { message: `Assistant request failed (HTTP ${response.status})` },
        { status: 502 }
      );
    }
    return Response.json(await response.json());
  } catch {
    return Response.json(
      { message: "The surveillance assistant is offline. Please try again shortly." },
      { status: 503 }
    );
  }
}
