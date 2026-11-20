import { useCallback, useEffect, useRef, useState } from "react";
import api from "./lib/api";

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** Data dropdown: mesin, shift, operator */
export function useLookups() {
  const [lookups, setLookups] = useState({
    machines: [],
    shifts: [],
    operators: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get("/lookups")
      .then(({ data }) => active && setLookups(data))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { lookups, loading };
}

/** Notifikasi sementara (hilang otomatis) */
export function useNotice() {
  const [notice, setNotice] = useState(null);
  const timer = useRef();

  const show = useCallback((type, text) => {
    clearTimeout(timer.current);
    setNotice({ type, text });
    timer.current = setTimeout(() => setNotice(null), 5000);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return [notice, show];
}
