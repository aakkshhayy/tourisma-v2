import type { Metadata } from 'next';
import { PLACES } from '@/lib/places';

export const metadata: Metadata = {
  title: `Explore ${PLACES.length} Destinations across India — Tourisma`,
  description: `Browse ${PLACES.length} hand-picked Indian destinations: Himalayan towns, beach getaways, ancient temples, hill stations, wildlife reserves, and more. Filter by state, category, or season.`,
  keywords: 'india destinations, india travel, places to visit india, indian states tourism, hill stations, beaches india, religious places, wildlife sanctuaries',
  openGraph: {
    title: `Explore ${PLACES.length} Destinations across India`,
    description: 'Browse hand-picked destinations from Kashmir to Kanyakumari — with photos, costs, and travel info.',
    type: 'website',
    siteName: 'Tourisma',
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
