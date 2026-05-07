'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ArrowRight, Sparkles, Map, Calendar, Shield, ChevronRight } from 'lucide-react';
import { ORIGIN_CITIES } from '@/lib/origins';
import { PLACES } from '@/lib/places';

const ANIMATED_WORDS = ['India Trip', 'Weekend Getaway', 'Adventure', 'Himalayan Trek', 'Beach Escape'];

const POPULAR_ROUTES = [
  { from: 'Delhi', to: 'Goa', emoji: '🏖️', duration: '5-7 days', description: 'Beaches, nightlife & coastal charm' },
  { from: 'Mumbai', to: 'Kerala', emoji: '🌿', duration: '6-8 days', description: 'Backwaters, spices & hill stations' },
  { from: 'Kolkata', to: 'Sikkim', emoji: '🏔️', duration: '5-6 days', description: 'Himalayan peaks & monasteries' },
  { from: 'Bengaluru', to: 'Rajasthan', emoji: '🏰', duration: '7-9 days', description: 'Palaces, deserts & royal culture' },
  { from: 'Chennai', to: 'Tamil Nadu', emoji: '🛕', duration: '4-5 days', description: 'Dravidian temples & Nilgiri hills' },
  { from: 'Hyderabad', to: 'Karnataka', emoji: '🏯', duration: '4-6 days', description: 'Hampi ruins & coffee estates' },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Powered Planning',
    description: 'Smart algorithms cluster places geographically and build optimised day-by-day schedules from your home city.',
    gradient: 'from-orange-500 to-amber-400',
  },
  {
    icon: Map,
    title: 'Real Routes & Costs',
    description: 'Compare train, bus, cab and flight options per leg. All-inclusive cost estimates for your group size.',
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    icon: Calendar,
    title: 'Save & Share',
    description: 'Save your itineraries, download as text, or share with friends. Your trips, accessible anywhere.',
    gradient: 'from-violet-500 to-purple-400',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number] } }),
};

