'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon paths (Webpack/Next breaks the default)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  lat: number;
  lng: number;
  name: string;
  nearestRailwayKm?: number;
  nearestAirportKm?: number;
  nearestRailway?: string;
  nearestAirport?: string;
}

export default function PlaceMapInner({ lat, lng, name }: Props) {
  return (
    <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/10 relative z-0">
      <MapContainer
        center={[lat, lng]}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', backgroundColor: '#0d0d10' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>{name}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
