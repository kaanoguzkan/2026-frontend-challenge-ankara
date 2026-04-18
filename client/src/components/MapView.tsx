import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, Map as LeafletMap } from "leaflet";
import type { Record } from "../types";
import { SOURCE_COLORS, SOURCE_LABELS } from "../types";

interface Props {
  records: Record[];
  selectedId?: string;
  onSelect: (record: Record) => void;
}

const ANKARA_CENTER: [number, number] = [39.925, 32.866];

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  }, [bounds, map]);
  return null;
}

export function MapView({ records, selectedId, onSelect }: Props) {
  const mapRef = useRef<LeafletMap | null>(null);
  const withCoords = useMemo(
    () => records.filter((r): r is Record & { coordinates: { lat: number; lng: number } } => !!r.coordinates),
    [records]
  );

  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    if (!withCoords.length) return null;
    return withCoords.map((r) => [r.coordinates.lat, r.coordinates.lng]) as LatLngBoundsExpression;
  }, [withCoords]);

  if (!withCoords.length) {
    return <div className="empty-state">No records with coordinates in the current filter.</div>;
  }

  return (
    <div className="map">
      <MapContainer
        center={ANKARA_CENTER}
        zoom={12}
        scrollWheelZoom
        ref={mapRef}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds bounds={bounds} />
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
