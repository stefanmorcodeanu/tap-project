/**
 * Message bubble component
 */

import { useLiveTimer } from "../hooks/useLiveTimer.js";
import { sanitizeSimple } from "../utils/sanitization.js";

function formatTimingLabel(meta) {
  if (!meta) return null;

  const attempts = Array.isArray(meta.attempts) ? meta.attempts : [];
  const successAttempt = attempts.find((a) => a.status === "success");
  const runningAttempt = attempts.find((a) => a.status === "running");
  const fallbackAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;
  const attempt = successAttempt || runningAttempt || fallbackAttempt;
  // Prefer explicit model name from attempt, then meta.model, then route
  let modelName = attempt?.model || meta.model || (meta.route ? String(meta.route) : null);

  // Normalize modelName to string if present
  if (modelName && typeof modelName !== "string") modelName = String(modelName);

  // Determine elapsed seconds: prefer first_byte_elapsed, then attempt.elapsed, then meta.latency_ms
  let elapsedSeconds = null;
  if (attempt && typeof attempt.first_byte_elapsed === "number" && !Number.isNaN(attempt.first_byte_elapsed)) {
    elapsedSeconds = attempt.first_byte_elapsed;
  } else if (attempt && typeof attempt.elapsed === "number" && !Number.isNaN(attempt.elapsed)) {
    elapsedSeconds = attempt.elapsed;
  } else if (typeof meta.latency_ms === "number" && !Number.isNaN(meta.latency_ms)) {
    elapsedSeconds = Math.floor(meta.latency_ms / 1000);
  }

  if (!modelName) return null;

  // If we have elapsed seconds, show it; otherwise show model name alone so user always sees which model responded
  if (typeof elapsedSeconds === "number" && !Number.isNaN(elapsedSeconds)) {
    return `[${modelName}] ${elapsedSeconds}s`;
  }

  return `[${modelName}]`;
}

function getFirstByteSeconds(meta) {
  if (!meta) return null;
  const attempts = Array.isArray(meta.attempts) ? meta.attempts : [];
  const runningAttempt = attempts.find((a) => a.status === "running");
  const successAttempt = attempts.find((a) => a.status === "success");
  const fallbackAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;
  const attempt = runningAttempt || successAttempt || fallbackAttempt;
  if (!attempt) return null;
  if (typeof attempt.first_byte_elapsed === "number" && !Number.isNaN(attempt.first_byte_elapsed)) {
    return attempt.first_byte_elapsed;
  }
  return null;
}

export default function MessageBubble({ message, ellipsis }) {
  if (message.role === "user") {
    const userText =
      typeof message.text === "string" ? message.text : String(message.text ?? "");
    return <div className="message-bubble">{userText}</div>;
  }

  const timingLabel = formatTimingLabel(message.meta);

  if (message.html) {
    return (
      <div className="message-bubble">
        <div dangerouslySetInnerHTML={{ __html: message.html }} />
        {timingLabel ? (
          <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>{timingLabel}</div>
        ) : null}
      </div>
    );
  }

  if (message.meta && (message.meta.streamedPlain || message.meta.streaming)) {
    const runningAttempt = message.meta.attempts?.find((a) => a.status === "running");
    const isStreaming = message.meta.streaming;
    const isCancelled = message.meta.cancelled;
    const isTimedOut = message.meta.timed_out;
    const hasActiveAttempt = runningAttempt && runningAttempt.status === "running";
    const timerActive = hasActiveAttempt || (isStreaming && !isCancelled && !isTimedOut);
    const timerStartTime = runningAttempt?.start || message.meta.startTime || Date.now();
    const elapsed = useLiveTimer(timerStartTime, timerActive);
    const hasStreamedText = Boolean(message.text && String(message.text).trim() !== "");

    if (hasStreamedText) {
      const safeHtml = sanitizeSimple(String(message.text || ""));
      return (
        <div className="message-bubble">
          <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
          {timingLabel ? (
            <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>{timingLabel}</div>
          ) : null}
        </div>
      );
    }

    let statusMessage = null;
    if (isCancelled) {
      statusMessage = (
        <div className="responding-line" style={{ color: "#64748b", fontWeight: 600 }}>
          Request cancelled
        </div>
      );
    } else if (hasActiveAttempt || (isStreaming && !isTimedOut)) {
      const fb = getFirstByteSeconds(message.meta);
      statusMessage = (
        <div className="responding-line">
          {`${message.meta.model} model is responding... `}
          {fb !== null ? (
            <span style={{ fontWeight: 700, color: "#0ea5e9" }}>({fb}s)</span>
          ) : (
            <span style={{ fontWeight: 700, color: "#0ea5e9" }}>({elapsed}s)</span>
          )}
        </div>
      );
    } else if (isTimedOut) {
      statusMessage = (
        <div className="responding-line" style={{ color: "#b91c1c", fontWeight: 600 }}>
          Request timed out
        </div>
      );
    }

    return (
      <div className="message-bubble">
        {statusMessage}
        {isStreaming && !isCancelled && !isTimedOut ? <span className="ellipsis"> {ellipsis}</span> : null}
      </div>
    );
  }

  const fallbackHtml = sanitizeSimple(String(message.text || ""));
  return (
    <div className="message-bubble">
      <div dangerouslySetInnerHTML={{ __html: fallbackHtml }} />
      {timingLabel ? (
        <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>{timingLabel}</div>
      ) : null}
    </div>
  );
}
