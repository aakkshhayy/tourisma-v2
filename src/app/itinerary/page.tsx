'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles, Calendar, Users, Hotel, Train, Bus, Car, Plane,
  Wallet, MapPin, Plus, Check, X, ArrowRight, Lightbulb,
  ChevronLeft, Wand2, Loader2, Download, Share2, Bookmark,
  Search, IndianRupee, Zap, Scale, Trophy, Route, Clock,
  Utensils, Ticket, Package, Info,
} from 'lucide-react';
import { PLACES, STATES, getPlaceById, getStateById } from '@/lib/places';
import { ORIGIN_CITIES, getOriginById } from '@/lib/origins';
import { generateItinerary, getRecommendedDays } from '@/lib/itineraryGenerator';
import { useItineraryStore } from '@/store/itineraryStore';
import type { Itinerary } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';

const STAY_OPTIONS = [
  { id: 'budget' as const, label: 'Budget', desc: 'Hostels · sleeper trains' },
  { id: 'mid' as const, label: 'Standard', desc: '3-star · 3AC trains' },
  { id: 'luxury' as const, label: 'Premium', desc: '4-5 star · 1AC trains' },
];

const TRAVEL_MODE_OPTIONS = [
  { id: 'train' as const, label: 'Train', icon: Train },
  { id: 'bus' as const, label: 'Bus', icon: Bus },
  { id: 'cab' as const, label: 'Cab', icon: Car },
];

const COST_ITEMS = [
  { key: 'travel' as const, label: 'Travel', icon: Train, color: 'text-sky-400' },
  { key: 'stay' as const, label: 'Stay', icon: Hotel, color: 'text-violet-400' },
  { key: 'food' as const, label: 'Food', icon: Utensils, color: 'text-amber-400' },
  { key: 'entry' as const, label: 'Entry', icon: Ticket, color: 'text-rose-400' },
  { key: 'miscellaneous' as const, label: 'Misc.', icon: Package, color: 'text-emerald-400' },
];

const TRAVEL_ICONS: Record<string, React.ElementType> = {
  train: Train, bus: Bus, cab: Car, flight: Plane, shared_jeep: Car,
};

const LOADING_MESSAGES = [
  'Routing from your city…',
  'Calculating distances and durations…',
  'Comparing train, bus and flight options…',
  'Estimating stay, food and entry costs…',
  'Planning your perfect trip…',
];

function ItineraryContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { selectedPlaces, options, setOptions, togglePlace, isSelected, clearSelection, addPlace } = useItineraryStore();

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [generated, setGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [placeSearch, setPlaceSearch] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  // Read query params on mount
  useEffect(() => {
    const fromParam = searchParams.get('from');
    const durationParam = searchParams.get('duration');
    if (fromParam) setOptions({ originCityId: fromParam });
    if (durationParam) setOptions({ numDays: parseInt(durationParam) || 5 });
  }, [searchParams, setOptions]);

  const filteredPlaces = useMemo(() => {
    const q = placeSearch.trim().toLowerCase();
    if (!q) return PLACES;
    return PLACES.filter(p => {
      const stateName = getStateById(p.state)?.name?.toLowerCase() ?? '';
      return p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q) || stateName.includes(q);
    });
  }, [placeSearch]);

  const handleGenerate = useCallback(() => {
    if (selectedPlaces.length === 0) return;
    setIsGenerating(true);
    setLoadingMsgIndex(0);
    const interval = setInterval(() => {
      setLoadingMsgIndex(i => Math.min(i + 1, LOADING_MESSAGES.length - 1));
    }, 280);
    setTimeout(() => {
      clearInterval(interval);
      const result = generateItinerary(selectedPlaces, options);
      setItinerary(result);
      setGenerated(true);
      setIsGenerating(false);
      setTimeout(() => {
        document.getElementById('itinerary-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }, 1400);
  }, [selectedPlaces, options]);

  const handleReset = () => { setItinerary(null); setGenerated(false); };

  const handleDownload = () => {
    if (!itinerary) return;
    const origin = getOriginById(options.originCityId);
    const lines: string[] = [];
    lines.push('TOURISMA — TRIP ITINERARY');
    lines.push('='.repeat(40));
    lines.push(`From: ${origin?.name ?? '—'}`);
    lines.push(`Duration: ${options.numDays} days  Group: ${options.groupSize}  Stay: ${options.stayType}`);
    lines.push('');
    lines.push(`Route: ${itinerary.route.join(' → ')}`);
    lines.push(`Distance: ${itinerary.totalDistanceKm.toLocaleString()} km`);
    lines.push('');
    lines.push('DAY-BY-DAY');
    lines.push('-'.repeat(40));
    itinerary.days.forEach(d => {
      lines.push(`Day ${d.day}: ${d.places.map(p => p.name).join(' & ')}`);
      lines.push(`  ${d.travelNote}`);
    });
    lines.push('');
    lines.push('COST ESTIMATE (₹)');
    lines.push('-'.repeat(40));
    const c = itinerary.totalEstimatedCost;
    lines.push(`Travel : ${c.travel.toLocaleString()}`);
    lines.push(`Stay   : ${c.stay.toLocaleString()}`);
    lines.push(`Food   : ${c.food.toLocaleString()}`);
    lines.push(`Entry  : ${c.entry.toLocaleString()}`);
    lines.push(`Misc.  : ${c.miscellaneous.toLocaleString()}`);
    lines.push(`TOTAL  : ${c.total.toLocaleString()}`);
    lines.push(`Per person : ${Math.round(c.total / options.groupSize).toLocaleString()}`);
    lines.push('');
    lines.push('TIPS');
    lines.push('-'.repeat(40));
    itinerary.tips.forEach(t => lines.push(`• ${t}`));
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tourisma-${options.numDays}day-trip.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!itinerary) return;
    const origin = getOriginById(options.originCityId);
    const text = `${options.numDays}-day India trip from ${origin?.name ?? 'home'}: ${itinerary.route.join(' → ')}. Total ≈ ₹${itinerary.totalEstimatedCost.total.toLocaleString()} for ${options.groupSize}. Planned with Tourisma.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My India Trip', text, url: location.href });
      } else {
        await navigator.clipboard.writeText(text + '\n' + location.href);
        setShareMsg('Copied to clipboard!');
        setTimeout(() => setShareMsg(null), 2500);
      }
    } catch { /* user cancelled */ }
  };

  const handleSaveTrip = async () => {
    if (!itinerary) return;
    if (!user) { setShowAuth(true); return; }
    setSaveStatus('saving');
    const origin = getOriginById(options.originCityId);
    const title = `${options.numDays}-day trip from ${origin?.name ?? 'home'}: ${itinerary.route.join(' → ')}`;
    const { error } = await supabase.from('saved_trips').insert({
      user_id: user.id, title,
      duration: options.numDays,
      budget: options.stayType,
      itinerary: itinerary as unknown as Record<string, unknown>,
    });
    setSaveStatus(error ? 'error' : 'saved');
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const loadSample = () => {
    clearSelection();
    setOptions({ originCityId: 'patna', numDays: 5 });
    ['sk_gangtok', 'sk_lachung'].forEach(id => {
      const p = getPlaceById(id);
      if (p) addPlace(p);
    });
  };

  const origin = getOriginById(options.originCityId);

  return (
    <main className="min-h-screen bg-[#0A0A0B]">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Header */}
      <div className="relative bg-[#0d0d10] border-b border-white/5 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px]" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
              Itinerary Builder
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">Plan your trip</h1>
            <p className="text-white/40 text-lg max-w-2xl">
              Pick your origin, choose destinations, set preferences. Get routes, day-by-day plans, and real cost estimates instantly.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Step 1 — Origin */}
        <motion.section
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="bg-gradient-to-br from-orange-500/5 via-orange-500/3 to-transparent border border-orange-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              <span className="text-white font-extrabold text-sm">1</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-extrabold text-white">Where are you starting from?</h2>
              <p className="text-white/40 text-sm mt-1">We route the entire trip from your home city — outbound, in-between, and return.</p>
            </div>
            {origin && (
              <span className="hidden sm:flex items-center gap-2 text-sm font-bold text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                {origin.emoji} {origin.name}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {ORIGIN_CITIES.map(o => (
              <button key={o.id} onClick={() => setOptions({ originCityId: o.id })}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all
                  ${options.originCityId === o.id
                    ? 'bg-white text-[#0A0A0B] shadow-sm'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20 hover:text-white'}`}>
                {o.emoji} {o.name}
              </button>
            ))}
          </div>
        </motion.section>

        {/* Step 2 — Choose Places */}
        <motion.section
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-[#111113] border border-[#222226] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-orange-400 font-extrabold text-sm">2</span>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Choose destinations</h2>
                <p className="text-white/40 text-sm mt-0.5">
                  <span className="font-bold text-white">{selectedPlaces.length}</span> selected
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/explore" className="text-xs font-semibold text-white/50 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl transition-colors">
                Browse all
              </Link>
              {selectedPlaces.length > 0 && (
                <button onClick={clearSelection} className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                  <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {selectedPlaces.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5 p-4 bg-orange-500/5 border border-orange-500/15 rounded-xl">
              {selectedPlaces.map(p => (
                <div key={p.id} className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-sm">
                  <span>{p.emoji}</span>
                  <span className="font-semibold text-white">{p.name}</span>
                  <button onClick={() => togglePlace(p)} className="text-white/40 hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={2.2} />
            <input
              type="text"
              placeholder="Search places, states…"
              value={placeSearch}
              onChange={e => setPlaceSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-all"
            />
            {placeSearch && (
              <button onClick={() => setPlaceSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/60 flex items-center justify-center transition-colors">
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>

          {filteredPlaces.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm font-bold text-white">No matches for &quot;{placeSearch}&quot;</p>
              <button onClick={() => setPlaceSearch('')} className="mt-2 text-xs text-orange-400 font-bold hover:underline">Clear search</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto pr-1">
              {filteredPlaces.map(p => {
                const sel = isSelected(p.id);
                return (
                  <button key={p.id} onClick={() => togglePlace(p)}
                    className={`group flex items-center gap-2.5 p-3 rounded-xl text-left text-sm transition-all border
                      ${sel ? 'border-orange-500/50 bg-orange-500/10' : 'border-white/5 bg-white/3 hover:border-white/15 hover:bg-white/5'}`}>
                    <span className="text-xl flex-shrink-0">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold truncate text-sm ${sel ? 'text-orange-400' : 'text-white'}`}>{p.name}</div>
                      <div className="text-[11px] text-white/30 truncate">{getStateById(p.state)?.name}</div>
                    </div>
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all
                      ${sel ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/30'}`}>
                      {sel ? <Check className="w-3 h-3" strokeWidth={3} /> : <Plus className="w-3 h-3" strokeWidth={2.5} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Step 3 — Configure */}
        <motion.section
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[#111113] border border-[#222226] rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-orange-400 font-extrabold text-sm">3</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Configure your trip</h2>
              <p className="text-white/40 text-sm mt-0.5">Set duration, group size, and preferences</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Duration */}
            <div className="bg-white/3 border border-white/8 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-orange-400" strokeWidth={2.5} />
                <label className="text-sm font-bold text-white">Duration</label>
              </div>
              <div className="flex items-center justify-between bg-[#0A0A0B] rounded-xl p-1 border border-white/5">
                <button onClick={() => setOptions({ numDays: Math.max(1, options.numDays - 1) })} className="w-10 h-10 rounded-lg hover:bg-white/10 transition-colors font-bold text-xl text-white/60">−</button>
                <span className="text-2xl font-extrabold text-white">{options.numDays}</span>
                <button onClick={() => setOptions({ numDays: Math.min(30, options.numDays + 1) })} className="w-10 h-10 rounded-lg hover:bg-white/10 transition-colors font-bold text-xl text-white/60">+</button>
              </div>
              {(() => {
                const rec = getRecommendedDays(selectedPlaces);
                if (!rec) return null;
                if (rec === options.numDays) return <p className="mt-2 text-xs text-emerald-400 font-semibold flex items-center gap-1"><Check className="w-3 h-3" strokeWidth={3} />Ideal duration</p>;
                return (
                  <button onClick={() => setOptions({ numDays: rec })}
                    className="mt-2 w-full text-left text-xs text-violet-400 font-semibold bg-violet-500/10 border border-violet-500/20 px-2.5 py-1.5 rounded-lg hover:bg-violet-500/15 transition-colors">
                    <Sparkles className="w-3 h-3 inline mr-1" strokeWidth={2.5} />
                    Recommended: {rec} days — tap to apply
                  </button>
                );
              })()}
            </div>

            {/* Group Size */}
            <div className="bg-white/3 border border-white/8 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-orange-400" strokeWidth={2.5} />
                <label className="text-sm font-bold text-white">Group Size</label>
              </div>
              <div className="flex items-center justify-between bg-[#0A0A0B] rounded-xl p-1 border border-white/5">
                <button onClick={() => setOptions({ groupSize: Math.max(1, options.groupSize - 1) })} className="w-10 h-10 rounded-lg hover:bg-white/10 transition-colors font-bold text-xl text-white/60">−</button>
                <span className="text-2xl font-extrabold text-white">{options.groupSize}</span>
                <button onClick={() => setOptions({ groupSize: Math.min(20, options.groupSize + 1) })} className="w-10 h-10 rounded-lg hover:bg-white/10 transition-colors font-bold text-xl text-white/60">+</button>
              </div>
            </div>

            {/* Stay type */}
            <div className="bg-white/3 border border-white/8 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Hotel className="w-4 h-4 text-orange-400" strokeWidth={2.5} />
                <label className="text-sm font-bold text-white">Stay Type</label>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {STAY_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => setOptions({ stayType: opt.id })}
                    className={`px-2 py-2.5 rounded-xl text-xs transition-all font-bold
                      ${options.stayType === opt.id ? 'bg-white text-[#0A0A0B]' : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Travel mode */}
            <div className="bg-white/3 border border-white/8 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Train className="w-4 h-4 text-orange-400" strokeWidth={2.5} />
                <label className="text-sm font-bold text-white">Preferred Travel</label>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {TRAVEL_MODE_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button key={opt.id} onClick={() => setOptions({ travelMode: opt.id })}
                      className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs transition-all font-bold
                        ${options.travelMode === opt.id ? 'bg-white text-[#0A0A0B]' : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'}`}>
                      <Icon className="w-4 h-4" strokeWidth={2.2} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Optimise for */}
          <div className="mt-4 bg-white/3 border border-white/8 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-violet-400" strokeWidth={2.5} />
              <label className="text-sm font-bold text-white">Optimise route for</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'cost' as const, icon: IndianRupee, label: 'Lowest cost' },
                { id: 'balanced' as const, icon: Scale, label: 'Balanced' },
                { id: 'time' as const, icon: Zap, label: 'Fastest time' },
              ]).map(opt => {
                const Icon = opt.icon;
                const sel = options.optimisation === opt.id;
                return (
                  <button key={opt.id} onClick={() => setOptions({ optimisation: opt.id })}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-bold border-2 transition-all
                      ${sel ? 'bg-violet-600 text-white border-violet-500' : 'bg-white/3 text-white/50 border-white/8 hover:border-violet-500/30 hover:text-white/80'}`}>
                    <Icon className="w-4 h-4" strokeWidth={2.5} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate button */}
          <button onClick={handleGenerate} disabled={selectedPlaces.length === 0 || isGenerating}
            className={`mt-5 w-full flex items-center justify-center gap-3 py-5 rounded-xl font-extrabold text-base transition-all
              ${selectedPlaces.length === 0 || isGenerating
                ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/8'
                : 'bg-gradient-to-r from-orange-500 to-amber-400 text-white hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] active:scale-[0.99]'}`}>
            {isGenerating
              ? <><Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />Generating…</>
              : <><Wand2 className="w-5 h-5" strokeWidth={2.5} />Generate Trip Plan<ArrowRight className="w-5 h-5" strokeWidth={2.5} /></>}
          </button>

          {selectedPlaces.length === 0 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              <span className="text-white/30">Need inspiration?</span>
              <button onClick={loadSample} className="text-orange-400 font-bold hover:underline flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
                Try Patna → Sikkim
              </button>
            </div>
          )}
        </motion.section>

        {/* Loading state */}
        {isGenerating && (
          <div className="bg-gradient-to-br from-orange-500/5 to-amber-400/3 border border-orange-500/20 rounded-2xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 mb-5 shadow-[0_0_30px_rgba(249,115,22,0.4)]">
              <Loader2 className="w-8 h-8 text-white animate-spin" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-2">Planning your perfect trip…</h3>
            <p key={loadingMsgIndex} className="text-white/50 text-sm">{LOADING_MESSAGES[loadingMsgIndex]}</p>
            <div className="mt-5 flex items-center justify-center gap-1.5">
              {LOADING_MESSAGES.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= loadingMsgIndex ? 'bg-orange-500 w-8' : 'bg-white/10 w-3'}`} />
              ))}
            </div>
          </div>
        )}

        {/* Generated itinerary */}
        {generated && itinerary && !isGenerating && (
          <div id="itinerary-result" className="space-y-5">
            {/* Summary */}
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="relative bg-gradient-to-br from-[#1a0e00] to-[#111113] border border-orange-500/20 rounded-2xl p-6 sm:p-8 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-orange-400 mb-3">
                  <Check className="w-4 h-4" strokeWidth={3} />
                  Trip ready
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3">
                  Your {options.numDays}-day adventure
                </h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/50 mb-5">
                  <span>From {origin?.name ?? '—'}</span>
                  <span>·</span>
                  <span>{options.groupSize} traveller{options.groupSize > 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span className="capitalize">{options.stayType} stay</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {origin && (
                    <>
                      <span className="bg-orange-500/20 border border-orange-500/30 px-3 py-1.5 rounded-full text-sm font-bold text-orange-300 whitespace-nowrap">{origin.name}</span>
                      <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0" strokeWidth={2.5} />
                    </>
                  )}
                  {itinerary.route.map((place, i) => (
                    <div key={i} className="flex items-center gap-2 flex-shrink-0">
                      {i > 0 && <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0" strokeWidth={2.5} />}
                      <span className="bg-white/10 border border-white/15 px-3 py-1.5 rounded-full text-sm font-bold text-white whitespace-nowrap">
                        <MapPin className="w-3 h-3 inline mr-1 -mt-0.5 text-orange-400" strokeWidth={2.5} />
                        {place}
                      </span>
                    </div>
                  ))}
                  {origin && (
                    <>
                      <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0" strokeWidth={2.5} />
                      <span className="bg-orange-500/20 border border-orange-500/30 px-3 py-1.5 rounded-full text-sm font-bold text-orange-300 whitespace-nowrap">{origin.name}</span>
                    </>
                  )}
                </div>
              </div>
            </motion.section>

            {/* Travel Route */}
            {itinerary.journey.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-[#111113] border border-[#222226] rounded-2xl p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                      <Route className="w-5 h-5 text-sky-400" strokeWidth={2.2} />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-white">Travel Route</h2>
                      <p className="text-white/40 text-sm">Round trip from {origin?.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Distance</p>
                      <p className="text-white font-extrabold">{itinerary.totalDistanceKm.toLocaleString()} km</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Travel time</p>
                      <p className="text-white font-extrabold">{Math.floor(itinerary.totalTravelHours)}h {Math.round((itinerary.totalTravelHours % 1) * 60)}m</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {itinerary.journey.map((leg, i) => {
                    const cheapest = leg.options.reduce((a, b) => (a.cost <= b.cost ? a : b));
                    const fastest = leg.options.reduce((a, b) => (a.durationHours <= b.durationHours ? a : b));
                    return (
                      <div key={i} className={`rounded-xl border p-4 ${leg.isReturn ? 'border-dashed border-white/10 bg-white/2' : 'border-white/8 bg-white/3'}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-[#0A0A0B] text-white flex items-center justify-center text-xs font-extrabold">{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                              <span className="truncate">{leg.from}</span>
                              <ArrowRight className="w-3 h-3 text-orange-400 flex-shrink-0" strokeWidth={2.5} />
                              <span className="truncate">{leg.to}</span>
                              {leg.isReturn && <span className="text-[10px] font-bold text-white/30 bg-white/5 px-1.5 py-0.5 rounded ml-1">return</span>}
                            </div>
                            <p className="text-xs text-white/40 mt-0.5">
                              <span className="font-bold text-white/70 capitalize">{leg.mode}</span> · ₹{leg.cost.toLocaleString()} · {Math.floor(leg.durationHours)}h {Math.round((leg.durationHours % 1) * 60)}m
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {leg.options.map((o, j) => {
                            const ModeIcon = o.mode === 'flight' ? Plane : o.mode === 'bus' ? Bus : o.mode === 'cab' ? Car : Train;
                            const isPicked = o.mode === leg.mode;
                            const isCheapest = o.mode === cheapest.mode && o.cost === cheapest.cost;
                            const isFastest = o.mode === fastest.mode && o.durationHours === fastest.durationHours;
                            return (
                              <div key={j} className={`relative p-2.5 rounded-xl border-2 ${isPicked ? 'border-orange-500/50 bg-orange-500/10' : 'border-white/8 bg-white/3'}`}>
                                {isPicked && <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">Picked</span>}
                                <div className="flex items-center gap-1 mb-1">
                                  <ModeIcon className="w-3.5 h-3.5 text-white/60" strokeWidth={2.5} />
                                  <span className="text-[11px] font-extrabold text-white capitalize">{o.mode}</span>
                                </div>
                                <div className="font-extrabold text-white text-sm">₹{o.cost.toLocaleString()}</div>
                                <div className="text-[11px] text-white/40">{Math.floor(o.durationHours)}h {Math.round((o.durationHours % 1) * 60)}m</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {isCheapest && isFastest && (
                                    <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded flex items-center gap-0.5">
                                      <Trophy className="w-2.5 h-2.5" strokeWidth={2.5} />Best
                                    </span>
                                  )}
                                  {isCheapest && !isFastest && (
                                    <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">Cheapest</span>
                                  )}
                                  {isFastest && !isCheapest && (
                                    <span className="text-[9px] font-extrabold text-sky-400 bg-sky-500/10 px-1 py-0.5 rounded">Fastest</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* Cost Breakdown */}
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-[#111113] border border-[#222226] rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-400" strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">Cost Breakdown</h2>
                  <p className="text-white/40 text-sm">All-inclusive for your group</p>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-6 mb-6">
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">Total estimated cost</p>
                <div className="text-5xl sm:text-6xl font-extrabold text-white">
                  ₹{itinerary.totalEstimatedCost.total.toLocaleString()}
                </div>
                <p className="text-white/40 text-sm mt-2">
                  ≈ <span className="font-bold text-white">₹{Math.round(itinerary.totalEstimatedCost.total / options.groupSize).toLocaleString()}</span> per person · {options.groupSize} traveller{options.groupSize > 1 ? 's' : ''} · {options.numDays} days
                </p>
              </div>

              <div className="space-y-3">
                {COST_ITEMS.map(item => {
                  const value = itinerary.totalEstimatedCost[item.key];
                  const total = itinerary.totalEstimatedCost.total || 1;
                  const pct = Math.round((value / total) * 100);
                  const Icon = item.icon;
                  return (
                    <div key={item.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${item.color}`} strokeWidth={2.5} />
                          <span className="text-sm font-semibold text-white">{item.label}</span>
                          <span className="text-xs text-white/30">{pct}%</span>
                        </div>
                        <span className="text-sm font-extrabold text-white">₹{value.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex items-start gap-2 bg-white/3 border border-white/8 rounded-xl p-4">
                <Info className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <p className="text-xs text-white/40 leading-relaxed">
                  Estimates based on <span className="font-semibold capitalize text-white/60">{options.stayType}</span> travel averages. Actual costs vary by season, booking timing, and shopping. Use as a planning baseline.
                </p>
              </div>
            </motion.section>

            {/* Day-by-day */}
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-[#111113] border border-[#222226] rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-violet-400" strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">Day-by-day Plan</h2>
                  <p className="text-white/40 text-sm">{itinerary.days.length} days · {itinerary.route.length} destinations</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-violet-500 via-violet-500/30 to-transparent" />
                <div className="space-y-5">
                  {itinerary.days.map(day => {
                    const TravelIcon = TRAVEL_ICONS[day.places[0]?.travelOptions?.[0]?.mode ?? 'train'] ?? Train;
                    return (
                      <div key={day.day} className="relative flex gap-5">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 text-white flex flex-col items-center justify-center font-extrabold text-xs shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                            <span className="text-[8px] uppercase tracking-wider opacity-70">Day</span>
                            <span className="text-sm leading-none">{day.day}</span>
                          </div>
                        </div>
                        <div className="flex-1 bg-white/3 border border-white/8 rounded-xl p-5">
                          <h3 className="font-extrabold text-white leading-tight mb-1">
                            {day.places.map(p => p.name).join(' & ')}
                          </h3>
                          <p className="text-white/50 text-sm mb-4 leading-relaxed">{day.travelNote}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {day.places.map(p => {
                              const stateInfo = getStateById(p.state);
                              return (
                                <Link key={p.id} href={`/destination/${p.id}`}
                                  className="group flex items-center gap-3 p-3 bg-[#111113] border border-white/5 hover:border-orange-500/30 rounded-xl transition-all">
                                  <span className="text-2xl flex-shrink-0">{p.emoji}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors truncate">{p.name}</p>
                                    <p className="text-white/30 text-xs flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-2.5 h-2.5" strokeWidth={2.2} />
                                      {stateInfo?.name}
                                    </p>
                                  </div>
                                  <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-orange-400 transition-colors flex-shrink-0" strokeWidth={2.5} />
                                </Link>
                              );
                            })}
                          </div>
                          {day.estimatedTravelCost > 0 && (
                            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 bg-white/5 border border-white/8 px-2.5 py-1 rounded-lg">
                              <TravelIcon className="w-3 h-3 text-orange-400" strokeWidth={2.5} />
                              Travel ₹{day.estimatedTravelCost.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.section>

            {/* Tips */}
            {itinerary.tips.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-amber-400" strokeWidth={2.2} />
                  </div>
                  <h2 className="text-xl font-extrabold text-white">Smart Travel Tips</h2>
                </div>
                <ul className="space-y-3">
                  {itinerary.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 bg-white/3 border border-white/8 rounded-xl p-4">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 text-xs font-extrabold">{i + 1}</div>
                      <span className="text-white/70 text-sm leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </motion.section>
            )}

            {/* Actions */}
            <div className="relative grid grid-cols-2 sm:grid-cols-5 gap-3">
              <button onClick={handleReset} className="flex items-center justify-center gap-2 py-4 rounded-xl border border-white/10 bg-white/3 text-white font-bold text-sm hover:border-white/20 transition-colors">
                <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
                Modify
              </button>
              <button onClick={handleDownload} className="flex items-center justify-center gap-2 py-4 rounded-xl border border-white/10 bg-white/3 text-white font-bold text-sm hover:border-orange-500/30 transition-colors">
                <Download className="w-4 h-4" strokeWidth={2.5} />
                Download
              </button>
              <button onClick={handleShare} className="flex items-center justify-center gap-2 py-4 rounded-xl border border-white/10 bg-white/3 text-white font-bold text-sm hover:border-orange-500/30 transition-colors">
                <Share2 className="w-4 h-4" strokeWidth={2.5} />
                Share
              </button>
              <button onClick={() => typeof window !== 'undefined' && window.print()} className="flex items-center justify-center gap-2 py-4 rounded-xl border border-white/10 bg-white/3 text-white font-bold text-sm hover:border-orange-500/30 transition-colors">
                <Clock className="w-4 h-4" strokeWidth={2.5} />
                Print
              </button>
              <button onClick={handleSaveTrip} disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all
                  ${saveStatus === 'saved' ? 'bg-emerald-600 text-white border-2 border-emerald-500'
                    : saveStatus === 'error' ? 'bg-red-600 text-white border-2 border-red-500'
                    : 'bg-gradient-to-r from-orange-500 to-amber-400 text-white hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]'}
                  disabled:opacity-60`}>
                {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} /> : <Bookmark className="w-4 h-4" strokeWidth={2.5} />}
                {saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
              </button>
              {shareMsg && (
                <div className="absolute -top-12 left-0 right-0 mx-auto bg-[#111113] border border-white/10 text-white text-sm font-bold px-4 py-2 rounded-xl text-center max-w-xs">
                  {shareMsg}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {selectedPlaces.length === 0 && !generated && !isGenerating && (
          <div className="text-center py-16 bg-[#111113] border border-[#222226] rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-7 h-7 text-orange-400" strokeWidth={2.2} />
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2">Select destinations to generate a trip</h3>
            <p className="text-white/40 mb-6 text-sm">Browse {PLACES.length}+ places, or load a sample trip to see what&apos;s possible.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/explore" className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold px-7 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all">
                Browse destinations
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
              <button onClick={loadSample} className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white font-bold px-7 py-3 rounded-xl hover:bg-white/10 transition-all">
                <Sparkles className="w-4 h-4 text-orange-400" strokeWidth={2.5} />
                Try sample trip
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ItineraryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    }>
      <ItineraryContent />
    </Suspense>
  );
}
