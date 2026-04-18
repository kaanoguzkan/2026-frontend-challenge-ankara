import { useCallback, useEffect, useState } from "react";

export type HashParams = Record<string, string>;

function readHash(): HashParams {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return {};
  const out: HashParams = {};
  for (const part of raw.split("&")) {
    const [k, v = ""] = part.split("=");
    if (!k) continue;
    out[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return out;
}

function writeHash(params: HashParams): void {
  const entries = Object.entries(params).filter(([, v]) => v !== "" && v !== undefined);
  if (!entries.length) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
    return;
  }
  const hash = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${hash}`);
}

export function useHashState(): [HashParams, (next: HashParams) => void] {
  const [params, setParams] = useState<HashParams>(() => readHash());

  useEffect(() => {
    const onChange = () => setParams(readHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const update = useCallback((next: HashParams) => {
    writeHash(next);
    setParams(next);
  }, []);

  return [params, update];
}
