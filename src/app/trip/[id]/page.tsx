import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MapPin, ArrowRight, IndianRupee, Sparkles, Train, Hotel, Utensils,
  Ticket, Package, Compass,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Itinerary } from '@/lib/types';
import { getPlaceImage } from '@/lib/placeImages';

const COST_ROWS = [
  { key: 'travel' as const,        label: 'Travel',     icon: Train,       color: 'text-sky-400' },
  { key: 'stay' as const,          label: 'Stay',       icon: Hotel,       color: 'text-violet-400' },
  { key: 'food' as const,          label: 'Food',       icon: Utensils,    color: 'text-amber-400' },
  { key: 'entry' as const,         label: 'Entry fees', icon: Ticket,      color: 'text-rose-400' },
  { key: 'miscellaneous' as const, label: 'Misc.',      icon: Package,     color: 'text-emerald-400' },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

interface TripRow {
  title: string;
  duration: number | null;
  itinerary: Itinerary;
}

async function fetchTrip(id: string): Promise<TripRow | null> {
  const { data } = await supabase
    .from('saved_trips')
    .select('title, duration, itinerary')
    .eq('id', id)
    .maybeSingle();
  return data as TripRow | null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const trip = await fetchTrip(id);
  if (!trip) {
    return { title: 'Trip not found — Tourisma', description: 'This shared trip link may have expired.' };
  }

  const { itinerary, title } = trip;
  const meta = (itinerary as unknown as Record<string, unknown>)._meta as
    { options?: { groupSize?: number; stayType?: string } } | undefined;
  const groupSize = meta?.options?.groupSize ?? 1;
  const perPerson = Math.round(itinerary.totalEstimatedCost.total / groupSize);
  const route = itinerary.route.join(' → ');
  const days = trip.duration ?? itinerary.days.length;
  const description = `${days}-day itinerary: ${route}. ₹${perPerson.toLocaleString()}/person. Planned with Tourisma.`;

  // First place image becomes the OG preview
  const firstPlaceId = itinerary.days[0]?.places[0]?.id;
  const firstImage = firstPlaceId ? getPlaceImage(firstPlaceId) : undefined;
  const ogImage = firstImage ? `https://tourisma-v2.vercel.app${firstImage}` : 'https://tourisma-v2.vercel.app/og-image.svg';

  return {
    title: `${title} — Tourisma`,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Tourisma',
      images: [{ url: ogImage, width: 800, height: 600, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function SharedTripPage({ params }: PageProps) {
  const { id } = await params;
  const trip = await fetchTrip(id);

  if (!trip) {
    return (
      <main className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-center px-4">
        <div>
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8 text-white/20" strokeWidth={2.2} />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Trip not found</h2>
          <p className="text-white/40 mb-6">This link may have expired or the trip was deleted.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-sm">
            Plan your own trip
          </Link>
        </div>
      </main>
    );
  }

  const { itinerary } = trip;
  const meta = (itinerary as unknown as Record<string, unknown>)._meta as
    { options?: { groupSize?: number; stayType?: string } } | undefined;
  const groupSize = meta?.options?.groupSize ?? 1;
  const stayType = meta?.options?.stayType ?? 'mid';
  const perPerson = Math.round(itinerary.totalEstimatedCost.total / groupSize);

  return (
    <main className="min-h-screen bg-[#0A0A0B]">
      {/* Hero */}
      <div className="relative bg-[#0d0d10] border-b border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold mb-6">
            <Sparkles className="w-3 h-3" strokeWidth={2.5} />
            Shared itinerary · Tourisma
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">{trip.title}</h1>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            {itinerary.route.map((place, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && <ArrowRight className="w-4 h-4 text-white/20" strokeWidth={2.5} />}
                <span className="bg-white/10 border border-white/15 px-3 py-1.5 rounded-full text-sm font-bold text-white">
                  <MapPin className="w-3 h-3 inline mr-1 -mt-0.5 text-orange-400" strokeWidth={2.5} />
                  {place}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 bg-black/30 rounded-xl border border-white/8 mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">₹{perPerson.toLocaleString()}</span>
              <span className="text-white/40 text-sm font-semibold">/person</span>
            </div>
            <div className="h-8 w-px bg-white/10 hidden sm:block" />
            <div className="text-sm text-white/50">
              Total <span className="font-bold text-white/80">₹{itinerary.totalEstimatedCost.total.toLocaleString()}</span> for {groupSize} traveller{groupSize > 1 ? 's' : ''} · {trip.duration ?? itinerary.days.length} days · <span className="capitalize">{stayType}</span> stay
            </div>
          </div>

          <Link href="/itinerary" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-sm hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all">
            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
            Plan your own trip
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <section className="bg-[#111113] border border-[#222226] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <IndianRupee className="w-5 h-5 text-amber-400" strokeWidth={2.5} />
            <h2 className="text-lg font-extrabold text-white">Cost Breakdown</h2>
          </div>
          <div className="space-y-3">
            {COST_ROWS.map(row => {
              const val = itinerary.totalEstimatedCost[row.key];
              const pct = Math.round((val / (itinerary.totalEstimatedCost.total || 1)) * 100);
              const Icon = row.icon;
              return (
                <div key={row.key} className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${row.color}`} strokeWidth={2.2} />
                  <span className="text-white/60 text-sm w-20 flex-shrink-0">{row.label}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-white text-sm font-bold w-20 text-right flex-shrink-0">₹{val.toLocaleString()}</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-3 border-t border-white/8">
              <span className="text-white font-bold">Total</span>
              <span className="text-white font-extrabold text-lg">₹{itinerary.totalEstimatedCost.total.toLocaleString()}</span>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-white/30 leading-relaxed">
            Estimates based on current rail/road fares and {stayType} stay averages. Actual prices vary by season and booking timing.
          </p>
        </section>

        {itinerary.days.map((day, i) => (
          <section key={i} className="bg-[#111113] border border-[#222226] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-extrabold text-sm">{day.day}</span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">Day {day.day}</p>
                <h3 className="text-white font-extrabold">{day.places.map(p => p.name).join(' + ')}</h3>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {day.places.map(p => (
                <span key={p.id} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-white/70">
                  {p.emoji} {p.name}
                </span>
              ))}
            </div>
            {day.travelNote && (
              <p className="text-white/40 text-xs leading-relaxed">{day.travelNote}</p>
            )}
          </section>
        ))}

        {itinerary.tips.length > 0 && (
          <section className="bg-[#111113] border border-[#222226] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-violet-400" strokeWidth={2.5} />
              <h2 className="text-lg font-extrabold text-white">Travel Tips</h2>
            </div>
            <ul className="space-y-2">
              {itinerary.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/60">
                  <span className="text-orange-400 font-bold flex-shrink-0">·</span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
              <Compass className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-white">Tourisma</span>
          </div>
          <p className="text-white/40 text-sm mb-4">AI-powered India trip planner · Free to use</p>
          <Link href="/itinerary" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all">
            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
            Plan your own trip
          </Link>
        </div>
      </div>
    </main>
  );
}
