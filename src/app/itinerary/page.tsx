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
  Utensils, Ticket, Package, Info, ExternalLink, BedDouble,
  Navigation, BadgeCheck, AlertTriangle,
} from 'lucide-react';
import Image from 'next/image';
import { PLACES, STATES, getPlaceById, getStateById } from '@/lib/places';
import { getPlaceImage } from '@/lib/placeImages';
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

const TRIP_TYPES = [
  { id: 'general' as const,    label: 'General',    emoji: '🗺️' },
  { id: 'pilgrimage' as const, label: 'Pilgrimage', emoji: '🙏' },
  { id: 'family' as const,     label: 'Family',     emoji: '👨‍👩‍👧' },
  { id: 'honeymoon' as const,  label: 'Honeymoon',  emoji: '💑' },
  { id: 'solo' as const,       label: 'Solo',       emoji: '🎒' },
  { id: 'friends' as const,    label: 'Friends',    emoji: '🤝' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  // Fetch saved trip count for the header badge
  useEffect(() => {
    if (!user) { setSavedCount(null); return; }
    supabase.from('saved_trips').select('id', { count: 'exact', head: true }).then(({ count }) => {
      setSavedCount(count ?? 0);
    });
  }, [user, saveStatus]);

  // Read query params on mount — also handles ?edit=<tripId>
  useEffect(() => {
    const fromParam = searchParams.get('from');
    const durationParam = searchParams.get('duration');
    const placeParam = searchParams.get('place');
    const placesParam = searchParams.get('places'); // comma-separated, from QuickPlan
    const monthParam = searchParams.get('month');
    const groupParam = searchParams.get('group');
    const stayParam = searchParams.get('stay');
    const typeParam = searchParams.get('type');
    const editId = searchParams.get('edit');
    if (fromParam) setOptions({ originCityId: fromParam });
    if (durationParam) setOptions({ numDays: parseInt(durationParam) || 5 });
    if (monthParam) setOptions({ travelMonth: parseInt(monthParam) || new Date().getMonth() + 1 });
    if (groupParam) setOptions({ groupSize: parseInt(groupParam) || 2 });
    if (stayParam === 'budget' || stayParam === 'mid' || stayParam === 'luxury') setOptions({ stayType: stayParam });
    if (typeParam === 'general' || typeParam === 'pilgrimage' || typeParam === 'family' ||
        typeParam === 'honeymoon' || typeParam === 'solo' || typeParam === 'friends') {
      setOptions({ tripType: typeParam });
    }
    if (placesParam && !editId) {
      const ids = placesParam.split(',').filter(Boolean);
      if (ids.length > 0) {
        clearSelection();
        ids.forEach(id => { const p = getPlaceById(id); if (p) addPlace(p); });
      }
    } else if (placeParam && !editId) {
      const p = getPlaceById(placeParam);
      if (p) { clearSelection(); addPlace(p); }
    }
    if (editId) {
      supabase.from('saved_trips').select('itinerary').eq('id', editId).maybeSingle()
        .then(({ data }) => {
          if (!data) return;
          const meta = (data.itinerary as Record<string, unknown>)._meta as
            { placeIds: string[]; options: Record<string, unknown> } | undefined;
          if (!meta) return;
          clearSelection();
          meta.placeIds.forEach(id => { const p = getPlaceById(id); if (p) addPlace(p); });
          setOptions(meta.options as Parameters<typeof setOptions>[0]);
        });
    }
  }, [searchParams, setOptions, clearSelection, addPlace]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredPlaces = useMemo(() => {
    const q = placeSearch.trim().toLowerCase();
    if (!q) return PLACES;
    return PLACES.filter(p => {
      const stateName = getStateById(p.state)?.name?.toLowerCase() ?? '';
      return p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q) || stateName.includes(q)
        || (p.aliases?.some(a => a.toLowerCase().includes(q)) ?? false)
        || p.highlights.some(h => h.toLowerCase().includes(q));
    });
  }, [placeSearch]);

  const handleGenerate = useCallback(() => {
    if (selectedPlaces.length === 0) return;
    setIsGenerating(true);
    setGenerateError(null);
    setLoadingMsgIndex(0);
    const interval = setInterval(() => {
      setLoadingMsgIndex(i => Math.min(i + 1, LOADING_MESSAGES.length - 1));
    }, 280);
    setTimeout(() => {
      clearInterval(interval);
      try {
        const result = generateItinerary(selectedPlaces, options);
        setItinerary(result);
        setGenerated(true);
        setIsGenerating(false);
        setTimeout(() => {
          document.getElementById('itinerary-result')?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      } catch (err) {
        setIsGenerating(false);
        setGenerateError(err instanceof Error ? err.message : 'Something went wrong. Please try again or select different destinations.');
      }
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
    const text = `Check out my ${options.numDays}-day India trip from ${origin?.name ?? 'home'}: ${itinerary.route.join(' → ')}. Total ≈ ₹${itinerary.totalEstimatedCost.total.toLocaleString()} for ${options.groupSize}. 🗺️ Planned with Tourisma\n${location.href}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleSaveTrip = async () => {
    if (!itinerary) return;
    if (!user) { setShowAuth(true); return; }
    setSaveStatus('saving');
    const origin = getOriginById(options.originCityId);
    const title = `${options.numDays}-day trip from ${origin?.name ?? 'home'}: ${itinerary.route.join(' → ')}`;
    // Embed _meta so the trip can be reloaded into the planner for editing
    const itineraryWithMeta = {
      ...itinerary,
      _meta: { placeIds: selectedPlaces.map(p => p.id), options: { ...options } },
    };
    const editId = searchParams.get('edit');
    const { error } = editId
      ? await supabase.from('saved_trips').update({
          title, duration: options.numDays, budget: options.stayType,
          itinerary: itineraryWithMeta as unknown as Record<string, unknown>,
        }).eq('id', editId)
      : await supabase.from('saved_trips').insert({
          user_id: user.id, title,
          duration: options.numDays, budget: options.stayType,
          itinerary: itineraryWithMeta as unknown as Record<string, unknown>,
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
              AI Trip Planner
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">Let&apos;s plan your perfect trip</h1>
            <p className="text-white/40 text-lg max-w-2xl">
              Tell us your preferences — we&apos;ll recommend the best route, compare travel options, and build a day-by-day plan tailored for you.
            </p>
            {user && savedCount !== null && savedCount > 0 && (
              <Link href="/saved-trips" className="inline-flex items-center gap-2 mt-4 bg-white/5 border border-white/10 hover:border-orange-500/30 text-white/60 hover:text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
                <Bookmark className="w-3.5 h-3.5 text-orange-400" strokeWidth={2.5} />
                {savedCount} saved itinerar{savedCount > 1 ? 'ies' : 'y'} · View →
              </Link>
            )}
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

          {/* Trip type */}
          <div className="mt-4 bg-white/3 border border-white/8 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🗺️</span>
              <label className="text-sm font-bold text-white">Trip Type</label>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {TRIP_TYPES.map(t => (
                <button key={t.id} onClick={() => setOptions({ tripType: t.id })}
                  className={`flex items-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-bold transition-all
                    ${options.tripType === t.id ? 'bg-white text-[#0A0A0B]' : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'}`}>
                  <span>{t.emoji}</span>{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Travel month */}
          <div className="mt-4 bg-white/3 border border-white/8 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-orange-400" strokeWidth={2.5} />
              <label className="text-sm font-bold text-white">Travel Month</label>
              <span className="text-xs text-white/40 ml-auto">used for seasonal alerts</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {MONTHS.map((m, i) => (
                <button key={m} onClick={() => setOptions({ travelMonth: i + 1 })}
                  className={`py-2 rounded-xl text-xs font-bold transition-all
                    ${options.travelMonth === i + 1 ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/50 border border-white/8 hover:border-orange-500/30'}`}>
                  {m}
                </button>
              ))}
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

        {/* Generation error */}
        {generateError && !isGenerating && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
            <div className="flex-1">
              <p className="text-red-300 font-bold text-sm">Could not generate itinerary</p>
              <p className="text-red-200/60 text-sm mt-0.5">{generateError}</p>
              <button onClick={() => { setGenerateError(null); handleGenerate(); }}
                className="mt-3 text-xs font-bold text-red-400 hover:text-red-300 underline">
                Try again
              </button>
            </div>
          </motion.div>
        )}

        {/* Generated itinerary */}
        {generated && itinerary && !isGenerating && (
          <div id="itinerary-result" className="space-y-5">
            {/* Seasonal warnings */}
            {selectedPlaces
              .filter(p => p.openMonths && !p.openMonths.includes(options.travelMonth))
              .map(p => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <div>
                    <p className="text-amber-300 font-bold text-sm">{p.emoji} {p.name} — Seasonal Alert</p>
                    <p className="text-amber-200/70 text-sm mt-0.5">{p.closedWarning}</p>
                  </div>
                </motion.div>
              ))
            }
            {/* Summary */}
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="relative bg-gradient-to-br from-[#1a0e00] to-[#111113] border border-orange-500/20 rounded-2xl p-6 sm:p-8 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-orange-400 mb-3">
                  <BadgeCheck className="w-4 h-4" strokeWidth={2.5} />
                  Personalised recommendation
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-2">
                  We&apos;ve planned your {options.numDays}-day adventure
                </h2>
                <p className="text-white/40 text-sm mb-4">
                  Based on your route, group size, and <span className="capitalize text-white/60 font-semibold">{options.stayType}</span> budget — here&apos;s what we recommend.
                </p>
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

                {/* Budget hero — front and center */}
                <div className="mt-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4 bg-black/30 rounded-xl border border-white/8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">₹{Math.round(itinerary.totalEstimatedCost.total / options.groupSize).toLocaleString()}</span>
                    <span className="text-white/40 text-sm font-semibold">/person</span>
                  </div>
                  <div className="h-8 w-px bg-white/10 hidden sm:block" />
                  <div className="text-sm text-white/50">
                    Total <span className="font-bold text-white/80">₹{itinerary.totalEstimatedCost.total.toLocaleString()}</span> for {options.groupSize} traveller{options.groupSize > 1 ? 's' : ''} · {options.numDays} days · <span className="capitalize">{options.stayType}</span> stay
                  </div>
                  {options.tripType !== 'general' && (
                    <span className="sm:ml-auto inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-300">
                      {TRIP_TYPES.find(t => t.id === options.tripType)?.emoji} {TRIP_TYPES.find(t => t.id === options.tripType)?.label} trip
                    </span>
                  )}
                </div>
              </div>
            </motion.section>

            {/* ── Decision Intelligence ─────────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-gradient-to-br from-violet-500/8 via-[#111113] to-[#111113] border border-violet-500/20 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-violet-400" strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">Tourisma Recommends</h2>
                  <p className="text-white/40 text-sm">We analysed your route — here&apos;s the smart breakdown</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Best route */}
                <div className="bg-[#0A0A0B] border border-white/8 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <Navigation className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Best Route</span>
                  </div>
                  <p className="text-white font-extrabold text-lg mb-1">{itinerary.route.slice(0, 3).join(' → ')}{itinerary.route.length > 3 ? ' …' : ''}</p>
                  <p className="text-white/40 text-xs leading-relaxed">
                    Geographically optimised — shortest total distance at <span className="font-bold text-white/70">{itinerary.totalDistanceKm.toLocaleString()} km</span>. Places are clustered by region to minimise backtracking.
                  </p>
                </div>

                {/* Cheapest option */}
                <div className="bg-[#0A0A0B] border border-white/8 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                      <IndianRupee className="w-4 h-4 text-amber-400" strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">Most Affordable</span>
                  </div>
                  <p className="text-white font-extrabold text-lg mb-1">
                    ₹{Math.round(itinerary.totalEstimatedCost.total / options.groupSize).toLocaleString()}<span className="text-sm font-semibold text-white/40"> /person</span>
                  </p>
                  <p className="text-white/40 text-xs leading-relaxed">
                    Total trip cost <span className="font-bold text-white/70">₹{itinerary.totalEstimatedCost.total.toLocaleString()}</span> for {options.groupSize} — using <span className="capitalize font-bold text-white/70">{options.stayType}</span> stays and budget-first travel mode selection per leg.
                  </p>
                </div>

                {/* Fastest option */}
                <div className="bg-[#0A0A0B] border border-white/8 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-sky-400" strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-sky-400">Fastest Option</span>
                  </div>
                  <p className="text-white font-extrabold text-lg mb-1">
                    {Math.floor(itinerary.totalTravelHours)}h {Math.round((itinerary.totalTravelHours % 1) * 60)}m
                    {itinerary.journey.some(l => l.options.some(o => o.mode === 'flight')) && (
                      <span className="ml-2 text-xs font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">✈ by flight</span>
                    )}
                  </p>
                  <p className="text-white/40 text-xs leading-relaxed">
                    {itinerary.journey.some(l => l.options.some(o => o.mode === 'flight'))
                      ? <>Switching to <span className="font-bold text-white/70">flights</span> on key legs cuts total journey time. We&apos;ve marked the fastest option on each leg below.</>
                      : <>Each leg uses the <span className="font-bold text-white/70">fastest available mode</span>. Compare train vs cab vs bus options per leg below to see time savings.</>
                    }
                  </p>
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
                  <p className="text-white/40 text-sm">Estimated for your group · based on your preferences</p>
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
                  Estimates based on <span className="font-semibold capitalize text-white/60">{options.stayType}</span> averages and current rail/road fares ({new Date().toLocaleString('en-IN', { month: 'short', year: 'numeric' })}). Actual prices vary by season and booking timing — lock in early for the best rates.
                </p>
              </div>
            </motion.section>

            {/* How you'll get there — first leg banner */}
            {(() => {
              const firstLeg = itinerary.journey.find(l => !l.isReturn);
              if (!firstLeg) return null;
              const cheapest = [...firstLeg.options].sort((a, b) => a.cost - b.cost)[0];
              const fastest  = [...firstLeg.options].sort((a, b) => a.durationHours - b.durationHours)[0];
              const sameOption = cheapest && fastest && cheapest.mode === fastest.mode;
              const TravelIcon = firstLeg.mode === 'flight' ? Plane : firstLeg.mode === 'train' ? Train : firstLeg.mode === 'cab' ? Car : Bus;
              return (
                <motion.section
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className="bg-gradient-to-br from-sky-500/10 to-cyan-500/5 border border-sky-500/20 rounded-2xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
                      <TravelIcon className="w-5 h-5 text-sky-400" strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-1">How you&apos;ll get there</p>
                      <h3 className="text-lg font-extrabold text-white truncate">{firstLeg.from} → {firstLeg.to}</h3>
                      <p className="text-white/50 text-xs mt-0.5">{firstLeg.distanceKm.toLocaleString()} km · first leg of your trip</p>
                    </div>
                  </div>
                  <div className={`grid ${sameOption ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                    {sameOption ? (
                      <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Recommended</p>
                        <p className="text-white font-extrabold text-base capitalize">{cheapest.mode} · {Math.round(cheapest.durationHours)}h</p>
                        <p className="text-white/60 text-sm">₹{cheapest.cost.toLocaleString()} {firstLeg.mode === 'flight' ? '/person' : 'total'}</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-black/30 border border-emerald-500/20 rounded-xl p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Cheapest</p>
                          <p className="text-white font-extrabold text-sm capitalize">{cheapest.mode}</p>
                          <p className="text-white/70 text-xs">₹{cheapest.cost.toLocaleString()} · {Math.round(cheapest.durationHours)}h</p>
                        </div>
                        <div className="bg-black/30 border border-amber-500/20 rounded-xl p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">Fastest</p>
                          <p className="text-white font-extrabold text-sm capitalize">{fastest.mode}</p>
                          <p className="text-white/70 text-xs">₹{fastest.cost.toLocaleString()} · {Math.round(fastest.durationHours)}h</p>
                        </div>
                      </>
                    )}
                  </div>
                </motion.section>
              );
            })()}

            {/* Day-by-day */}
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-[#111113] border border-[#222226] rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-violet-400" strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">Your Day-by-day Plan</h2>
                  <p className="text-white/40 text-sm">We&apos;ve structured {itinerary.days.length} days across {itinerary.route.length} destinations</p>
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
                              const img = getPlaceImage(p.id);
                              return (
                                <Link key={p.id} href={`/destination/${p.id}`}
                                  className="group flex items-center gap-3 p-2 bg-[#111113] border border-white/5 hover:border-orange-500/30 rounded-xl transition-all">
                                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#1a1a1e] flex-shrink-0">
                                    {img ? (
                                      <Image src={img} alt={p.name} fill sizes="56px" className="object-cover group-hover:scale-105 transition-transform" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-2xl">{p.emoji}</div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors truncate">{p.name}</p>
                                    <p className="text-white/30 text-xs flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-2.5 h-2.5" strokeWidth={2.2} />
                                      {stateInfo?.name}
                                    </p>
                                  </div>
                                  <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-orange-400 transition-colors flex-shrink-0 mr-2" strokeWidth={2.5} />
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

            {/* ── Book Now — Conversion Layer ───────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-[#0d1117] to-[#111113] border border-white/10 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-orange-400" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">Ready to book?</h2>
                  <p className="text-white/40 text-sm">Your plan is ready — take the next step</p>
                </div>
              </div>
              <p className="text-white/30 text-xs mb-6 ml-[52px]">
                We&apos;ve planned the trip. Now lock in your dates before prices go up.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <a
                  href={`https://www.makemytrip.com/hotels/hotel-listing/#city=${itinerary.route[0] ?? ''}&checkin=&checkout=`}
                  target="_blank" rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 bg-white/3 border border-white/8 hover:border-orange-500/40 hover:bg-orange-500/5 rounded-xl transition-all">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <BedDouble className="w-5 h-5 text-rose-400" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-white text-sm">Book Hotels</p>
                    <p className="text-white/40 text-xs mt-0.5">via MakeMyTrip</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-orange-400 transition-colors flex-shrink-0" strokeWidth={2.5} />
                </a>

                <a
                  href={`https://www.makemytrip.com/flights/`}
                  target="_blank" rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 bg-white/3 border border-white/8 hover:border-orange-500/40 hover:bg-orange-500/5 rounded-xl transition-all">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Plane className="w-5 h-5 text-sky-400" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-white text-sm">Check Flights</p>
                    <p className="text-white/40 text-xs mt-0.5">via MakeMyTrip</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-orange-400 transition-colors flex-shrink-0" strokeWidth={2.5} />
                </a>

                <a
                  href="https://www.irctc.co.in/nget/train-search"
                  target="_blank" rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 bg-white/3 border border-white/8 hover:border-orange-500/40 hover:bg-orange-500/5 rounded-xl transition-all">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Train className="w-5 h-5 text-emerald-400" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-white text-sm">Book Trains</p>
                    <p className="text-white/40 text-xs mt-0.5">via IRCTC</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-orange-400 transition-colors flex-shrink-0" strokeWidth={2.5} />
                </a>

                <a
                  href={`https://www.klook.com/en-IN/search/?query=${encodeURIComponent(itinerary.route[0] ?? 'India')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 bg-white/3 border border-white/8 hover:border-orange-500/40 hover:bg-orange-500/5 rounded-xl transition-all">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Ticket className="w-5 h-5 text-violet-400" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-white text-sm">Book Activities</p>
                    <p className="text-white/40 text-xs mt-0.5">via Klook</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-orange-400 transition-colors flex-shrink-0" strokeWidth={2.5} />
                </a>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-white/25">
                <Info className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2.2} />
                <span>These links open trusted booking platforms. Tourisma may earn a referral commission at no extra cost to you.</span>
              </div>
            </motion.section>

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
                WhatsApp
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
                {saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : searchParams.get('edit') ? 'Update trip' : 'Save'}
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
