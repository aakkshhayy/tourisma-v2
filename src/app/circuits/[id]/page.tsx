import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Calendar, MapPin, Sparkles, Info,
  AlertTriangle, Train, Plane, Clock, Star,
} from 'lucide-react';
import { CIRCUITS, getCircuitById } from '@/lib/circuits';
import { getPlaceImage } from '@/lib/placeImages';
import { getStateById } from '@/lib/places';

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return CIRCUITS.map(c => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const c = getCircuitById(id);
  if (!c) return { title: 'Circuit not found' };

  const route = c.places.map(p => p.name).join(' → ');
  const description = `${c.suggestedDays}-day ${c.name}: ${route}. ${c.tagline}.`;
  const heroImg = c.places[0]?.id ? getPlaceImage(c.places[0].id) : undefined;
  const ogImage = heroImg ? `https://tourisma-v2.vercel.app${heroImg}` : 'https://tourisma-v2.vercel.app/og-image.svg';

  return {
    title: `${c.name} — ${c.suggestedDays}-day pilgrimage circuit | Tourisma`,
    description,
    keywords: `${c.name.toLowerCase()}, ${c.places.map(p => p.name.toLowerCase()).join(', ')}, ${c.type} pilgrimage, india yatra`,
    openGraph: {
      title: `${c.name} — ${c.suggestedDays} days`,
      description,
      type: 'website',
      siteName: 'Tourisma',
      images: [{ url: ogImage, width: 800, height: 600, alt: c.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: c.name,
      description,
      images: [ogImage],
    },
  };
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TYPE_LABEL: Record<string, string> = {
  hindu: 'Hindu pilgrimage', buddhist: 'Buddhist circuit', sikh: 'Sikh pilgrimage', multi: 'Multi-faith pilgrimage',
};

export default async function CircuitDetailPage({ params }: PageProps) {
  const { id } = await params;
  const circuit = getCircuitById(id);
  if (!circuit) notFound();

  const heroImg = circuit.places[0]?.id ? getPlaceImage(circuit.places[0].id) : undefined;
  const placeIdsParam = circuit.places.map(p => p.id).join(',');

  return (
    <main className="min-h-screen bg-[#0A0A0B]">
      {/* Hero */}
      <section className="relative border-b border-white/5 overflow-hidden">
        {heroImg && (
          <div className="absolute inset-0">
            <Image src={heroImg} alt={circuit.name} fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/85 to-[#0A0A0B]/40" />
            <div className={`absolute inset-0 bg-gradient-to-br ${circuit.gradient} opacity-20 mix-blend-overlay`} />
          </div>
        )}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <Link href="/circuits" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-semibold mb-6 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
            All circuits
          </Link>

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90">
              {TYPE_LABEL[circuit.type]}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 capitalize">
              {circuit.difficulty}
            </span>
          </div>

          <div className="flex items-start gap-4 mb-3">
            <span className="text-5xl drop-shadow-lg">{circuit.emoji}</span>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight drop-shadow-lg mb-2">
                {circuit.name}
              </h1>
              <p className="text-white/80 text-base sm:text-lg drop-shadow">{circuit.tagline}</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6 max-w-2xl">
            <div className="bg-black/40 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2.5">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Duration</p>
              <p className="text-white font-extrabold text-sm flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-orange-400" strokeWidth={2.5} />
                {circuit.suggestedDays} days
              </p>
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2.5">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Sites</p>
              <p className="text-white font-extrabold text-sm flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-400" strokeWidth={2.5} />
                {circuit.places.length} places
              </p>
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2.5">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Best months</p>
              <p className="text-white font-extrabold text-sm flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" strokeWidth={2.5} />
                {circuit.bestMonths.length === 12 ? 'Year-round' : circuit.bestMonths.map(m => MONTH_NAMES[m - 1]).join(', ')}
              </p>
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2.5">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Difficulty</p>
              <p className="text-white font-extrabold text-sm flex items-center gap-1.5 capitalize">
                <span className={`w-2 h-2 rounded-full ${
                  circuit.difficulty === 'easy' ? 'bg-emerald-400' :
                  circuit.difficulty === 'moderate' ? 'bg-amber-400' : 'bg-rose-400'
                }`} />
                {circuit.difficulty}
              </p>
            </div>
          </div>

          {/* Build my trip CTA */}
          <Link
            href={`/itinerary?places=${placeIdsParam}&duration=${circuit.suggestedDays}&type=pilgrimage`}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-extrabold text-sm hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all"
          >
            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
            Build my {circuit.suggestedDays}-day yatra
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* About + Significance */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-[#111113] border border-[#222226] rounded-2xl p-6">
            <h2 className="text-base font-extrabold text-white mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-orange-400" strokeWidth={2.5} />
              About this circuit
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">{circuit.description}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/15 rounded-2xl p-6">
            <h2 className="text-base font-extrabold text-white mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" strokeWidth={2.5} />
              Significance
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">{circuit.significance}</p>
          </div>
        </section>

        {/* Route — sequential places */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-extrabold text-white">The route</h2>
            <p className="text-white/40 text-xs">{circuit.places.length} stops · approx {circuit.suggestedDays} days</p>
          </div>
          <div className="space-y-3">
            {circuit.places.map((p, i) => {
              const stateInfo = getStateById(p.state);
              const img = getPlaceImage(p.id);
              return (
                <Link
                  key={p.id}
                  href={`/destination/${p.id}`}
                  className="group flex gap-4 bg-[#111113] border border-[#222226] hover:border-orange-500/30 rounded-2xl overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.08)]"
                >
                  {/* Step number column */}
                  <div className="flex-shrink-0 flex flex-col items-center pt-5 pl-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center font-extrabold text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                      {i + 1}
                    </div>
                    {i < circuit.places.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-orange-500/50 to-orange-500/0 mt-2" />
                    )}
                  </div>

                  {/* Image */}
                  <div className="relative w-32 sm:w-44 flex-shrink-0 bg-[#1a1a1e]">
                    {img ? (
                      <Image src={img} alt={p.name} fill sizes="(min-width: 640px) 11rem, 8rem" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">{p.emoji}</div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 p-4 sm:p-5 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-extrabold text-white text-base sm:text-lg truncate group-hover:text-orange-400 transition-colors">{p.name}</h3>
                      <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" strokeWidth={2.5} />
                    </div>
                    <p className="text-white/40 text-xs flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3" strokeWidth={2.2} />
                      {stateInfo?.name}
                    </p>
                    <p className="text-white/60 text-sm line-clamp-2 leading-relaxed mb-3">{p.tagline}</p>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="bg-white/5 border border-white/10 text-white/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" strokeWidth={2.5} />
                        {p.recommendedDays}d
                      </span>
                      {p.nearestRailway?.station && (
                        <span className="hidden sm:flex bg-white/5 border border-white/10 text-white/60 px-2 py-0.5 rounded-full items-center gap-1">
                          <Train className="w-2.5 h-2.5" strokeWidth={2.5} />
                          {p.nearestRailway.station} · {p.nearestRailway.distanceKm}km
                        </span>
                      )}
                      {p.nearestAirport?.airport && (
                        <span className="hidden sm:flex bg-white/5 border border-white/10 text-white/60 px-2 py-0.5 rounded-full items-center gap-1">
                          <Plane className="w-2.5 h-2.5" strokeWidth={2.5} />
                          {p.nearestAirport.airport} · {p.nearestAirport.distanceKm}km
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Practical notes */}
        {circuit.notes.length > 0 && (
          <section className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-6">
            <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" strokeWidth={2.5} />
              Practical notes for pilgrims
            </h2>
            <ul className="space-y-2.5">
              {circuit.notes.map((n, i) => (
                <li key={i} className="flex items-start gap-2 text-white/70 text-sm leading-relaxed">
                  <span className="text-amber-400 font-extrabold flex-shrink-0 mt-0.5">·</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="text-center bg-gradient-to-br from-orange-500/10 to-amber-400/5 border border-orange-500/20 rounded-2xl p-8">
          <Sparkles className="w-10 h-10 text-orange-400 mx-auto mb-3" strokeWidth={2.2} />
          <h3 className="text-xl font-extrabold text-white mb-2">Ready for the {circuit.name}?</h3>
          <p className="text-white/50 text-sm mb-5 max-w-xl mx-auto">
            Tourisma builds you a complete day-by-day itinerary with travel routes, stay costs, and budgeted estimates for your group size.
          </p>
          <Link
            href={`/itinerary?places=${placeIdsParam}&duration=${circuit.suggestedDays}&type=pilgrimage`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-extrabold text-sm hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all"
          >
            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
            Build my {circuit.suggestedDays}-day yatra
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
        </section>
      </div>
    </main>
  );
}
