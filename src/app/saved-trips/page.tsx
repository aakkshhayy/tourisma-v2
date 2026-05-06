'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bookmark, Trash2, Calendar, Loader2, Sparkles, ArrowRight, MapPin, IndianRupee } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, SavedTrip } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';

const BUDGET_LABELS: Record<string, string> = {
  budget: '🎒 Budget',
  mid: '🏨 Standard',
  luxury: '✨ Premium',
};

export default function SavedTripsPage() {
  const { user, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (user) fetchTrips();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTrips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_trips')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setTrips(data as SavedTrip[]);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from('saved_trips').delete().eq('id', id);
    setTrips(prev => prev.filter(t => t.id !== id));
    setDeleting(null);
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
                ? `${trips.length} saved trip${trips.length > 1 ? 's' : ''}`
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
              const itin = trip.itinerary as { route?: string[]; totalEstimatedCost?: { total: number } };
              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="bg-[#111113] border border-[#222226] hover:border-orange-500/20 rounded-2xl p-6 transition-all group">
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
                        {itin?.totalEstimatedCost?.total && (
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
                    <button
                      onClick={() => handleDelete(trip.id)}
                      disabled={deleting === trip.id}
                      className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/3 hover:bg-red-500/10 hover:text-red-400 text-white/20 flex items-center justify-center transition-colors border border-white/5 hover:border-red-500/20">
                      {deleting === trip.id
                        ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                        : <Trash2 className="w-4 h-4" strokeWidth={2.2} />}
                    </button>
                  </div>
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
