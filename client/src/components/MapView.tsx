import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Popup, Marker, useMap } from "react-leaflet";
import L, { type LatLngBoundsExpression } from "leaflet";
import type { Record, Source } from "../types";
import { SOURCE_COLORS, SOURCE_LABELS } from "../types";

const PODO_ICON = L.divIcon({
  className: "podo-marker",
  html: '<div class="podo-marker__pin" aria-hidden="true">★</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface Props {
  records: Record[];
  selectedId?: string;
  onSelect: (record: Record) => void;
  podoCoord?: { lat: number; lng: number };
  podoTrail?: Array<[number, number]>;
  podoSteps?: Map<string, number>;
}

function stepIcon(n: number): L.DivIcon {
  return L.divIcon({
    className: "podo-step",
    html: `<div class="podo-step__num" aria-label="Podo step ${n}">${n}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

const ANKARA_CENTER: [number, number] = [39.925, 32.866];

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  }, [bounds, map]);
  return null;
}

function PanToSelected({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    const current = map.getZoom();
    map.setView(target, Math.max(current, 14), { animate: true });
  }, [target, map]);
  return null;
}

export function MapView({ records, selectedId, onSelect, podoCoord, podoTrail, podoSteps }: Props) {
  const withCoords = useMemo(
    () => records.filter((r): r is Record & { coordinates: { lat: number; lng: number } } => !!r.coordinates),
    [records]
  );

  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    if (!withCoords.length) return null;
    return withCoords.map((r) => [r.coordinates.lat, r.coordinates.lng]) as LatLngBoundsExpression;
  }, [withCoords]);

  const selectedCoord = useMemo<[number, number] | null>(() => {
    const found = withCoords.find((r) => r.id === selectedId);
    return found ? [found.coordinates.lat, found.coordinates.lng] : null;
  }, [withCoords, selectedId]);

  if (!withCoords.length) {
    return (
      <div className="empty-state">
        <div className="empty-state__title">No records with coordinates in the current filter.</div>
        <div className="empty-state__hint">Sightings and check-ins are the main geotagged sources — try enabling them.</div>
      </div>
    );
  }

  const presentSources = useMemo(() => {
    const set = new Set<Source>();
    for (const r of withCoords) set.add(r.source);
    return Array.from(set);
  }, [withCoords]);

  return (
    <div className="map">
      <MapContainer
        center={ANKARA_CENTER}
        zoom={12}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds bounds={bounds} />
        <PanToSelected target={selectedCoord} />
        {podoTrail && podoTrail.length > 1 && (
          <Polyline
            positions={podoTrail}
            pathOptions={{ color: "#0ea5b7", weight: 2.5, opacity: 0.9 }}
          />
        )}
        {podoCoord && (
          <>
            <Circle
              center={[podoCoord.lat, podoCoord.lng]}
              radius={1000}
              pathOptions={{
                color: "#ff2bd6",
                weight: 2,
                dashArray: "6 4",
                fillColor: "#ff2bd6",
                fillOpacity: 0.12,
              }}
            />
            <Marker position={[podoCoord.lat, podoCoord.lng]} icon={PODO_ICON}>
              <Popup>
                <strong>Podo — last confirmed location</strong>
                <div style={{ fontSize: 11, marginTop: 4 }}>1 km radius shown</div>
              </Popup>
            </Marker>
          </>
        )}
        {withCoords.map((r) => {
          const selected = r.id === selectedId;
          const stepKey = `${r.source}-${r.id}`;
          const step = podoSteps?.get(stepKey);
          return (
            <CircleMarker
              key={stepKey}
              center={[r.coordinates.lat, r.coordinates.lng]}
              radius={step ? 11 : selected ? 10 : 7}
              pathOptions={{
                color: selected ? "var(--text)" : SOURCE_COLORS[r.source],
                weight: selected ? 3 : 1,
                fillColor: SOURCE_COLORS[r.source],
                fillOpacity: 0.85,
              }}
              eventHandlers={{ click: () => onSelect(r) }}
            >
              <Popup>
                <div style={{ fontSize: 12 }}>
                  <strong>{SOURCE_LABELS[r.source]}</strong>
                  <div>{r.people.join(", ")}</div>
                  {r.location && <div>📍 {r.location}</div>}
                  {r.text && <div style={{ marginTop: 4 }}>{r.text}</div>}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
        {withCoords.map((r) => {
          const stepKey = `${r.source}-${r.id}`;
          const step = podoSteps?.get(stepKey);
          if (!step) return null;
          return (
            <Marker
              key={`step-${stepKey}`}
              position={[r.coordinates.lat, r.coordinates.lng]}
              icon={stepIcon(step)}
              eventHandlers={{ click: () => onSelect(r) }}
              interactive
            />
          );
        })}
      </MapContainer>
      <div className="map__legend" aria-label="Map legend">
        {podoCoord && (
          <div className="map__legend-row">
            <span className="map__legend-star">★</span>
            <span>Podo — last seen (1 km radius)</span>
          </div>
        )}
        {presentSources.map((s) => (
          <div key={s} className="map__legend-row">
            <span
              className="map__legend-dot"
              style={{ background: SOURCE_COLORS[s] }}
              aria-hidden="true"
            />
            <span>{SOURCE_LABELS[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
