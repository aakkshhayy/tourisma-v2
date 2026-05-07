'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, ArrowLeft, MapPin, Calendar, Users,
  IndianRupee, Check, Loader2, Wand2, TrendingDown, Shuffle,
  Target,
} from 'lucide-react';
import { ORIGIN_CITIES } from '@/lib/origins';
import { recommendTrips, type RecommendInput, type TripSuggestion } from '@/lib/recommender';
import type { ItineraryOptions } from '@/lib/types';

const TRIP_TYPES: { id: ItineraryOptions['tripType']; emoji: string; label: string; desc: string }[] = [
  { id: 'general',    emoji: '🗺️',    label: 'Just Exploring',  desc: 'A bit of everything' },
  { id: 'pilgrimage', emoji: '🙏',    label: 'Pilgrimage',      desc: 'Temples & holy sites' },
  { id: 'family',     emoji: '👨‍👩‍👧', label: 'Family',          desc: 'With kids or parents' },
  { id: 'honeymoon',  emoji: '💑',    label: 'Honeymoon',       desc: 'Romantic getaway' },
  { id: 'solo',       emoji: '🎒',    label: 'Solo',            desc: 'Solo backpacking' },
  { id: 'friends',    emoji: '🤝',    label: 'Friends',         desc: 'Group of friends' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STAY_PRESETS = [
  { id: 'budget' as const, label: 'Budget',   desc: 'Hostels, sleeper trains' },
  { id: 'mid' as const,    label: 'Standard', desc: '3-star, 3AC trains' },
  { id: 'luxury' as const, label: 'Premium',  desc: '4-5 star, 1AC trains' },
];

const ICONS_FOR_OPTION: Record<TripSuggestion['id'], React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  best_match:      Target,
  budget_friendly: TrendingDown,
  diverse:         Shuffle,
};

interface QuickPlanWizardProps {
  defaultFromCityId?: string;
}

export default function QuickPlanWizard({ defaultFromCityId }: QuickPlanWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tripType, setTripType] = useState<ItineraryOptions['tripType']>('general');
  const [fromCityId, setFromCityId] = useState(defaultFromCityId ?? '');
  const [travelMonth, setTravelMonth] = useState(new Date().getMonth() + 1);
  const [numDays, setNumDays] = useState(5);
  const [groupSize, setGroupSize] = useState(2);
  const [budgetPerPerson, setBudgetPerPerson] = useState(15000);
  const [stayType, setStayType] = useState<ItineraryOptions['stayType']>('mid');
  const [suggestions, setSuggestions] = useState<TripSuggestion[] | null>(null);
  const [computing, setComputing] = useState(false);

  const canProceed1 = !!tripType;
  const canProceed2 = !!fromCityId && !!travelMonth;

  const inputForRecommender: RecommendInput = useMemo(() => ({
    tripType,
    fromCityId,
    travelMonth,
    numDays,
    groupSize,
    budgetPerPerson,
    stayType,
  }), [tripType, fromCityId, travelMonth, numDays, groupSize, budgetPerPerson, stayType]);

  const handleGetSuggestions = () => {
    setComputing(true);
    // Yield to the UI for the spinner
    setTimeout(() => {
      const result = recommendTrips(inputForRecommender);
      setSuggestions(result);
      setComputing(false);
      setStep(3);
    }, 600);
  };

  const handlePickSuggestion = (s: TripSuggestion) => {
    const params = new URLSearchParams();
    if (fromCityId) params.set('from', fromCityId);
    params.set('duration', String(numDays));
    params.set('places', s.places.map(p => p.id).join(','));
    params.set('month', String(travelMonth));
    params.set('group', String(groupSize));
    params.set('stay', stayType);
    params.set('type', tripType);
    router.push(`/itinerary?${params.toString()}`);
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto">

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map(n => (
          <div key={n} className={`h-1.5 rounded-full transition-all ${
            n === step ? 'w-8 bg-orange-500' : n < step ? 'w-3 bg-orange-500/40' : 'w-3 bg-white/10'
          }`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ─── Step 1: Trip type ──────────────────────────────────────── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className="text-center mb-6">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">What kind of trip?</h3>
              <p className="text-white/40 text-sm">We'll tailor recommendations to your travel style.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TRIP_TYPES.map(t => (
                <button key={t.id} onClick={() => setTripType(t.id)}
                  className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all text-left
                    ${tripType === t.id ? 'border-orange-500 bg-orange-500/10' : 'border-white/8 bg-white/3 hover:border-white/20'}`}>
                  <span className="text-3xl mb-1">{t.emoji}</span>
                  <span className={`font-bold text-sm ${tripType === t.id ? 'text-orange-300' : 'text-white'}`}>{t.label}</span>
                  <span className="text-xs text-white/40 text-center">{t.desc}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setStep(2)} disabled={!canProceed1}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all disabled:opacity-40">
                Next
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── Step 2: When + Where from ───────────────────────────── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className="text-center mb-6">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">When and from where?</h3>
              <p className="text-white/40 text-sm">We'll factor in seasonal closures and travel distance.</p>
            </div>

            <div className="space-y-5">
              {/* From */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
                  <MapPin className="w-3.5 h-3.5" strokeWidth={2.5} /> Starting from
                </label>
                <select
                  value={fromCityId}
                  onChange={e => setFromCityId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all appearance-none cursor-pointer">
                  <option value="" className="bg-[#111113]">Choose your home city</option>
                  {ORIGIN_CITIES.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#111113]">{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
                  <Calendar className="w-3.5 h-3.5" strokeWidth={2.5} /> Travel month
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {MONTHS.map((m, i) => (
                    <button key={m} onClick={() => setTravelMonth(i + 1)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all
                        ${travelMonth === i + 1 ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/50 border border-white/8 hover:border-orange-500/30'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-bold hover:bg-white/10 transition-all">
                <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
                Back
              </button>
              <button onClick={() => setStep(3)} disabled={!canProceed2}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all disabled:opacity-40">
                Next
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── Step 3: Days + Group + Budget + Stay → Suggestions ────── */}
        {step === 3 && !suggestions && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className="text-center mb-6">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Last few details</h3>
              <p className="text-white/40 text-sm">Then we'll suggest 3 trips tuned to your inputs.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Days */}
              <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                <label className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
                  <Calendar className="w-3.5 h-3.5" strokeWidth={2.5} /> Days
                </label>
                <div className="flex items-center justify-between bg-[#0A0A0B] rounded-xl p-1 border border-white/5">
                  <button onClick={() => setNumDays(d => Math.max(2, d - 1))} className="w-9 h-9 rounded-lg hover:bg-white/10 transition-colors font-bold text-xl text-white/60">−</button>
                  <span className="text-2xl font-extrabold text-white">{numDays}</span>
                  <button onClick={() => setNumDays(d => Math.min(21, d + 1))} className="w-9 h-9 rounded-lg hover:bg-white/10 transition-colors font-bold text-xl text-white/60">+</button>
                </div>
              </div>

              {/* Group */}
              <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                <label className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
                  <Users className="w-3.5 h-3.5" strokeWidth={2.5} /> Travelers
                </label>
                <div className="flex items-center justify-between bg-[#0A0A0B] rounded-xl p-1 border border-white/5">
                  <button onClick={() => setGroupSize(g => Math.max(1, g - 1))} className="w-9 h-9 rounded-lg hover:bg-white/10 transition-colors font-bold text-xl text-white/60">−</button>
                  <span className="text-2xl font-extrabold text-white">{groupSize}</span>
                  <button onClick={() => setGroupSize(g => Math.min(20, g + 1))} className="w-9 h-9 rounded-lg hover:bg-white/10 transition-colors font-bold text-xl text-white/60">+</button>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="mt-4 bg-white/3 border border-white/8 rounded-xl p-4">
              <label className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
                <IndianRupee className="w-3.5 h-3.5" strokeWidth={2.5} /> Budget per person
              </label>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-extrabold text-white">₹{budgetPerPerson.toLocaleString()}</span>
                <span className="text-xs text-white/40">approx</span>
              </div>
              <input
                type="range"
                min={5000}
                max={100000}
                step={1000}
                value={budgetPerPerson}
                onChange={e => setBudgetPerPerson(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>₹5k</span>
                <span>₹50k</span>
                <span>₹1L</span>
              </div>
            </div>

            {/* Stay */}
            <div className="mt-4 bg-white/3 border border-white/8 rounded-xl p-4">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3 block">
                Stay preference
              </label>
              <div className="grid grid-cols-3 gap-2">
                {STAY_PRESETS.map(s => (
                  <button key={s.id} onClick={() => setStayType(s.id)}
                    className={`p-3 rounded-xl text-left transition-all border-2
                      ${stayType === s.id ? 'border-orange-500 bg-orange-500/10' : 'border-white/8 bg-white/3 hover:border-white/20'}`}>
                    <div className={`font-bold text-sm ${stayType === s.id ? 'text-orange-300' : 'text-white'}`}>{s.label}</div>
                    <div className="text-[11px] text-white/40 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-bold hover:bg-white/10 transition-all">
                <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
                Back
              </button>
              <button onClick={handleGetSuggestions} disabled={computing}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-extrabold hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all disabled:opacity-60">
                {computing
                  ? <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />Finding trips…</>
                  : <><Wand2 className="w-4 h-4" strokeWidth={2.5} />Suggest trips</>}
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── Step 3 result: suggestions ─────────────────────────────── */}
        {step === 3 && suggestions && (
          <motion.div key="s3-result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
                <Sparkles className="w-3 h-3" strokeWidth={2.5} />
                {suggestions.length} trips matched
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Pick your trip</h3>
              <p className="text-white/40 text-sm">You can still customize everything in the next step.</p>
            </div>

            <div className="space-y-3">
              {suggestions.map(s => {
                const Icon = ICONS_FOR_OPTION[s.id];
                const overBudgetBy = s.perPerson - budgetPerPerson;
                return (
                  <button key={s.id} onClick={() => handlePickSuggestion(s)}
                    className="group block w-full text-left bg-[#111113] border border-[#222226] hover:border-orange-500/40 rounded-2xl p-5 transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.08)]">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-400/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-orange-400" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-lg">{s.emoji}</span>
                          <h4 className="font-extrabold text-white">{s.label}</h4>
                          {s.withinBudget
                            ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">In budget</span>
                            : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">+₹{overBudgetBy.toLocaleString()}/pp over</span>
                          }
                        </div>
                        <p className="text-white/40 text-xs mb-3">{s.tagline}</p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {s.places.map((p, i) => (
                            <span key={p.id} className="inline-flex items-center gap-1 text-xs font-semibold text-white/70 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                              {p.emoji} {p.name}
                              {i < s.places.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-white/20" strokeWidth={2.5} />}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-white/50">
                            <span className="font-extrabold text-white">₹{s.perPerson.toLocaleString()}</span>
                            <span className="text-white/40">/person</span>
                          </span>
                          <span className="text-white/20">·</span>
                          <span className="text-white/50">{s.days} days</span>
                          <span className="text-white/20">·</span>
                          <span className="text-white/50">{s.places.length} places</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-2" strokeWidth={2.5} />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center mt-6">
              <button onClick={() => { setSuggestions(null); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-bold transition-all">
                <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
                Adjust inputs
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
