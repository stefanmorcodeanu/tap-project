/**
 * Custom hook for animated ellipsis during streaming
 */

import { useState, useEffect } from "react";
import { ELLIPSIS_FRAMES, ELLIPSIS_INTERVAL } from "../utils/constants.js";

export function useEllipsis(messages, currentStartTimeRef) {
  const [ellipsis, setEllipsis] = useState("");
  const [thinkSeconds, setThinkSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    const hasStreaming = messages.some((m) => m?.meta?.streaming);

    if (hasStreaming) {
      let idx = 0;
      setEllipsis(ELLIPSIS_FRAMES[0]);
      interval = setInterval(() => {
        idx = (idx + 1) % ELLIPSIS_FRAMES.length;
        setEllipsis(ELLIPSIS_FRAMES[idx]);
        // Update thinkSeconds from start time if available
        if (currentStartTimeRef?.current) {
          const secs = Math.floor((Date.now() - currentStartTimeRef.current) / 1000);
          setThinkSeconds(secs);
        }
      }, ELLIPSIS_INTERVAL);
    } else {
      setEllipsis("");
      setThinkSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [messages, currentStartTimeRef]);

  return { ellipsis, thinkSeconds };
}

