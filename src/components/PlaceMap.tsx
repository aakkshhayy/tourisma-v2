'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

interface Props {
  lat: number;
  lng: number;
  name: string;
  nearestRailwayKm?: number;
  nearestAirportKm?: number;
  nearestRailway?: string;
  nearestAirport?: string;
}

// Lazy-load the actual map component — leaflet needs window, so SSR is disabled.
const InnerMap = dynamic(() => import('./PlaceMapInner'), {
  ssr: false,
  loading: () => (
    <div className="aspect-[16/9] w-full rounded-2xl bg-[#1a1a1e] border border-white/10 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function PlaceMap(props: Props) {
  // Defer mounting one frame to avoid hydration mismatches around leaflet's window probes
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  if (!ready) {
    return (
      <div className="aspect-[16/9] w-full rounded-2xl bg-[#1a1a1e] border border-white/10" />
    );
  }
  return <InnerMap {...props} />;
}
