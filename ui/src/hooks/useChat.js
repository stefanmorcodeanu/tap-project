/**
 * Custom hook for managing chat state and streaming
 * Uses useReducer for complex state management
 */

import { useReducer, useRef, useCallback } from "react";
import { API_BASE_URL, DEFAULT_TIMEOUT_FAST, DEFAULT_TIMEOUT_SLOW } from "../utils/constants.js";
import { sanitizeSimple } from "../utils/sanitization.js";
import { escapeRegExp, removeTrailingModelName, buildRoutes } from "../utils/stringUtils.js";
import { chatReducer, chatActions, initialState } from "./chatReducerClean.js";

export function useChat(config, selected, showToast) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const chatRef = useRef(null);
  const currentController = useRef(null);
  const currentAssistantIndex = useRef(-1);
  const currentStartTimeRef = useRef(null);
  const userCancelled = useRef(false);
  const autoTimeoutId = useRef(null);
  const autoTimedOut = useRef(false);
  const anyAutoTimedOut = useRef(false);

  // Helper to update a specific message using reducer. "target" can be a numeric index or a message id string.
  const updateMessage = useCallback(
    (target, updater) => {
      try {
        if (typeof target === "number") {
          dispatch({ type: chatActions.UPDATE_MESSAGE, payload: { index: target, updater } });
        } else {
          dispatch({ type: chatActions.UPDATE_MESSAGE, payload: { id: target, updater } });
        }
      } catch (e) {}
    },
    [dispatch]
  );
  const clearAutoTimeout = useCallback(() => {
    try {
      if (autoTimeoutId.current) {
        clearTimeout(autoTimeoutId.current);
        autoTimeoutId.current = null;
      }
    } catch (e) {}
  }, []);

  const handleSelect = useCallback(
    (v) => {
      try {
        // If the selection actually changed, clear prompt and chat and abort any running request
        if (v !== selected) {
          // abort any in-flight request
          try {
            currentController.current?.abort?.();
          } catch (e) {}

          // clear UI state: prompt and messages
          dispatch({ type: chatActions.SET_PROMPT, payload: "" });
          dispatch({ type: chatActions.CLEAR_MESSAGES });
          dispatch({ type: chatActions.SET_SENDING, payload: false });
        }
      } catch (e) {}
    },
    [selected]
  );
  // Submit handler: send prompt and stream responses
  const handleSubmit = useCallback(async (rawInput) => {
      const promptText =
        typeof rawInput === "string"
          ? rawInput.trim()
          : typeof rawInput?.target?.value === "string"
          ? rawInput.target.value.trim()
          : "";

      if (!promptText) {
        dispatch({ type: chatActions.SET_PROMPT, payload: "" });
        return;
      }

      dispatch({ type: chatActions.SET_SEND_ERROR, payload: "" });
      dispatch({ type: chatActions.SET_SENDING, payload: true });
      const routes = buildRoutes(selected, config);
      const routesLength = routes.length;
      // Set initial model name based on first route
      const initialModelName =
        routes[0] === config.fast.route ? config.fast.name : config.slow.name;
      const initialStartTime = Date.now();
      
      const assistantId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

      const assistantMessage = {
        role: "assistant",
        text: "",
        meta: {
          _id: assistantId,
          route: routes[0],
          model: initialModelName,
          latency_ms: null,
          streaming: true,
          streamedPlain: true,
          attempts: [],
          startTime: initialStartTime, // Store start time for timer
        },
      };

      dispatch({
        type: chatActions.SET_MESSAGES,
        payload: (prev) => {
          const next = [...prev, { role: "user", text: promptText }, assistantMessage];
          const assistantIndex = next.length - 1;
          currentAssistantIndex.current = assistantIndex;
          try {
            console.info(`[useChat] created assistant message id=${assistantId} at index=${assistantIndex}`);
          } catch (e) {}
          return next;
        },
      });
      dispatch({ type: chatActions.SET_PROMPT, payload: "" });

      // Use the ref value set in dispatch (reducer is synchronous)
      const assistantIndex = currentAssistantIndex.current;
      const assistantIdLocal = assistantId;

      let succeeded = false;

      for (let attemptIndex = 0; attemptIndex < routes.length; attemptIndex++) {
        const route = routes[attemptIndex];
        const expectedModelName =
          route === config.fast.route ? config.fast.name : config.slow.name;

        // Update assistant placeholder for new attempt
        // Reset any previous timeout/cancellation states
        const attemptStartTime = Date.now();
        updateMessage(assistantIdLocal, (m) => {
          // attempt started
          const meta = { ...(m.meta || {}) };
          const attempts = Array.isArray(meta.attempts) ? meta.attempts.slice() : [];
          attempts[attemptIndex] = {
            model: expectedModelName,
            start: attemptStartTime,
            elapsed: 0,
            status: "running",
          };
          meta.attempts = attempts;
          meta.model = expectedModelName;
          meta.streaming = true; // Reset streaming state for new attempt
          meta.streamedPlain = true;
          meta.startTime = attemptStartTime; // Reset start time for new timer
          meta.timed_out = false; // Clear timeout flag
          meta.cancelled = false; // Clear cancelled flag
          return { ...m, meta };
        });

        const controller = new AbortController();
        currentController.current = controller;
        userCancelled.current = false;
        autoTimedOut.current = false;
        currentStartTimeRef.current = Date.now();

        // Set timeout
        const timeoutSeconds =
          route === config.fast.route
            ? Number(state.timeoutFast || DEFAULT_TIMEOUT_FAST)
            : Number(state.timeoutSlow || DEFAULT_TIMEOUT_SLOW);
        const timeoutMs = Math.max(1, timeoutSeconds) * 1000;

        clearAutoTimeout();
        autoTimeoutId.current = setTimeout(() => {
          try {
            autoTimedOut.current = true;
            controller.abort();
          } catch (e) {}
        }, timeoutMs);

        try {
          const res = await fetch(`${API_BASE_URL}/ai-service/${route}/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: promptText }),
            signal: controller.signal,
          });

          if (!res.ok || !res.body) {
            const text = await res.text();
            throw new Error(`Request failed (${res.status}): ${text}`);
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          const start = Date.now();
          // Track first-chunk time (time-to-first-byte) for this attempt
          let firstChunkSeen = false;
          let firstChunkElapsed = null;

          // Stream loop
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            try {
              // chunk received
            } catch (e) {}
            // If this is the first non-empty chunk, record elapsed seconds since attempt start
            try {
              if (!firstChunkSeen && chunk && String(chunk).trim() !== "") {
                firstChunkSeen = true;
                const t = Date.now();
                firstChunkElapsed = Math.floor((t - currentStartTimeRef.current) / 1000);
                // Update attempts entry with first-byte elapsed
                  try {
                    console.info(`[useChat] first chunk for id=${assistantIdLocal} elapsed=${firstChunkElapsed}s`);
                  } catch (e) {}
                  updateMessage(assistantIdLocal, (m) => {
                  const meta = { ...(m.meta || {}) };
                  const attempts = Array.isArray(meta.attempts) ? meta.attempts.slice() : [];
                  const a = attempts[attemptIndex] || { model: expectedModelName, start: currentStartTimeRef.current };
                  a.first_byte_elapsed = firstChunkElapsed;
                  // Keep elapsed field in sync so UI shows the TTFB when present
                  a.elapsed = a.first_byte_elapsed || a.elapsed || 0;
                  attempts[attemptIndex] = a;
                  meta.attempts = attempts;
                  return { ...m, meta };
                });
              }
            } catch (e) {}
              // Dispatch an explicit append-chunk action for immutable update
              try {
                console.info(`[useChat] appending chunk to id=${assistantIdLocal} index=${assistantIndex} len=${String(chunk).length}`);
              } catch (e) {}
              dispatch({
                type: chatActions.APPEND_CHUNK,
                payload: { index: assistantIndex, id: assistantIdLocal, chunk },
              });
          }

          const latency = Date.now() - start;
          const modelName = res.headers.get("x-model") || expectedModelName;

          // Sanitize and finalize message
          updateMessage(assistantIdLocal, (m) => {
            let newText = removeTrailingModelName(m.text ?? "", modelName);
            // Strip trailing animated ellipses or solitary dot-lines added during streaming
            newText = newText.replace(/\n?\s*\.{1,}\s*$/g, "");
            const finalHtml = sanitizeSimple(newText);
            const meta = { ...(m.meta || {}) };
            const attempts = Array.isArray(meta.attempts) ? meta.attempts.slice() : [];
            const a = attempts[attemptIndex] || {
              model: modelName,
              start: currentStartTimeRef.current,
            };
            // Preserve first-byte elapsed if recorded, otherwise fall back to total latency
            a.first_byte_elapsed = a.first_byte_elapsed ?? firstChunkElapsed ?? null;
            a.elapsed = a.first_byte_elapsed ?? Math.floor(latency / 1000);
            a.status = "success";
            attempts[attemptIndex] = a;
            meta.attempts = attempts;
            meta.route = route;
            meta.model = modelName;
            meta.latency_ms = latency;
            meta.streaming = false;
            meta.streamedPlain = false;
            return { ...m, text: newText, html: finalHtml, meta };
          });

          clearAutoTimeout();
          currentStartTimeRef.current = null;
          succeeded = true;
          break;
        } catch (err) {
          const msg = err.message || String(err);
          const isAbort = err.name === "AbortError" || /aborted/i.test(msg);

            // fetch error handled below

          if (isAbort) {
            if (autoTimedOut.current) {
                    // handling auto-timeout abort
              anyAutoTimedOut.current = true;
              updateMessage(assistantIdLocal, (m) => {
                const meta = { ...(m.meta || {}) };
                const attempts = Array.isArray(meta.attempts) ? meta.attempts.slice() : [];
                const a = attempts[attemptIndex] || {
                  model: expectedModelName,
                  start: currentStartTimeRef.current,
                };
                a.elapsed = Math.floor(
                  (Date.now() - (a.start || currentStartTimeRef.current)) / 1000
                );
                a.status = "timed_out";
                attempts[attemptIndex] = a;
                meta.attempts = attempts;
                // Mark this attempt as timed out and stop streaming for this attempt
                meta.timed_out = true;
                meta.streamedPlain = true;
                meta.streaming = false;
                const suffix =
                  selected === config.defaultRoute
                    ? ` timed out — switching to alternate model`
                    : ` timed out — request cancelled`;
                return {
                  ...m,
                  meta,
                  text: (m.text || "") + `\n[${expectedModelName}${suffix}]`,
                };
              });

                if (selected === config.defaultRoute) {
                  showToast(`${expectedModelName} timed out — trying fallback model`);
                } else {
                  showToast(`${expectedModelName} timed out — request cancelled`);
                }

              clearAutoTimeout();
              currentStartTimeRef.current = null;

              if (selected === config.defaultRoute && attemptIndex < routesLength - 1) {
                  // Prepare the next attempt immediately so the UI shows the fallback model
                  // This pre-seeds the attempts array for the next iteration to avoid a visual gap
                  try {
                    const nextRoute = routes[attemptIndex + 1];
                    const nextModelName = nextRoute === config.fast.route ? config.fast.name : config.slow.name;
                    const nextStart = Date.now();
                    updateMessage(assistantIdLocal, (m) => {
                      const meta = { ...(m.meta || {}) };
                      const attempts = Array.isArray(meta.attempts) ? meta.attempts.slice() : [];
                      attempts[attemptIndex + 1] = {
                        model: nextModelName,
                        start: nextStart,
                        elapsed: 0,
                        status: "running",
                      };
                      meta.attempts = attempts;
                      meta.model = nextModelName;
                      meta.streaming = true;
                      meta.startTime = nextStart;
                      return { ...m, meta };
                    });
                    // pre-seeded next attempt
                  } catch (e) {
                    // pre-seed next attempt failed
                  }
                  // Continue to next model - the next iteration will perform the fetch
                  continue;
              } else {
                // Last attempt or not auto mode - mark as done and exit loop
                updateMessage(assistantIdLocal, (m) => {
                  const meta = { ...(m.meta || {}) };
                  meta.streaming = false;
                  return { ...m, meta };
                });
                break;
              }
            }

            // User cancelled
            userCancelled.current = true;
                // handling user-cancel abort
            updateMessage(assistantIdLocal, (m) => {
              const meta = { ...(m.meta || {}) };
              const attempts = Array.isArray(meta.attempts) ? meta.attempts.slice() : [];
              const a = attempts[attemptIndex] || {
                model: expectedModelName,
                start: currentStartTimeRef.current,
              };
              a.elapsed = Math.floor(
                (Date.now() - (a.start || currentStartTimeRef.current)) / 1000
              );
              a.status = "cancelled";
              attempts[attemptIndex] = a;
              meta.attempts = attempts;
              meta.streaming = false; // Stop streaming
              meta.cancelled = true; // Mark as cancelled
              meta.timed_out = false; // Clear timeout flag
              meta.streamedPlain = true;
              return { ...m, meta, text: (m.text || "") + "\n[stopped by user]" };
            });
            dispatch({ type: chatActions.SET_SEND_ERROR, payload: "" });
            currentStartTimeRef.current = null;
            break;
          } else {
            // Other error
            dispatch({
              type: chatActions.ADD_MESSAGE,
              payload: {
                role: "assistant",
                text: `Error: ${msg}`,
                meta: { streamedPlain: true },
              },
            });
            if (!userCancelled.current) {
              showToast(`${expectedModelName} failed — trying fallback model`);
            }
            continue;
          }
        } finally {
          currentController.current = null;
          clearAutoTimeout();
        }
      }

      if (!succeeded && !state.sendError && !userCancelled.current) {
        if (anyAutoTimedOut.current) {
          dispatch({
            type: chatActions.SET_SEND_ERROR,
            payload:
              "Timeout: models did not respond within the allotted time. Request cancelled automatically.",
          });
        } else {
          dispatch({ type: chatActions.SET_SEND_ERROR, payload: "No models responded." });
        }
      }

      dispatch({ type: chatActions.SET_SENDING, payload: false });
    },
    [state.prompt, state.timeoutFast, state.timeoutSlow, state.sendError, selected, config, updateMessage, clearAutoTimeout, showToast]
  );

  const handleStop = useCallback(() => {
    try {
      userCancelled.current = true;
      currentController.current?.abort?.();
    } catch (e) {}
    dispatch({ type: chatActions.SET_SENDING, payload: false });
  }, []);

  const handleClear = useCallback(() => {
    try {
      userCancelled.current = true;
      currentController.current?.abort?.();
    } catch (e) {}
    clearAutoTimeout();
    currentAssistantIndex.current = -1;
    currentStartTimeRef.current = null;
    autoTimedOut.current = false;
    anyAutoTimedOut.current = false;

    dispatch({ type: chatActions.CLEAR_MESSAGES });
    dispatch({ type: chatActions.SET_PROMPT, payload: "" });
    dispatch({ type: chatActions.SET_SEND_ERROR, payload: "" });
    dispatch({ type: chatActions.SET_SENDING, payload: false });
  }, [clearAutoTimeout]);

  const setPrompt = useCallback((value) => {
    dispatch({ type: chatActions.SET_PROMPT, payload: value });
  }, []);

  const setTimeoutFast = useCallback((value) => {
    dispatch({ type: chatActions.SET_TIMEOUT_FAST, payload: value });
  }, []);

  const setTimeoutSlow = useCallback((value) => {
    dispatch({ type: chatActions.SET_TIMEOUT_SLOW, payload: value });
  }, []);

  return {
    prompt: state.prompt,
    setPrompt,
    messages: state.messages,
    timeoutFast: state.timeoutFast,
    setTimeoutFast,
    timeoutSlow: state.timeoutSlow,
    setTimeoutSlow,
    sending: state.sending,
    sendError: state.sendError,
    chatRef,
    currentStartTimeRef,
    handleSelect,
    handleSubmit,
    handleStop,
    handleClear,
  };
}
