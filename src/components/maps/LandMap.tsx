import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { area as turfArea, distance as turfDistance, point as turfPoint } from '@turf/turf';

// Custom SVG-based markers (avoids bundler issues with leaflet PNG icons)

// Custom colored markers
const createIcon = (color: string) => new L.Icon({
  iconUrl: `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  `)}`,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

const GREEN_ICON = createIcon('#10B981');
const BLUE_ICON = createIcon('#3B82F6');
const AMBER_ICON = createIcon('#F59E0B');
const GRAY_ICON = createIcon('#6B7280');
const RED_ICON = createIcon('#EF4444');

const STATUS_ICONS: Record<string, L.Icon> = {
  available: GREEN_ICON,
  under_study: AMBER_ICON,
  under_design: BLUE_ICON,
  under_construction: BLUE_ICON,
  developed: GREEN_ICON,
};

export interface MapLand {
  id: string;
  land_name: string;
  land_code: string;
  latitude: number;
  longitude: number;
  status: string;
  area_sqm: number;
  municipality: string;
}

interface LandMapProps {
  lands: MapLand[];
  /** Center the map on these coordinates (default: Doha, Qatar) */
  center?: [number, number];
  /** Zoom level */
  zoom?: number;
  /** Height of the map */
  height?: string;
  /** Show single-land detail mode (centers + zooms on one land) */
  selectedLandId?: string;
  /** Called when a marker is clicked */
  onMarkerClick?: (land: MapLand) => void;
}

/** Recenters map when center/zoom change */
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export function LandMap({
  lands,
  center = [25.2854, 51.5310], // Doha, Qatar
  zoom = 12,
  height = '400px',
  selectedLandId,
  onMarkerClick,
}: LandMapProps) {
  const selected = useMemo(() => lands.find(l => l.id === selectedLandId), [lands, selectedLandId]);

  const mapCenter = selected ? [selected.latitude, selected.longitude] as [number, number] : center;
  const mapZoom = selected ? 16 : zoom;

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={mapCenter} zoom={mapZoom} />
        {lands.map((land) => {
          const lat = land.latitude || 25.28;
          const lng = land.longitude || 51.53;
          if (!lat || !lng) return null;
          const icon = STATUS_ICONS[land.status] || GRAY_ICON;
          return (
            <Marker
              key={land.id}
              position={[lat, lng]}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick?.(land),
              }}
            >
              <Popup>
                <div dir="rtl" className="text-sm min-w-[160px]">
                  <p className="font-bold text-gray-800 mb-1">{land.land_name}</p>
                  <p className="text-xs text-gray-500">{land.land_code}</p>
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    <p>المساحة: {land.area_sqm?.toLocaleString()} م²</p>
                    <p>البلدية: {land.municipality}</p>
                    <p className="text-xs text-gray-400 mt-1 border-t pt-1">
                      {(() => {
                        try {
                          const p = turfPoint([land.longitude, land.latitude]);
                          const doha = turfPoint([51.5310, 25.2854]);
                          const dist = turfDistance(p, doha, { units: 'kilometers' });
                          return `على بعد ${dist.toFixed(1)} كم من وسط الدوحة`;
                        } catch { return ''; }
                      })()}
                    </p>
                    <p>
                      الحالة:{' '}
                      <span className={`inline-block w-2 h-2 rounded-full ml-1 ${
                        land.status === 'available' ? 'bg-emerald-500' :
                        land.status === 'developed' ? 'bg-green-500' :
                        land.status === 'under_construction' ? 'bg-blue-500' :
                        land.status === 'under_design' ? 'bg-blue-400' :
                        'bg-amber-500'
                      }`} />
                      {land.status === 'available' ? 'متاحة' :
                       land.status === 'under_study' ? 'تحت الدراسة' :
                       land.status === 'under_design' ? 'تحت التصميم' :
                       land.status === 'under_construction' ? 'تحت الإنشاء' :
                       land.status === 'developed' ? 'مطورة' : land.status}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

/**
 * Generates demo coordinates for lands that don't have real coordinates.
 * Uses a deterministic offset based on the land index.
 */
export function generateDemoCoordinates(index: number, total: number): { latitude: number; longitude: number } {
  const DOHA_LAT = 25.2854;
  const DOHA_LNG = 51.5310;
  // Spread points in a small grid around Doha
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  const latOffset = (row - cols / 2) * 0.02;
  const lngOffset = (col - cols / 2) * 0.02;
  return {
    latitude: DOHA_LAT + latOffset,
    longitude: DOHA_LNG + lngOffset,
  };
}
