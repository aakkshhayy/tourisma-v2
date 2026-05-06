'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark, Trash2, Calendar, Loader2, Sparkles, ArrowRight,
  MapPin, IndianRupee, ChevronDown, Train, Hotel, Utensils,
  Ticket, Package, Lightbulb, Route, Pencil, StickyNote,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, SavedTrip } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';
import type { Itinerary } from '@/lib/types';

const BUDGET_LABELS: Record<string, string> = {
  budget: '🎒 Budget',
  mid: '🏨 Standard',
  luxury: '✨ Premium',
};

const COST_ROWS = [
  { key: 'travel', label: 'Travel', icon: Train, color: 'text-sky-400' },
  { key: 'stay', label: 'Stay', icon: Hotel, color: 'text-violet-400' },
  { key: 'food', label: 'Food', icon: Utensils, color: 'text-amber-400' },
  { key: 'entry', label: 'Entry fees', icon: Ticket, color: 'text-rose-400' },
  { key: 'miscellaneous', label: 'Misc.', icon: Package, color: 'text-emerald-400' },
] as const;

export default function SavedTripsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) fetchTrips();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTrips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_trips')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setTrips(data as SavedTrip[]);
      const initial: Record<string, string> = {};
      (data as SavedTrip[]).forEach(t => { initial[t.id] = t.notes ?? ''; });
      setNoteValues(initial);
    }
    setLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleting(id);
    await supabase.from('saved_trips').delete().eq('id', id);
    setTrips(prev => prev.filter(t => t.id !== id));
    if (expandedId === id) setExpandedId(null);
    setDeleting(null);
  };

  const handleSaveNote = async (id: string) => {
    const notes = noteValues[id] ?? '';
    await supabase.from('saved_trips').update({ notes }).eq('id', id);
    setTrips(prev => prev.map(t => t.id === id ? { ...t, notes } : t));
    setEditingNoteId(null);
  };

  const handleEdit = (e: React.MouseEvent, trip: SavedTrip) => {
    e.stopPropagation();
    const meta = (trip.itinerary as Record<string, unknown>)._meta;
    if (!meta) {
      // Old trip without meta — open planner without pre-fill
      router.push('/itinerary');
      return;
    }
    router.push(`/itinerary?edit=${trip.id}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" strokeWidth={2.5} />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto bg-orange-500/10 border border-orange-500/20 rounded-3xl flex items-center justify-center mb-6">
            <Bookmark className="w-10 h-10 text-orange-500" strokeWidth={1.8} />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">Your saved trips</h1>
          <p className="text-white/40 mb-8">Sign in to save itineraries and access them anytime.</p>
          <button
            onClick={() => setShowAuth(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold px-8 py-4 rounded-xl hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all">
            <Sparkles className="w-5 h-5" strokeWidth={2.5} />
            Sign in to continue
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <div className="relative bg-[#0d0d10] border-b border-white/5 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-orange-500/8 rounded-full blur-[100px]" />
        <div className="max-w-4xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Bookmark className="w-3.5 h-3.5" strokeWidth={2.5} />
              My account
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">Saved trips</h1>
            <p className="text-white/40 text-lg">
              {loading ? 'Loading…' : trips.length > 0
                ? `${trips.length} itinerar${trips.length > 1 ? 'ies' : 'y'} saved — click any to view`
                : 'No saved trips yet.'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" strokeWidth={2.5} />
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-20 bg-[#111113] border border-[#222226] rounded-2xl">
            <div className="w-16 h-16 mx-auto bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Bookmark className="w-7 h-7 text-orange-400" strokeWidth={1.8} />
            </div>
            <h2 className="text-xl font-extrabold text-white mb-2">No saved trips yet</h2>
            <p className="text-white/40 text-sm mb-6">Generate a trip plan and hit Save to keep it here.</p>
            <Link href="/itinerary"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all">
              <Sparkles className="w-4 h-4" strokeWidth={2.5} />
              Build an itinerary
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip, i) => {
              const itin = trip.itinerary as unknown as Itinerary;
              const isExpanded = expandedId === trip.id;

              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className={`bg-[#111113] border rounded-2xl transition-all overflow-hidden
                    ${isExpanded ? 'border-orange-500/30' : 'border-[#222226] hover:border-orange-500/20'}`}>

                  {/* Card header — always visible, click to expand */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : trip.id)}
                    className="w-full text-left p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-base leading-snug mb-2">{trip.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-white/40">
                          {trip.duration && (
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-orange-400" strokeWidth={2.2} />
                              {trip.duration} days
                            </span>
                          )}
                          {trip.budget && (
                            <span className="inline-flex items-center gap-1.5">
                              {BUDGET_LABELS[trip.budget]}
                            </span>
                          )}
                          {itin?.totalEstimatedCost?.total > 0 && (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                              <IndianRupee className="w-3.5 h-3.5" strokeWidth={2.2} />
                              {itin.totalEstimatedCost.total.toLocaleString()}
                            </span>
                          )}
                          <span className="text-white/20 text-xs">
                            {new Date(trip.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        {itin?.route && itin.route.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {itin.route.map((stop, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 text-xs font-semibold text-white/50 bg-white/5 border border-white/8 px-2.5 py-1 rounded-full">
                                <MapPin className="w-2.5 h-2.5 text-orange-400" strokeWidth={2.5} />
                                {stop}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={e => handleEdit(e, trip)}
                          className="w-9 h-9 rounded-xl bg-white/3 hover:bg-orange-500/10 hover:text-orange-400 text-white/20 flex items-center justify-center transition-colors border border-white/5 hover:border-orange-500/20"
                          title="Edit trip">
                          <Pencil className="w-4 h-4" strokeWidth={2.2} />
                        </button>
                        <button
                          onClick={e => handleDelete(e, trip.id)}
                          disabled={deleting === trip.id}
                          className="w-9 h-9 rounded-xl bg-white/3 hover:bg-red-500/10 hover:text-red-400 text-white/20 flex items-center justify-center transition-colors border border-white/5 hover:border-red-500/20"
                          title="Delete trip">
                          {deleting === trip.id
                            ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                            : <Trash2 className="w-4 h-4" strokeWidth={2.2} />}
                        </button>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          <ChevronDown className="w-4 h-4 text-white/40" strokeWidth={2.5} />
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence initial={false}>
                    {isExpanded && itin && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden">
                        <div className="px-6 pb-6 space-y-5 border-t border-white/5 pt-5">

                          {/* Day-by-day */}
                          {itin.days && itin.days.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Route className="w-3.5 h-3.5" strokeWidth={2.5} /> Day-by-day plan
                              </p>
                              <div className="space-y-2">
                                {itin.days.map(day => (
                                  <div key={day.day} className="flex gap-3 bg-white/3 border border-white/6 rounded-xl px-4 py-3">
                                    <span className="text-orange-400 font-extrabold text-sm w-10 flex-shrink-0 pt-0.5">
                                      Day {day.day}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-sm font-semibold leading-snug">
                                        {day.places.map(p => p.name).join(', ')}
                                      </p>
                                      {day.travelNote && (
                                        <p className="text-white/40 text-xs mt-1 leading-relaxed">{day.travelNote}</p>
                                      )}
                                    </div>
                                    {day.estimatedTravelCost > 0 && (
                                      <span className="text-xs font-bold text-emerald-400 flex-shrink-0 pt-0.5 flex items-center gap-0.5">
                                        <IndianRupee className="w-3 h-3" strokeWidth={2.5} />
                                        {day.estimatedTravelCost.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Cost breakdown */}
                          {itin.totalEstimatedCost && (
                            <div>
                              <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <IndianRupee className="w-3.5 h-3.5" strokeWidth={2.5} /> Cost breakdown
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {COST_ROWS.map(({ key, label, icon: Icon, color }) => (
                                  itin.totalEstimatedCost[key] > 0 && (
                                    <div key={key} className="bg-white/3 border border-white/6 rounded-xl px-3 py-2.5 flex items-center gap-2">
                                      <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} strokeWidth={2.2} />
                                      <div>
                                        <p className="text-white/40 text-[10px] font-semibold">{label}</p>
                                        <p className="text-white text-sm font-bold">₹{itin.totalEstimatedCost[key].toLocaleString()}</p>
                                      </div>
                                    </div>
                                  )
                                ))}
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
                                  <IndianRupee className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" strokeWidth={2.2} />
                                  <div>
                                    <p className="text-white/40 text-[10px] font-semibold">Total</p>
                                    <p className="text-orange-400 text-sm font-extrabold">₹{itin.totalEstimatedCost.total.toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Tips */}
                          {itin.tips && itin.tips.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Lightbulb className="w-3.5 h-3.5" strokeWidth={2.5} /> Tips
                              </p>
                              <ul className="space-y-1.5">
                                {itin.tips.map((tip, idx) => (
                                  <li key={idx} className="text-sm text-white/50 flex gap-2">
                                    <span className="text-orange-400 font-bold flex-shrink-0">•</span>
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Notes */}
                          <div>
                            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <StickyNote className="w-3.5 h-3.5" strokeWidth={2.5} /> My notes
                            </p>
                            {editingNoteId === trip.id ? (
                              <div className="space-y-2">
                                <textarea
                                  autoFocus
                                  rows={3}
                                  value={noteValues[trip.id] ?? ''}
                                  onChange={e => setNoteValues(prev => ({ ...prev, [trip.id]: e.target.value }))}
                                  placeholder="Add notes — things to book, packing list, reminders…"
                                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder:text-white/25 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 resize-none transition-all"
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => handleSaveNote(trip.id)}
                                    className="px-4 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors">
                                    Save
                                  </button>
                                  <button onClick={() => { setEditingNoteId(null); setNoteValues(prev => ({ ...prev, [trip.id]: trip.notes ?? '' })); }}
                                    className="px-4 py-1.5 rounded-lg bg-white/5 text-white/50 text-xs font-bold hover:bg-white/10 transition-colors">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={e => { e.stopPropagation(); setEditingNoteId(trip.id); }}
                                className="w-full text-left px-4 py-3 rounded-xl bg-white/3 border border-white/6 hover:border-orange-500/20 transition-colors group">
                                {noteValues[trip.id]
                                  ? <p className="text-sm text-white/60 whitespace-pre-wrap">{noteValues[trip.id]}</p>
                                  : <p className="text-sm text-white/20 italic flex items-center gap-2">
                                      <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.2} />
                                      Click to add notes…
                                    </p>}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/itinerary"
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 hover:border-orange-500/20 transition-all">
            <Sparkles className="w-4 h-4 text-orange-400" strokeWidth={2.5} />
            Plan another trip
          </Link>
        </div>
      </div>
    </main>
  );
}
