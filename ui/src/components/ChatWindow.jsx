/**
 * Chat window component
 */

import { useState } from "react";
import MessageBubble from "./MessageBubble.jsx";
import { useLiveTimer } from "../hooks/useLiveTimer.js";

function AttemptMeta({ attempt, attemptIndex }) {
  const isRunning = attempt.status === "running";
  const elapsed = useLiveTimer(attempt.start, isRunning);
  const displayTime = isRunning ? elapsed : (attempt.elapsed || 0);

  return (
    <div key={attemptIndex} style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span className="meta-text">
        {`Model: ${attempt.model} — ${displayTime}s`}
      </span>
      {isRunning ? <span className="spinner" aria-hidden="true" /> : null}
      <span className="model-pill">{attempt.model}</span>
      {attempt.status === "timed_out" ? (
        <span style={{ marginLeft: 8, color: "#b91c1c", fontWeight: 600 }}>
          timed out
        </span>
      ) : null}
      {attempt.status === "cancelled" ? (
        <span style={{ marginLeft: 8, color: "#64748b", fontWeight: 600 }}>
          cancelled
        </span>
      ) : null}
    </div>
  );
}

export default function ChatWindow({ messages, ellipsis, chatRef }) {
  return (
    <div ref={chatRef} className="chat-window">
      {messages.length === 0 && (
        <div className="chat-empty" style={{ color: "#64748b" }}>
          No messages yet — ask something!
        </div>
      )}
      {messages.map((m, idx) => (
        <div key={m.meta?._id || `${idx}-${m.meta?._version||0}`} className={`message ${m.role === "user" ? "user" : "assistant"}`}>
          {m.role === "assistant" && m.meta && (
            <div className="message-meta">
              {(m.meta.attempts || []).map((a, ai) => (
                <AttemptMeta key={ai} attempt={a} attemptIndex={ai} />
              ))}
            </div>
          )}
          <MessageBubble message={m} ellipsis={ellipsis} />
        </div>
      ))}
    </div>
  );
}

