import { useEffect, useState } from "react";
import { fetchRecords } from "../api";
import type { RecordsResponse } from "../types";

interface State {
  data: RecordsResponse | null;
  loading: boolean;
  error: string | null;
}

export function useRecords(): State {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    fetchRecords()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message ?? "Failed to load" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
