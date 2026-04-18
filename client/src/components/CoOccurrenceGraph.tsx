import { useMemo } from "react";
import type { Record } from "../types";
import type { Canonicalize } from "../lib/summary";

interface Props {
  records: Record[];
  canonicalize: Canonicalize;
  displayName: (key: string) => string;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

interface Edge {
  a: string;
  b: string;
  weight: number;
}

interface Node {
  key: string;
  label: string;
  x: number;
  y: number;
  degree: number;
  isPodo: boolean;
}

const PODO_KEY = "podo";
const WIDTH = 640;
const HEIGHT = 480;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const RADIUS = Math.min(WIDTH, HEIGHT) / 2 - 60;

function buildEdges(records: Record[], canonicalize: Canonicalize): Map<string, Edge> {
  const edges = new Map<string, Edge>();
  for (const r of records) {
    const keys = Array.from(new Set(r.people.map(canonicalize).filter(Boolean)));
    if (keys.length < 2) continue;
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const [a, b] = keys[i] < keys[j] ? [keys[i], keys[j]] : [keys[j], keys[i]];
        const id = `${a}|${b}`;
        const existing = edges.get(id);
        if (existing) existing.weight += 1;
        else edges.set(id, { a, b, weight: 1 });
      }
    }
  }
  return edges;
}

export function CoOccurrenceGraph({ records, canonicalize, displayName, selectedKey, onSelect }: Props) {
  const { nodes, edges, maxWeight } = useMemo(() => {
    const edgeMap = buildEdges(records, canonicalize);
    const degree = new Map<string, number>();
    for (const e of edgeMap.values()) {
      degree.set(e.a, (degree.get(e.a) ?? 0) + e.weight);
      degree.set(e.b, (degree.get(e.b) ?? 0) + e.weight);
    }
    const keys = Array.from(degree.keys()).sort((x, y) => (degree.get(y) ?? 0) - (degree.get(x) ?? 0));
    const podoInSet = keys.includes(PODO_KEY);
    const ring = keys.filter((k) => k !== PODO_KEY);
    const nodes: Node[] = [];
    if (podoInSet) {
      nodes.push({
        key: PODO_KEY,
        label: displayName(PODO_KEY),
        x: CENTER_X,
        y: CENTER_Y,
        degree: degree.get(PODO_KEY) ?? 0,
        isPodo: true,
      });
    }
    const n = ring.length;
    ring.forEach((key, i) => {
      const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
      nodes.push({
        key,
        label: displayName(key),
        x: CENTER_X + Math.cos(angle) * RADIUS,
        y: CENTER_Y + Math.sin(angle) * RADIUS,
        degree: degree.get(key) ?? 0,
        isPodo: false,
      });
    });
    const edges = Array.from(edgeMap.values());
    const maxWeight = edges.reduce((m, e) => Math.max(m, e.weight), 1);
    return { nodes, edges, maxWeight };
  }, [records, canonicalize, displayName]);

  if (!nodes.length) {
    return (
      <div className="empty-state">
        <div className="empty-state__title">Not enough co-occurrences to draw a graph.</div>
        <div className="empty-state__hint">Enable more sources or widen the time range.</div>
      </div>
    );
  }

  const nodeByKey = new Map(nodes.map((n) => [n.key, n]));
  const highlightedEdges = selectedKey
    ? new Set(edges.filter((e) => e.a === selectedKey || e.b === selectedKey).map((e) => `${e.a}|${e.b}`))
    : null;

  return (
    <div className="graph">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="graph__svg">
        {edges.map((e) => {
          const a = nodeByKey.get(e.a);
          const b = nodeByKey.get(e.b);
          if (!a || !b) return null;
          const highlighted = highlightedEdges?.has(`${e.a}|${e.b}`) ?? false;
          const faded = highlightedEdges && !highlighted;
          return (
            <line
              key={`${e.a}|${e.b}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={highlighted ? "#60a5fa" : "#475569"}
              strokeWidth={1 + (e.weight / maxWeight) * 3}
              strokeOpacity={faded ? 0.15 : highlighted ? 0.9 : 0.55}
            />
          );
        })}
        {nodes.map((n) => {
          const isSelected = n.key === selectedKey;
          const r = n.isPodo ? 14 : 7 + Math.min(6, n.degree / 2);
          return (
            <g
              key={n.key}
              className="graph__node"
              onClick={() => onSelect(n.key)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill={n.isPodo ? "#f59e0b" : isSelected ? "#60a5fa" : "#1f2937"}
                stroke={isSelected ? "#ffffff" : n.isPodo ? "#fbbf24" : "#475569"}
                strokeWidth={isSelected ? 3 : 1.5}
              />
              <text
                x={n.x}
                y={n.y + r + 12}
                textAnchor="middle"
                fontSize={11}
                fill={isSelected ? "#e2e8f0" : "#94a3b8"}
                pointerEvents="none"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="graph__hint">
        Edges weighted by shared sightings, check-ins, and messages. Click a node to focus that person.
      </p>
    </div>
  );
}
