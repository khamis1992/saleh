import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom SVG marker (purple pin matching project accent)
const MARKER_ICON = new L.Icon({
  iconUrl: `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#533afd"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  `)}`,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
});

interface LocationPickerProps {
  /** Current latitude (0 or undefined = no location yet) */
  lat?: number;
  /** Current longitude (0 or undefined = no location yet) */
  lng?: number;
  /** Called when user clicks or drags the marker */
  onLocationChange: (lat: number, lng: number) => void;
  /** Map height CSS value */
  height?: string;
  /** Center when no location is set (default: Doha, Qatar) */
  defaultCenter?: [number, number];
}

function MapClickHandler({
  onLocationChange,
}: {
  onLocationChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({
  lat,
  lng,
  onLocationChange,
  height = '280px',
  defaultCenter = [25.2854, 51.5310],
}: LocationPickerProps) {
  const hasCoords = lat != null && lng != null && lat !== 0 && lng !== 0;
  const center: [number, number] = hasCoords ? [lat!, lng!] : defaultCenter;
  const zoom = hasCoords ? 15 : 11;

  const handleDrag = (e: L.LeafletEvent) => {
    const marker = e.target as L.Marker;
    const pos = marker.getLatLng();
    onLocationChange(pos.lat, pos.lng);
  };

  return (
    <div
      style={{ height }}
      className="rounded-xl overflow-hidden border border-gray-200 shadow-sm relative"
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationChange={onLocationChange} />
        {hasCoords && (
          <Marker
            position={[lat!, lng!]}
            icon={MARKER_ICON}
            draggable={true}
            eventHandlers={{ dragend: handleDrag }}
          />
        )}
      </MapContainer>

      {/* Hint overlay when no location is set */}
      {!hasCoords && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 shadow-lg border border-gray-200 text-center" dir="rtl">
            <p className="text-sm font-semibold text-gray-700">
              📍 انقر على الخريطة لتحديد الموقع
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Click on the map to pick the location
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
