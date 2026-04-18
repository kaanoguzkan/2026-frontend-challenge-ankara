import { useEffect, type RefObject } from "react";
import type { Record } from "../types";

interface Args {
  records: Record[];
  selectedRecord: Record | null;
  onSelectRecord: (r: Record | null) => void;
  onClearPerson: () => void;
  searchRef: RefObject<HTMLInputElement>;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

export function useKeyboardShortcuts({
  records,
  selectedRecord,
  onSelectRecord,
  onClearPerson,
  searchRef,
}: Args) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "/" && !isTypingTarget(e.target)) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }

      if (e.key === "Escape") {
        if (isTypingTarget(e.target)) {
          (e.target as HTMLElement).blur();
          return;
        }
        if (selectedRecord) onSelectRecord(null);
        else onClearPerson();
        return;
      }

      if (isTypingTarget(e.target)) return;
      if (!records.length) return;

      const isDown = e.key === "ArrowDown" || e.key === "j";
      const isUp = e.key === "ArrowUp" || e.key === "k";
      if (!isDown && !isUp) return;

      e.preventDefault();
      const idx = selectedRecord
        ? records.findIndex((r) => r.id === selectedRecord.id && r.source === selectedRecord.source)
        : -1;
      const next = isDown
        ? Math.min(records.length - 1, idx + 1)
        : Math.max(0, idx <= 0 ? 0 : idx - 1);
      const target = records[next] ?? null;
      onSelectRecord(target);
      if (target) {
        requestAnimationFrame(() => {
          document
            .querySelector(`[data-record-key="${target.source}-${target.id}"]`)
            ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [records, selectedRecord, onSelectRecord, onClearPerson, searchRef]);
}
