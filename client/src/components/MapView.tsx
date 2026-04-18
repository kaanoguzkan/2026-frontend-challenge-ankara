import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Popup, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import type { Record } from "../types";
import { SOURCE_COLORS, SOURCE_LABELS } from "../types";

interface Props {
  records: Record[];
  selectedId?: string;
  onSelect: (record: Record) => void;
  podoCoord?: { lat: number; lng: number };
  podoTrail?: Array<[number, number]>;
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

export function MapView({ records, selectedId, onSelect, podoCoord, podoTrail }: Props) {
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
        )}
        {withCoords.map((r) => {
          const selected = r.id === selectedId;
          return (
            <CircleMarker
              key={`${r.source}-${r.id}`}
              center={[r.coordinates.lat, r.coordinates.lng]}
              radius={selected ? 10 : 7}
              pathOptions={{
                color: selected ? "#ffffff" : SOURCE_COLORS[r.source],
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
      </MapContainer>
    </div>
  );
}
