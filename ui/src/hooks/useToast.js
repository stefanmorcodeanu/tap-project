/**
 * Custom hook for toast notifications
 */

import { useState, useRef, useEffect } from "react";
import { TOAST_DURATION } from "../utils/constants.js";

export function useToast() {
  const [toast, setToast] = useState("");
  const toastTimeoutRef = useRef(null);

  const showToast = (msg, ms = TOAST_DURATION) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToast("");
      toastTimeoutRef.current = null;
    }, ms);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return { toast, showToast };
}