export default function Home() {
  const router = useRouter();
  const [wordIndex, setWordIndex] = useState(0);
  const [fromCity, setFromCity] = useState('');
  const [placeQuery, setPlaceQuery] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
  const [duration, setDuration] = useState('5');

  const placeSuggestions = placeQuery.trim().length > 0
    ? PLACES.filter(p => {
        const q = placeQuery.toLowerCase();
        return p.name.toLowerCase().includes(q)
          || p.tagline.toLowerCase().includes(q)
          || (p.aliases?.some(a => a.toLowerCase().includes(q)) ?? false);
      }).slice(0, 6)
    : [];

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex(i => (i + 1) % ANIMATED_WORDS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = () => {
    const params = new URLSearchParams();
    if (fromCity) params.set('from', fromCity);
    if (selectedPlaceId) params.set('place', selectedPlaceId);
    if (duration) params.set('duration', duration);
    router.push(`/itinerary?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0B]">
      {/* Hero */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B] via-[#0d0d10] to-[#0A0A0B]" />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-400/15 rounded-full blur-[100px]"
          />
          <div className="absolute inset-0 opacity-40"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")` }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-12">
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-semibold mb-8">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
            AI-powered India travel planner
          </motion.div>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight mb-4">
            Plan Your Perfect
          </motion.h1>

          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-5xl sm:text-6xl lg:text-7xl h-[1.3em] mb-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number] }}
                className="block text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                {ANIMATED_WORDS[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </motion.div>

          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="text-lg sm:text-xl text-white/50 mb-12 max-w-2xl mx-auto">
            AI-powered itineraries. Real routes. Instant plans.
          </motion.p>

          {/* Trip planner widget */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={4}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">From city</label>
                <select
                  value={fromCity}
                  onChange={e => setFromCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all appearance-none cursor-pointer">
                  <option value="" className="bg-[#111113]">Select city</option>
                  {ORIGIN_CITIES.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#111113]">{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">To destination</label>
                <input
                  type="text"
                  placeholder="Search — Kedarnath, Kashi, Goa…"
                  value={placeQuery}
                  onChange={e => {
                    setPlaceQuery(e.target.value);
                    setSelectedPlaceId('');
                    setShowPlaceSuggestions(true);
                  }}
                  onFocus={() => setShowPlaceSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowPlaceSuggestions(false), 150)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-all"
                />
                {showPlaceSuggestions && placeSuggestions.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    {placeSuggestions.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={() => {
                          setPlaceQuery(p.name);
                          setSelectedPlaceId(p.id);
                          setShowPlaceSuggestions(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors">
                        <span className="text-lg">{p.emoji}</span>
                        <div>
                          <p className="text-white text-sm font-medium">{p.name}</p>
                          <p className="text-white/40 text-xs">{p.tagline}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Duration</label>
                <select
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all appearance-none cursor-pointer">
                  {[3, 5, 7, 10, 14, 21].map(d => (
                    <option key={d} value={d} className="bg-[#111113]">{d} days</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-base hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all group">
              <Sparkles className="w-5 h-5" strokeWidth={2.5} />
              Generate My Trip Plan
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
            </button>
          </motion.div>

          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={5}
            className="mt-8 flex items-center justify-center gap-6 text-sm text-white/30">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" strokeWidth={2.2} />
              {PLACES.length}+ destinations
            </span>
            <span>·</span>
            <span>29 states covered</span>
            <span>·</span>
            <span>Free to use</span>
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2">
          <div className="w-1 h-2 rounded-full bg-white/40" />
        </motion.div>
      </section>

      {/* Popular Routes */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }} viewport={{ once: true }}
          className="text-center mb-16">
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">Popular Routes</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white">
            Trending{' '}
            <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Journeys
            </span>
          </h2>
          <p className="text-white/40 mt-4 max-w-xl mx-auto">Most planned routes across India — click to start building your itinerary</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_ROUTES.map((route, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              viewport={{ once: true }}
              onClick={() => {
                const fromId = ORIGIN_CITIES.find(c => c.name === route.from)?.id ?? '';
                router.push(`/itinerary?from=${fromId}&duration=7`);
              }}
              className="group text-left bg-[#111113] border border-[#222226] hover:border-orange-500/30 rounded-2xl p-6 transition-all hover:shadow-[0_0_30px_rgba(249,115,22,0.08)] hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{route.emoji}</span>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" strokeWidth={2.5} />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white">{route.from}</span>
                <ArrowRight className="w-3.5 h-3.5 text-orange-400" strokeWidth={2.5} />
                <span className="font-bold text-white">{route.to}</span>
              </div>
              <p className="text-white/40 text-sm mb-3">{route.description}</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400/70 bg-orange-500/10 px-2.5 py-1 rounded-full">
                <Calendar className="w-3 h-3" strokeWidth={2.5} />
                {route.duration}
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Why Tourisma */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0d0d10]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }} viewport={{ once: true }}
            className="text-center mb-16">
            <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">Why Tourisma</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white">
              Plan smarter,{' '}
              <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                travel better
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 overflow-hidden hover:border-white/20 transition-all">
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feat.gradient}`} />
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{feat.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }} viewport={{ once: true }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-[0_0_40px_rgba(249,115,22,0.4)] mb-8 mx-auto">
              <Compass className="w-8 h-8 text-white" strokeWidth={2.2} />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
              Ready to explore India?
            </h2>
            <p className="text-white/40 text-lg mb-8">
              Start planning your next adventure with smart route optimisation and real cost estimates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/itinerary')}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all group">
                <Sparkles className="w-5 h-5" strokeWidth={2.5} />
                Start Planning
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => router.push('/explore')}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all">
                <Map className="w-5 h-5" strokeWidth={2.5} />
                Explore Destinations
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
              <Compass className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-white/60">Tourisma</span>
          </div>
          <p className="text-white/30 text-sm">Plan smarter. Travel better. Explore India.</p>
        </div>
      </footer>
    </main>
  );
}
