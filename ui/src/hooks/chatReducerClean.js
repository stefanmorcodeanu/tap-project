import { DEFAULT_TIMEOUT_FAST, DEFAULT_TIMEOUT_SLOW } from "../utils/constants.js";

export const chatActions = {
  SET_PROMPT: "SET_PROMPT",
  SET_MESSAGES: "SET_MESSAGES",
  ADD_MESSAGE: "ADD_MESSAGE",
  UPDATE_MESSAGE: "UPDATE_MESSAGE",
  APPEND_CHUNK: "APPEND_CHUNK",
  SET_TIMEOUT_FAST: "SET_TIMEOUT_FAST",
  SET_TIMEOUT_SLOW: "SET_TIMEOUT_SLOW",
  SET_SENDING: "SET_SENDING",
  SET_SEND_ERROR: "SET_SEND_ERROR",
  CLEAR_MESSAGES: "CLEAR_MESSAGES",
  RESET: "RESET",
};

export const initialState = {
  prompt: "",
  messages: [],
  timeoutFast: DEFAULT_TIMEOUT_FAST,
  timeoutSlow: DEFAULT_TIMEOUT_SLOW,
  sending: false,
  sendError: "",
};

export function chatReducer(state, action) {
  switch (action.type) {
    case chatActions.SET_PROMPT:
      return { ...state, prompt: action.payload };

    case chatActions.SET_MESSAGES:
      return {
        ...state,
        messages: typeof action.payload === "function" ? action.payload(state.messages) : action.payload,
      };

    case chatActions.ADD_MESSAGE:
      return { ...state, messages: [...state.messages, action.payload] };

    case chatActions.UPDATE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map((m, i) => {
          // support locating by numeric index or by meta._id
          const targetIndex = typeof action.payload.index === 'number' ? action.payload.index : -1;
          const targetId = action.payload.id;
          const matchesIndex = targetIndex === i;
          const matchesId = targetId && m?.meta && m.meta._id === targetId;
          if (matchesIndex || matchesId) {
            try {
              const updated = action.payload.updater(m);
              return updated;
            } catch (e) {
              return m;
            }
          }
          return m;
        }),
      };

    case chatActions.SET_TIMEOUT_FAST:
      return { ...state, timeoutFast: action.payload };

    case chatActions.SET_TIMEOUT_SLOW:
      return { ...state, timeoutSlow: action.payload };

    case chatActions.SET_SENDING:
      return { ...state, sending: action.payload };

    case chatActions.SET_SEND_ERROR:
      return { ...state, sendError: action.payload };

    case chatActions.CLEAR_MESSAGES:
      return { ...state, messages: [] };

    case chatActions.RESET:
      return {
        ...initialState,
        timeoutFast: state.timeoutFast,
        timeoutSlow: state.timeoutSlow,
      };

    case chatActions.APPEND_CHUNK: {
      const { index, id, chunk = "" } = action.payload || {};
      if (!chunk) return state;

      // Prefer locating by provided id (stable), then numeric index, otherwise find last streaming assistant message
      let targetIndex = -1;

      if (id) {
        for (let i = state.messages.length - 1; i >= 0; i -= 1) {
          const candidate = state.messages[i];
          if (candidate?.meta && candidate.meta._id === id) {
            targetIndex = i;
            break;
          }
        }
      }

      if (targetIndex === -1) {
        targetIndex = typeof index === "number" && index >= 0 && index < state.messages.length ? index : -1;
      }

      if (targetIndex === -1) {
        for (let i = state.messages.length - 1; i >= 0; i -= 1) {
          const candidate = state.messages[i];
          if (candidate?.role === "assistant" && candidate?.meta?.streaming) {
            targetIndex = i;
            break;
          }
        }
      }

      if (targetIndex === -1) {
        // skipped: no streaming assistant message found
        return state;
      }

      return {
        ...state,
        messages: state.messages.map((m, i) => {
          if (i !== targetIndex) return m;
          const meta = { ...(m.meta || {}) };
          meta.streamedPlain = true;
          meta.streaming = true;
          meta._version = (meta._version || 0) + 1;
          const newMsg = {
            ...m,
            text: (m.text || "") + chunk,
            meta,
          };
          return newMsg;
        }),
      };
    }

    default:
      return state;
  }
}
