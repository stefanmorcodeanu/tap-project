import { useEffect, useMemo, useState } from "react";
import { useConfig } from "./hooks/useConfig.js";
import { useChat } from "./hooks/useChat.js";
import { useToast } from "./hooks/useToast.js";
import { useEllipsis } from "./hooks/useEllipsis.js";
import { useAutoScroll } from "./hooks/useAutoScroll.js";
import { buildOptions } from "./utils/api.js";
import { FALLBACK_CONFIG } from "./utils/constants.js";
import ModelSelector from "./components/ModelSelector.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import PromptInput from "./components/PromptInput.jsx";
import Toast from "./components/Toast.jsx";

function App() {
  const { config, status, error } = useConfig();
  const { toast, showToast } = useToast();
  const [selected, setSelected] = useState(FALLBACK_CONFIG.defaultRoute);

  const {
    prompt,
    setPrompt,
    messages,
    timeoutFast,
    setTimeoutFast,
    timeoutSlow,
    setTimeoutSlow,
    sending,
    sendError,
    chatRef,
    currentStartTimeRef,
    handleSelect: chatHandleSelect,
    handleSubmit,
    handleStop,
    handleClear,
  } = useChat(config, selected, showToast);

  // Update selected when config loads
  useEffect(() => {
    if (status === "ready" && config.defaultRoute) {
      setSelected(config.defaultRoute);
    }
  }, [status, config.defaultRoute]);

  const options = useMemo(() => buildOptions(config), [config]);

  const selectedModelName = useMemo(() => {
    if (selected === config.fast.route) return config.fast.name;
    if (selected === config.slow.route) return config.slow.name;
    return `Auto (switches between ${config.fast.name} and ${config.slow.name})`;
  }, [selected, config]);

  const { ellipsis } = useEllipsis(messages, currentStartTimeRef);

  // Auto-scroll chat to bottom when messages change (declarative)
  useAutoScroll(chatRef, [messages]);

  const handleSelect = (route) => {
    if (route === selected) return;
    handleClear();
    setSelected(route);
    chatHandleSelect(route);
  };

  return (
    <div className="page">
      <main className="card">
        <header>
          <p className="eyebrow">Model selector</p>
          <h1>Pick the right model for your request</h1>
          <p className="hint">
            Default route is <strong>{config.defaultRoute.toUpperCase()}</strong>. Choose a slower
            or faster model if you know which one you need.
          </p>
        </header>

        {status === "error" && (
          <div className="banner error">
            <strong>Could not load config:</strong> {error}. Using fallback values.
          </div>
        )}

        <ModelSelector
          config={config}
          selected={selected}
          onSelect={handleSelect}
          options={options}
        />

        <section className="selection">
          <p>
            Selected route: <strong>{selected.toUpperCase()}</strong>
          </p>
          <p>
            Model name: <strong>{selectedModelName}</strong>
          </p>
          <div className="timeout-controls" style={{ marginTop: 12 }}>
            <div className="timeout-card">
              <div className="timeout-card-title">
                {config.fast.name} timeout (seconds)
              </div>
              <input
                className="timeout-input"
                type="number"
                min={1}
                value={timeoutFast}
                onChange={(e) => setTimeoutFast(Number(e.target.value || 60))}
              />
            </div>
            <div className="timeout-card">
              <div className="timeout-card-title">
                {config.slow.name} timeout (seconds)
              </div>
              <input
                className="timeout-input"
                type="number"
                min={1}
                value={timeoutSlow}
                onChange={(e) => setTimeoutSlow(Number(e.target.value || 90))}
              />
            </div>
          </div>
        </section>

        <section className="prompt" style={{ marginTop: 16 }}>
          <ChatWindow messages={messages} ellipsis={ellipsis} chatRef={chatRef} />
          <PromptInput
            prompt={prompt}
            setPrompt={setPrompt}
            sending={sending}
            sendError={sendError}
            onSubmit={handleSubmit}
            onStop={handleStop}
            onClear={handleClear}
          />
        </section>

        <Toast message={toast} />
      </main>
    </div>
  );
}

export default App;
