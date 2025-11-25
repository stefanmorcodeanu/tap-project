/**
 * Custom hook for managing model configuration
 */

import { useState, useEffect } from "react";
import { FALLBACK_CONFIG } from "../utils/constants.js";
import { fetchModelConfig } from "../utils/api.js";

export function useConfig() {
  const [config, setConfig] = useState(FALLBACK_CONFIG);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      try {
        setStatus("loading");
        setError("");
        const body = await fetchModelConfig();
        
        if (!cancelled) {
          setConfig({
            defaultRoute: body.defaultRoute ?? FALLBACK_CONFIG.defaultRoute,
            fast: body.fast ?? FALLBACK_CONFIG.fast,
            slow: body.slow ?? FALLBACK_CONFIG.slow,
          });
          setStatus("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(err.message);
        }
      }
    }

    loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, status, error };
}

