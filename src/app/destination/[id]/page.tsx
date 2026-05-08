import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Clock, Star, ArrowLeft, ArrowRight, Sparkles, Train, Plane } from 'lucide-react';
import { PLACES, getPlaceById, getPlacesByState, getStateById } from '@/lib/places';
import { getPlaceImage } from '@/lib/placeImages';
import PlaceMap from '@/components/PlaceMap';

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
  const img = getPlaceImage(place.id);
  const ogImage = img ? `https://tourisma-v2.vercel.app${img}` : 'https://tourisma-v2.vercel.app/og-image.svg';
  return {
    title: `${place.name} — Tourisma`,
    description: place.tagline,
    keywords: `${place.name.toLowerCase()}, ${place.tagline.toLowerCase()}, ${place.state} travel, india tourism, ${place.category}`,
    openGraph: {
      title: `${place.name} — Tourisma`,
      description: place.tagline,
      type: 'website',
      siteName: 'Tourisma',
      images: [{ url: ogImage, width: 800, height: 600, alt: place.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: place.name,
      description: place.tagline,
      images: [ogImage],
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

  const heroImage = getPlaceImage(place.id);

  return (
    <main className="min-h-screen bg-[#0A0A0B]">
      {/* Hero with background photo */}
      <div className="relative border-b border-white/5 overflow-hidden">
        {heroImage ? (
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt={place.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/80 to-[#0A0A0B]/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B]/60 via-transparent to-[#0A0A0B]/60" />
          </div>
        ) : (
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px]" />
        )}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <Link href="/explore"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-semibold mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
            All destinations
          </Link>

          <div className="flex items-start gap-6 mb-6">
            <span className="text-6xl drop-shadow-lg">{place.emoji}</span>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${CATEGORY_COLORS[place.category] ?? 'bg-white/5 text-white/40 border-white/10'} backdrop-blur-md`}>
                  {CATEGORY_LABELS[place.category]}
                </span>
                {stateInfo && (
                  <span className="text-xs font-semibold text-white/80 bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" strokeWidth={2.2} />
                    {stateInfo.name}
                  </span>
                )}
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 drop-shadow-lg">{place.name}</h1>
              <p className="text-white/80 text-lg drop-shadow mb-5">{place.tagline}</p>
              <Link href={`/itinerary?place=${place.id}`}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-extrabold text-sm hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-all">
                <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                Add {place.name} to my trip
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
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
            <section className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">About</h2>
              <p className="text-white/70 leading-relaxed text-base">{place.description}</p>
            </section>

            {/* Highlights */}
            {place.highlights.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">Must-see highlights</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {place.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/3 border border-white/8 hover:border-orange-500/20 rounded-xl p-4 transition-colors group">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-orange-500/25 transition-colors">
                        <Star className="w-3.5 h-3.5 text-orange-400" strokeWidth={2.2} fill="currentColor" />
                      </div>
                      <span className="text-sm text-white/70 leading-relaxed">{h}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Map */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-400" strokeWidth={2.5} />
                On the map
              </h2>
              <PlaceMap
                lat={place.coordinates.lat}
                lng={place.coordinates.lng}
                name={place.name}
                nearestRailway={place.nearestRailway.station}
                nearestRailwayKm={place.nearestRailway.distanceKm}
                nearestAirport={place.nearestAirport.airport}
                nearestAirportKm={place.nearestAirport.distanceKm}
              />
              <p className="text-white/30 text-xs mt-2">
                Map data © OpenStreetMap contributors · {place.nearestRailway.station} {place.nearestRailway.distanceKm}km · {place.nearestAirport.airport} {place.nearestAirport.distanceKm}km
              </p>
            </section>

            {/* Nearby attractions */}
            {place.nearbyAttractions.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">Nearby attractions</h2>
                <div className="flex flex-wrap gap-2">
                  {place.nearbyAttractions.map((a, i) => (
                    <span key={i} className="text-sm text-white/70 bg-white/5 border border-white/10 hover:border-orange-500/30 hover:bg-orange-500/5 px-3 py-1.5 rounded-xl transition-colors cursor-default">
                      {a}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Travel options */}
            {place.travelOptions.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">How to get here</h2>
                <div className="space-y-2">
                  {place.travelOptions.slice(0, 4).map((opt, i) => {
                    const isFlight = opt.mode === 'flight';
                    return (
                      <div key={i} className="flex items-center gap-4 bg-[#111113] border border-[#222226] hover:border-orange-500/20 rounded-xl px-4 py-3.5 transition-colors">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isFlight ? 'bg-sky-500/15' : 'bg-emerald-500/15'}`}>
                          {isFlight
                            ? <Plane className="w-4 h-4 text-sky-400" strokeWidth={2.2} />
                            : <Train className="w-4 h-4 text-emerald-400" strokeWidth={2.2} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-bold">{opt.from} → {opt.to}</p>
                          <p className="text-white/40 text-xs capitalize mt-0.5">{opt.mode} · {opt.duration}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-orange-400 font-extrabold text-sm">₹{opt.approxCost.toLocaleString()}</p>
                          <p className="text-white/25 text-[10px]">approx.</p>
                        </div>
                      </div>
                    );
                  })}
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
              <Link href={`/itinerary?place=${place.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-sm hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all">
                <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                Add to my trip
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
            </div>

            {/* Best time */}
            <div className="bg-[#111113] border border-[#222226] rounded-2xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                Best Time to Visit
              </p>
              <p className="text-white/70 text-sm leading-relaxed">{place.bestTimeToVisit}</p>
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
              {nearbyPlaces.map(p => {
                const img = getPlaceImage(p.id);
                return (
                  <Link key={p.id} href={`/destination/${p.id}`}
                    className="group bg-[#111113] border border-[#222226] hover:border-orange-500/30 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5">
                    <div className="relative aspect-[4/3] bg-[#1a1a1e] overflow-hidden">
                      {img ? (
                        <Image src={img} alt={p.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">{p.emoji}</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors">{p.name}</h3>
                      <p className="text-white/40 text-xs mt-1 line-clamp-2">{p.tagline}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile CTA */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0A0A0B]/95 backdrop-blur-md border-t border-white/10 p-3">
        <Link href={`/itinerary?place=${place.id}`}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-extrabold text-sm shadow-lg">
          <Sparkles className="w-4 h-4" strokeWidth={2.5} />
          Add {place.name} to my trip
        </Link>
      </div>
    </main>
  );
}
