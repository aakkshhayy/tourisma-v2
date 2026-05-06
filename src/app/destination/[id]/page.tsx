import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Clock, Star, ArrowLeft, ArrowRight, Sparkles, Train, Plane } from 'lucide-react';
import { PLACES, getPlaceById, getPlacesByState, getStateById } from '@/lib/places';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return PLACES.map(p => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const place = getPlaceById(id);
  if (!place) return { title: 'Place not found' };
  return {
    title: `${place.name} — Tourisma`,
    description: place.tagline,
    openGraph: {
      title: `${place.name} — Tourisma`,
      description: place.tagline,
      type: 'website',
    },
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  heritage: 'Heritage',
  nature: 'Nature',
  religious: 'Religious',
  beach: 'Beach',
  hill_station: 'Hill Station',
  wildlife: 'Wildlife',
  cultural: 'Cultural',
};

const CATEGORY_COLORS: Record<string, string> = {
  heritage: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
  nature: 'bg-green-500/20 text-green-400 border-green-500/20',
  religious: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
  beach: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20',
  hill_station: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  wildlife: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  cultural: 'bg-rose-500/20 text-rose-400 border-rose-500/20',
};

export default async function DestinationPage({ params }: PageProps) {
  const { id } = await params;
  const place = getPlaceById(id);
  if (!place) notFound();

  const stateInfo = getStateById(place.state);
  const nearbyPlaces = getPlacesByState(place.state)
    .filter(p => p.id !== place.id)
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-[#0A0A0B]">
      {/* Hero */}
      <div className="relative bg-[#0d0d10] border-b border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <Link href="/explore"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm font-semibold mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
            All destinations
          </Link>

          <div className="flex items-start gap-6 mb-6">
            <span className="text-6xl">{place.emoji}</span>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${CATEGORY_COLORS[place.category] ?? 'bg-white/5 text-white/40 border-white/10'}`}>
                  {CATEGORY_LABELS[place.category]}
                </span>
                {stateInfo && (
                  <span className="text-xs font-semibold text-white/40 bg-white/5 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" strokeWidth={2.2} />
                    {stateInfo.name}
                  </span>
                )}
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">{place.name}</h1>
              <p className="text-white/60 text-lg">{place.tagline}</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-white/40 text-xs font-medium mb-1">Recommended</p>
              <p className="text-white font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" strokeWidth={2.5} />
                {place.recommendedDays} day{place.recommendedDays > 1 ? 's' : ''}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-white/40 text-xs font-medium mb-1">Best time</p>
              <p className="text-white font-bold text-sm truncate">{place.bestTimeToVisit.split(' ').slice(0, 3).join(' ')}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-white/40 text-xs font-medium mb-1">Entry fee</p>
              <p className="text-white font-bold">₹{place.entryFee > 0 ? place.entryFee.toLocaleString() : 'Free'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-white/40 text-xs font-medium mb-1">Food / day</p>
              <p className="text-white font-bold">₹{place.foodCostPerDay.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">About</h2>
              <p className="text-white/60 leading-relaxed">{place.description}</p>
            </section>

            {/* Highlights */}
            {place.highlights.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4">Highlights</h2>
                <ul className="space-y-2">
                  {place.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/60">
                      <Star className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" strokeWidth={2.2} fill="currentColor" />
                      <span className="text-sm leading-relaxed">{h}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Nearby attractions */}
            {place.nearbyAttractions.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4">Nearby Attractions</h2>
                <div className="flex flex-wrap gap-2">
                  {place.nearbyAttractions.map((a, i) => (
                    <span key={i} className="text-sm text-white/60 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                      {a}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Travel options */}
            {place.travelOptions.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4">How to Get Here</h2>
                <div className="space-y-2">
                  {place.travelOptions.slice(0, 4).map((opt, i) => (
                    <div key={i} className="flex items-center gap-3 bg-[#111113] border border-[#222226] rounded-xl px-4 py-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        {opt.mode === 'flight' ? <Plane className="w-3.5 h-3.5 text-white/60" strokeWidth={2.2} /> : <Train className="w-3.5 h-3.5 text-white/60" strokeWidth={2.2} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-semibold">{opt.from} → {opt.to}</p>
                        <p className="text-white/40 text-xs capitalize">{opt.mode} · {opt.duration}</p>
                      </div>
                      <p className="text-orange-400 text-sm font-bold">₹{opt.approxCost.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* CTA */}
            <div className="bg-gradient-to-br from-orange-500/10 to-amber-400/5 border border-orange-500/20 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-2">Plan a trip here</h3>
              <p className="text-white/50 text-sm mb-4">Generate a complete day-by-day itinerary including travel routes and cost estimates.</p>
              <Link href={`/itinerary`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-sm hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all">
                <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                Build Itinerary
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
            </div>

            {/* Best time */}
            <div className="bg-[#111113] border border-[#222226] rounded-2xl p-5">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" strokeWidth={2.5} />
                Best Time to Visit
              </h3>
              <p className="text-white/60 text-sm">{place.bestTimeToVisit}</p>
            </div>

            {/* Transport hubs */}
            <div className="bg-[#111113] border border-[#222226] rounded-2xl p-5">
              <h3 className="font-bold text-white mb-3">Nearest Transport</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Train className="w-3.5 h-3.5 text-white/40" strokeWidth={2.2} />
                  <span className="text-white/60">{place.nearestRailway.station}</span>
                  <span className="ml-auto text-white/30 text-xs">{place.nearestRailway.distanceKm} km</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Plane className="w-3.5 h-3.5 text-white/40" strokeWidth={2.2} />
                  <span className="text-white/60 truncate">{place.nearestAirport.airport}</span>
                  <span className="ml-auto text-white/30 text-xs flex-shrink-0">{place.nearestAirport.distanceKm} km</span>
                </div>
              </div>
            </div>

            {/* Stay options */}
            {place.stayOptions.length > 0 && (
              <div className="bg-[#111113] border border-[#222226] rounded-2xl p-5">
                <h3 className="font-bold text-white mb-3">Stay Options</h3>
                <div className="space-y-2">
                  {place.stayOptions.map((opt, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-white/60 capitalize">{opt.type}</span>
                      <span className="text-white font-semibold">₹{opt.costPerNight.toLocaleString()}/night</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nearby in same state */}
        {nearbyPlaces.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6">
              More in{' '}
              <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
                {stateInfo?.name}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {nearbyPlaces.map(p => (
                <Link key={p.id} href={`/destination/${p.id}`}
                  className="group bg-[#111113] border border-[#222226] hover:border-orange-500/30 rounded-2xl p-5 transition-all hover:-translate-y-0.5">
                  <span className="text-2xl mb-2 block">{p.emoji}</span>
                  <h3 className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors">{p.name}</h3>
                  <p className="text-white/40 text-xs mt-1 line-clamp-2">{p.tagline}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
