/**
 * Application constants
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export const FALLBACK_CONFIG = {
  defaultRoute: "auto",
  fast: { route: "a", name: "MODEL_A", label: "Fast model" },
  slow: { route: "b", name: "MODEL_B", label: "Slow model" },
};

export const DEFAULT_TIMEOUT_FAST = 30; // seconds 
export const DEFAULT_TIMEOUT_SLOW = 60; // seconds

export const TOAST_DURATION = 3500; // milliseconds

export const ELLIPSIS_FRAMES = [".", "..", "..."];
export const ELLIPSIS_INTERVAL = 500; // milliseconds

