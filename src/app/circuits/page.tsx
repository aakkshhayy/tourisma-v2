import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar, MapPin, Sparkles, Compass } from 'lucide-react';
import { getAllCircuitsWithPlaces } from '@/lib/circuits';
import { getPlaceImage } from '@/lib/placeImages';

export const metadata: Metadata = {
  title: 'Pilgrimage Circuits — Tourisma',
  description:
    'Curated multi-temple pilgrimage routes across India: Char Dham, Sapta Puri, Buddhist Circuit, Dwarka-Somnath, Vaishno Devi & Golden Temple, and more. Day-by-day plans with real costs.',
  keywords:
    'char dham yatra, do dham, sapta puri, buddhist circuit, vaishno devi tour, golden temple amritsar, jyotirlinga tour, india pilgrimage, kedarnath badrinath, dwarka somnath',
  openGraph: {
    title: 'Pilgrimage Circuits — Tourisma',
    description: 'Curated multi-temple pilgrimage routes across India with day-by-day plans and real costs.',
    type: 'website',
    siteName: 'Tourisma',
  },
};

const TYPE_BADGE: Record<string, string> = {
  hindu:    'bg-orange-500/15 text-orange-300 border-orange-500/30',
  buddhist: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  sikh:     'bg-amber-500/15 text-amber-300 border-amber-500/30',
  multi:    'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

const TYPE_LABEL: Record<string, string> = {
  hindu:    'Hindu',
  buddhist: 'Buddhist',
  sikh:     'Sikh',
  multi:    'Multi-faith',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatMonths(months: number[]): string {
  if (months.length === 12) return 'Year-round';
  if (months.length === 0) return '—';
  // Group consecutive months
  const sorted = [...months].sort((a, b) => a - b);
  const groups: number[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const last = groups[groups.length - 1];
    if (sorted[i] === last[last.length - 1] + 1) last.push(sorted[i]);
    else groups.push([sorted[i]]);
  }
  return groups
    .map(g => g.length === 1 ? MONTH_NAMES[g[0] - 1] : `${MONTH_NAMES[g[0] - 1]}–${MONTH_NAMES[g[g.length - 1] - 1]}`)
    .join(', ');
}

export default function CircuitsIndex() {
  const circuits = getAllCircuitsWithPlaces();

  return (
    <main className="min-h-screen bg-[#0A0A0B]">
      {/* Hero */}
      <section className="relative border-b border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[100px]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
            Sacred journeys, curated
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Pilgrimage{' '}
            <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Circuits
            </span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl">
            Six time-honoured spiritual routes across India — Char Dham, Sapta Puri, Buddhist Mahaparinirvan, and more. Each comes with a day-by-day plan and real cost estimates for your group.
          </p>
        </div>
      </section>

      {/* Circuit grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {circuits.map(c => {
            const heroImg = c.places[0]?.id ? getPlaceImage(c.places[0].id) : undefined;
            return (
              <Link
                key={c.id}
                href={`/circuits/${c.id}`}
                className="group relative bg-[#111113] border border-[#222226] hover:border-orange-500/40 rounded-2xl overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] hover:-translate-y-0.5"
              >
                {/* Image header */}
                <div className="relative aspect-[16/9] bg-[#1a1a1e] overflow-hidden">
                  {heroImg && (
                    <Image
                      src={heroImg}
                      alt={c.name}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-15 mix-blend-overlay`} />

                  {/* Type badge */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border backdrop-blur-md ${TYPE_BADGE[c.type]}`}>
                      {TYPE_LABEL[c.type]}
                    </span>
                  </div>

                  {/* Title overlay */}
                  <div className="absolute bottom-3 left-4 right-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{c.emoji}</span>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-lg">{c.name}</h2>
                    </div>
                    <p className="text-white/80 text-sm font-medium drop-shadow line-clamp-1">{c.tagline}</p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  <p className="text-white/50 text-sm mb-4 line-clamp-2 leading-relaxed">{c.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {c.places.map(p => (
                      <span key={p.id} className="text-[11px] font-semibold text-white/70 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        {p.emoji} {p.name}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/8">
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" strokeWidth={2.5} />
                        <span className="font-semibold text-white/70">{c.suggestedDays} days</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" strokeWidth={2.5} />
                        {c.places.length} places
                      </span>
                      <span className="hidden sm:flex items-center gap-1 capitalize">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          c.difficulty === 'easy' ? 'bg-emerald-400' :
                          c.difficulty === 'moderate' ? 'bg-amber-400' : 'bg-rose-400'
                        }`} />
                        {c.difficulty}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" strokeWidth={2.5} />
                  </div>

                  <p className="mt-3 text-[11px] text-white/30">
                    Best: {formatMonths(c.bestMonths)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center bg-gradient-to-br from-orange-500/10 to-amber-400/5 border border-orange-500/20 rounded-2xl p-8">
          <Compass className="w-10 h-10 text-orange-400 mx-auto mb-3" strokeWidth={2.2} />
          <h3 className="text-xl font-extrabold text-white mb-2">Don&apos;t see your pilgrimage?</h3>
          <p className="text-white/50 text-sm mb-5 max-w-xl mx-auto">
            Build a custom yatra by picking your own holy sites — temples, ghats, gurudwaras, dargahs, and more.
          </p>
          <Link href="/itinerary" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-extrabold text-sm hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all">
            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
            Build my own yatra
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
        </div>
      </section>
    </main>
  );
}
