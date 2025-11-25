/**
 * Prompt input component
 */

export default function PromptInput({
  prompt,
  setPrompt,
  sending,
  sendError,
  onSubmit,
  onStop,
  onClear,
}) {
  const sanitizePrompt = () => {
    if (typeof prompt === "string") return prompt;
    if (prompt === null || prompt === undefined) return "";
    return String(prompt);
  };

  const submitCurrentPrompt = (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    onSubmit(sanitizePrompt());
  };

  const handleKeyDown = (e) => {
    // Send on Enter (without Shift). Shift+Enter for newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitCurrentPrompt();
    }
  };

  return (
    <>
      <form onSubmit={submitCurrentPrompt} style={{ marginTop: 12 }}>
        <label style={{ display: "block", marginBottom: 8 }}>Ask a question</label>
        <textarea
          className="prompt-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={8}
          placeholder="Type your prompt here..."
        />

        <div className="controls">
          {sending ? (
            <button type="button" onClick={onStop} className="btn stop">
              Stop
            </button>
          ) : (
            <button type="submit" disabled={sending} className="btn send">
              Send
            </button>
          )}
          <button type="button" onClick={onClear} className="btn clear">
            Clear
          </button>
        </div>
      </form>

      {sendError && (
        <div style={{ marginTop: 12 }} className="banner error">
          Error: {sendError}
        </div>
      )}
    </>
  );
}
