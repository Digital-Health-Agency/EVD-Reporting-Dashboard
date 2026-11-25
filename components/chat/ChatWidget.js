"use client";

import { useEffect, useRef, useState } from "react";

function renderAnswer(text) {
  return text.split("\n").map((line, i) => (
    <p key={i}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={j}>{part.slice(2, -2)}</strong>
        ) : (
          part
        )
      )}
    </p>
  ));
}

const WELCOME = {
  role: "assistant",
  answer:
    "Hello! Ask me about the surveillance guidelines, EVD indicators, " +
    "or live dashboard figures.",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  async function send(event) {
    event.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", answer: question }]);
    setBusy(true);
    try {
      const response = await fetch("/api/rag/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            answer:
              payload?.message ||
              "Something went wrong getting an answer. Please try again.",
          },
        ]);
      } else {
        setMessages((current) => [
          ...current,
          { role: "assistant", answer: payload.answer },
        ]);
      }
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", answer: "Could not reach the assistant. Please try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open ? (
        <aside className="chat-panel" aria-label="Surveillance assistant">
          <header className="chat-panel__header">
            <div>
              <p className="chat-panel__title">Surveillance Assistant</p>
              <p className="chat-panel__subtitle">Guidelines &amp; live dashboard figures</p>
            </div>
            <button
              type="button"
              className="chat-panel__close"
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </header>

          <div className="chat-panel__messages" ref={scrollRef}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`chat-bubble chat-bubble--${message.role}`}
              >
                <div className="chat-bubble__text">{renderAnswer(message.answer)}</div>
              </div>
            ))}
            {busy ? <div className="chat-bubble chat-bubble--assistant chat-bubble--typing">Thinking…</div> : null}
          </div>

          <form className="chat-panel__form" onSubmit={send}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about indicators or live figures…"
              aria-label="Ask the surveillance assistant"
            />
            <button type="submit" className="btn btn--primary" disabled={busy || !input.trim()}>
              Send
            </button>
          </form>
        </aside>
      ) : null}

      <button
        type="button"
        className={`chat-fab${open ? " chat-fab--hidden" : ""}`}
        aria-label={open ? "Close assistant" : "Open surveillance assistant"}
        aria-expanded={open}
        aria-hidden={open}
        tabIndex={open ? -1 : 0}
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </>
  );
}
