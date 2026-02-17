"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon broken by webpack/turbopack asset hashing
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface LocationMapProps {
  lat: number;
  lon: number;
  onMarkerMove: (lat: number, lon: number) => void;
  onMapLoadError?: () => void;
}

function MapController({
  lat,
  lon,
  onMarkerMove,
  onMapLoadError,
}: LocationMapProps) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([lat, lon], map.getZoom() ?? 13, { duration: 0.5 });
  }, [lat, lon, map]);

  useEffect(() => {
    if (!onMapLoadError) return;
    const handler = () => onMapLoadError();
    map.on("tileerror", handler);
    return () => {
      map.off("tileerror", handler);
    };
  }, [map, onMapLoadError]);

  useMapEvents({
    click(e) {
      onMarkerMove(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

export default function LocationMap({
  lat,
  lon,
  onMarkerMove,
  onMapLoadError,
}: LocationMapProps) {
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker
        position={[lat, lon]}
        draggable
        eventHandlers={{
          dragend(e) {
            const m = e.target as L.Marker;
            const pos = m.getLatLng();
            onMarkerMove(pos.lat, pos.lng);
          },
        }}
      />
      <MapController
        lat={lat}
        lon={lon}
        onMarkerMove={onMarkerMove}
        onMapLoadError={onMapLoadError}
      />
    </MapContainer>
  );
}
