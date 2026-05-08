'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ArrowRight, Sparkles, Map, Calendar, Shield, ChevronRight } from 'lucide-react';
import { PLACES } from '@/lib/places';
import { ORIGIN_CITIES } from '@/lib/origins';
import QuickPlanWizard from '@/components/QuickPlanWizard';

const ANIMATED_WORDS = ['India Trip', 'Weekend Getaway', 'Adventure', 'Himalayan Trek', 'Beach Escape'];

// month 1=Jan…12=Dec
const SEASONAL_ROUTES: Record<number, { from: string; to: string; emoji: string; duration: string; description: string }[]> = {
  // Dec–Feb: South India, Goa, Rajasthan (peak season)
  12: [
    { from: 'Delhi', to: 'Goa', emoji: '🏖️', duration: '5-7 days', description: 'Peak beach season — Goa at its best' },
    { from: 'Mumbai', to: 'Rajasthan', emoji: '🏰', duration: '7-9 days', description: 'Perfect weather for palaces & deserts' },
    { from: 'Bengaluru', to: 'Kerala', emoji: '🌿', duration: '6-8 days', description: 'Backwaters & hill stations in winter' },
    { from: 'Chennai', to: 'Tamil Nadu', emoji: '🛕', duration: '4-5 days', description: 'Dravidian temples & Nilgiri hills' },
    { from: 'Delhi', to: 'Ranthambore', emoji: '🐯', duration: '3-4 days', description: 'Tiger safari at its best' },
    { from: 'Hyderabad', to: 'Andaman', emoji: '🏝️', duration: '5-6 days', description: 'Crystal-clear waters, peak season' },
  ],
  1: [
    { from: 'Delhi', to: 'Goa', emoji: '🏖️', duration: '5-7 days', description: 'Peak beach season — Goa at its best' },
    { from: 'Mumbai', to: 'Rajasthan', emoji: '🏰', duration: '7-9 days', description: 'Perfect weather for palaces & deserts' },
    { from: 'Delhi', to: 'Uttarakhand', emoji: '⛷️', duration: '4-5 days', description: 'Skiing at Auli, snow at Chopta' },
    { from: 'Bengaluru', to: 'Kerala', emoji: '🌿', duration: '6-8 days', description: 'Backwaters in winter comfort' },
    { from: 'Chennai', to: 'Tamil Nadu', emoji: '🛕', duration: '4-5 days', description: 'Temple trail in perfect weather' },
    { from: 'Hyderabad', to: 'Andaman', emoji: '🏝️', duration: '5-6 days', description: 'Crystal-clear waters, peak season' },
  ],
  2: [
    { from: 'Delhi', to: 'Goa', emoji: '🏖️', duration: '5-7 days', description: 'Last of the beach season' },
    { from: 'Mumbai', to: 'Rajasthan', emoji: '🏰', duration: '7-9 days', description: 'Jaipur Literature Festival month' },
    { from: 'Delhi', to: 'Uttarakhand', emoji: '⛷️', duration: '4-5 days', description: 'Best skiing month at Auli' },
    { from: 'Bengaluru', to: 'Karnataka', emoji: '🏯', duration: '4-6 days', description: 'Hampi ruins & coffee estates' },
    { from: 'Kolkata', to: 'Andaman', emoji: '🏝️', duration: '5-6 days', description: 'Warm seas before the heat' },
    { from: 'Chennai', to: 'Tamil Nadu', emoji: '🛕', duration: '4-5 days', description: 'Dravidian temples in perfect weather' },
  ],
  // Mar–May: Hill stations, Northeast
  3: [
    { from: 'Delhi', to: 'Himachal Pradesh', emoji: '🏔️', duration: '6-8 days', description: 'Shimla & Manali before the crowds' },
    { from: 'Kolkata', to: 'Sikkim', emoji: '🌸', duration: '5-6 days', description: 'Rhododendron bloom in Sikkim' },
    { from: 'Bengaluru', to: 'Coorg', emoji: '☕', duration: '3-4 days', description: 'Coffee harvest season' },
    { from: 'Mumbai', to: 'Gujarat', emoji: '🦁', duration: '4-5 days', description: 'Last chance before Gir summer closure' },
    { from: 'Delhi', to: 'Rajasthan', emoji: '🏰', duration: '5-7 days', description: 'Holi in Mathura/Vrindavan' },
    { from: 'Hyderabad', to: 'Andhra Pradesh', emoji: '🛕', duration: '4-5 days', description: 'Tirupati & Araku Valley' },
  ],
  4: [
    { from: 'Delhi', to: 'Himachal Pradesh', emoji: '🌸', duration: '6-8 days', description: 'Apple blossom & spring snow' },
    { from: 'Kolkata', to: 'Darjeeling', emoji: '🍵', duration: '4-5 days', description: 'First-flush tea season' },
    { from: 'Bengaluru', to: 'Ooty', emoji: '🌷', duration: '3-4 days', description: 'Flower show in Nilgiris' },
    { from: 'Mumbai', to: 'Konkan', emoji: '🏝️', duration: '3-4 days', description: 'Alphonso mango season' },
    { from: 'Delhi', to: 'Uttarakhand', emoji: '🏔️', duration: '5-6 days', description: 'Valley of Flowers opening' },
    { from: 'Hyderabad', to: 'Karnataka', emoji: '🏯', duration: '4-5 days', description: 'Hampi ruins before the heat' },
  ],
  5: [
    { from: 'Delhi', to: 'Ladakh', emoji: '🏔️', duration: '7-10 days', description: 'Roads open — Manali-Leh highway' },
    { from: 'Mumbai', to: 'Himachal Pradesh', emoji: '🌿', duration: '7-8 days', description: 'Spiti Valley opens' },
    { from: 'Kolkata', to: 'Sikkim', emoji: '🏔️', duration: '6-7 days', description: 'Rhododendrons & clear skies' },
    { from: 'Delhi', to: 'Kedarnath', emoji: '🛕', duration: '4-5 days', description: 'Temple opens for Char Dham yatra' },
    { from: 'Bengaluru', to: 'Coorg', emoji: '☕', duration: '3-4 days', description: 'Cool before the monsoon' },
    { from: 'Hyderabad', to: 'Andaman', emoji: '🏝️', duration: '5-6 days', description: 'Calm seas before monsoon' },
  ],
  // Jun–Sep: Northeast, Monsoon specials
  6: [
    { from: 'Delhi', to: 'Ladakh', emoji: '🏔️', duration: '7-10 days', description: 'Best month — clear skies, cool' },
    { from: 'Kolkata', to: 'Meghalaya', emoji: '🌧️', duration: '5-6 days', description: 'Living root bridges in monsoon' },
    { from: 'Mumbai', to: 'Kerala', emoji: '🌿', duration: '6-8 days', description: 'Monsoon Ayurveda retreat season' },
    { from: 'Bengaluru', to: 'Coorg', emoji: '☕', duration: '3-4 days', description: 'Monsoon magic in coffee country' },
    { from: 'Delhi', to: 'Spiti Valley', emoji: '🌄', duration: '8-10 days', description: 'Spiti opens — remote desert meets snow' },
    { from: 'Kolkata', to: 'Arunachal Pradesh', emoji: '🌿', duration: '7-8 days', description: 'Northeast in its greenest form' },
  ],
  7: [
    { from: 'Delhi', to: 'Ladakh', emoji: '🏔️', duration: '7-10 days', description: 'Peak season — Pangong, Nubra' },
    { from: 'Kolkata', to: 'Meghalaya', emoji: '🌧️', duration: '5-6 days', description: 'Cherrapunji at max rainfall' },
    { from: 'Mumbai', to: 'Kerala', emoji: '🌿', duration: '6-8 days', description: 'Monsoon Kerala at its lush best' },
    { from: 'Delhi', to: 'Spiti Valley', emoji: '🌄', duration: '8-10 days', description: 'Summer peak in Spiti' },
    { from: 'Bengaluru', to: 'Coorg', emoji: '🌊', duration: '3-4 days', description: 'Abbey Falls at full might' },
    { from: 'Hyderabad', to: 'Andhra Pradesh', emoji: '🌊', duration: '4-5 days', description: 'Waterfalls at their peak' },
  ],
  8: [
    { from: 'Delhi', to: 'Ladakh', emoji: '🏔️', duration: '7-10 days', description: 'Stok Kangri trek season' },
    { from: 'Mumbai', to: 'Goa', emoji: '🌊', duration: '4-5 days', description: 'Monsoon Goa — waterfalls & no crowds' },
    { from: 'Kolkata', to: 'Sikkim', emoji: '🌿', duration: '5-6 days', description: 'Lush green Himalayan valleys' },
    { from: 'Delhi', to: 'Uttarakhand', emoji: '🌸', duration: '5-6 days', description: 'Valley of Flowers in full bloom' },
    { from: 'Bengaluru', to: 'Karnataka', emoji: '🌊', duration: '4-5 days', description: 'Jog Falls & monsoon waterfalls' },
    { from: 'Hyderabad', to: 'Meghalaya', emoji: '🌧️', duration: '6-7 days', description: 'Root bridges & wettest place on earth' },
  ],
  9: [
    { from: 'Delhi', to: 'Rajasthan', emoji: '🏰', duration: '7-9 days', description: 'Post-monsoon — fresh & uncrowded' },
    { from: 'Mumbai', to: 'Gujarat', emoji: '🌸', duration: '4-5 days', description: 'Navratri festival month' },
    { from: 'Kolkata', to: 'Darjeeling', emoji: '🍵', duration: '4-5 days', description: 'Autumn flush tea & clear mountain views' },
    { from: 'Delhi', to: 'Kedarnath', emoji: '🛕', duration: '4-5 days', description: 'Last chance before temple closes' },
    { from: 'Bengaluru', to: 'Mysuru', emoji: '👑', duration: '3-4 days', description: 'Dasara celebrations at Mysore Palace' },
    { from: 'Hyderabad', to: 'Andaman', emoji: '🏝️', duration: '5-6 days', description: 'Crystal waters return after monsoon' },
  ],
  // Oct–Nov: everywhere opens up
  10: [
    { from: 'Delhi', to: 'Rajasthan', emoji: '🏰', duration: '7-9 days', description: 'Peak season begins — ideal weather' },
    { from: 'Mumbai', to: 'Kerala', emoji: '🌿', duration: '6-8 days', description: 'Backwaters at their finest' },
    { from: 'Kolkata', to: 'Sikkim', emoji: '🏔️', duration: '5-6 days', description: 'Crystal Himalayan views post-monsoon' },
    { from: 'Delhi', to: 'Himachal Pradesh', emoji: '🍂', duration: '6-7 days', description: 'Autumn colours in Solang & Manali' },
    { from: 'Bengaluru', to: 'Goa', emoji: '🏖️', duration: '5-6 days', description: 'Beach season begins' },
    { from: 'Hyderabad', to: 'Karnataka', emoji: '🏯', duration: '4-5 days', description: 'Hampi in perfect weather' },
  ],
  11: [
    { from: 'Delhi', to: 'Goa', emoji: '🏖️', duration: '5-7 days', description: 'Beach season in full swing' },
    { from: 'Mumbai', to: 'Rajasthan', emoji: '🏰', duration: '7-9 days', description: 'Pushkar Camel Fair month' },
    { from: 'Kolkata', to: 'Andaman', emoji: '🏝️', duration: '5-6 days', description: 'Perfect diving & snorkelling weather' },
    { from: 'Chennai', to: 'Tamil Nadu', emoji: '🛕', duration: '4-5 days', description: 'Dravidian temple circuit' },
    { from: 'Delhi', to: 'Ranthambore', emoji: '🐯', duration: '3-4 days', description: 'Tiger safari season opens' },
    { from: 'Bengaluru', to: 'Kerala', emoji: '🌿', duration: '6-7 days', description: 'Backwaters & hill stations' },
  ],
};

function getPopularRoutes() {
  const month = new Date().getMonth() + 1;
  return SEASONAL_ROUTES[month] ?? SEASONAL_ROUTES[12];
}

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
  const popularRoutes = getPopularRoutes();
  const currentMonthName = new Date().toLocaleString('en-IN', { month: 'long' });

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex(i => (i + 1) % ANIMATED_WORDS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

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

          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={4}
            className="max-w-3xl mx-auto">
            <QuickPlanWizard />
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

      </section>

      {/* Popular Routes */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }} viewport={{ once: true }}
          className="text-center mb-16">
          <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">Best for {currentMonthName}</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white">
            Trending{' '}
            <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
              This Season
            </span>
          </h2>
          <p className="text-white/40 mt-4 max-w-xl mx-auto">Hand-picked routes for {currentMonthName} — based on weather, festivals & open roads</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularRoutes.map((route, i) => (
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

      {/* Pilgrimage Circuits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0d0d10] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }} viewport={{ once: true }}
            className="text-center mb-12">
            <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">Sacred journeys</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">
              Pilgrimage{' '}
              <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                Circuits
              </span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">Char Dham, Sapta Puri, Buddhist Circuit — curated multi-temple yatras with day-by-day plans</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {[
              { id: 'do-dham-yatra',          name: 'Do Dham',        emoji: '🕉️', days: 7  },
              { id: 'dwarka-somnath-yatra',   name: 'Dwarka–Somnath', emoji: '🌊', days: 5  },
              { id: 'sapta-puri-trail',       name: 'Sapta Puri',     emoji: '🛕', days: 10 },
              { id: 'buddhist-mahaparinirvan',name: 'Buddhist',       emoji: '☸️', days: 8  },
              { id: 'vaishno-devi-amritsar',  name: 'Vaishno Devi',   emoji: '🙏', days: 6  },
              { id: 'south-india-temple-trail', name: 'South Temples',emoji: '🛕', days: 9  },
            ].map((c, i) => (
              <Link key={c.id} href={`/circuits/${c.id}`}
                style={{ animationDelay: `${i * 60}ms` }}
                className="group bg-white/3 border border-white/8 hover:border-orange-500/40 rounded-xl p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-orange-500/5">
                <div className="text-2xl mb-1.5">{c.emoji}</div>
                <p className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors leading-tight">{c.name}</p>
                <p className="text-white/40 text-[10px] mt-0.5">{c.days} days</p>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link href="/circuits" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 hover:border-orange-500/30 transition-all">
              See all 6 circuits
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
          </div>
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
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
                  <Compass className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-extrabold text-white text-lg">Tourisma</span>
              </div>
              <p className="text-white/30 text-sm max-w-xs leading-relaxed">
                AI-powered India trip planner. Real routes, real costs, instant itineraries.
              </p>
            </div>
            {/* Links */}
            <div className="flex gap-12">
              <div>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Plan</p>
                <div className="space-y-2">
                  <a href="/itinerary" className="block text-white/40 text-sm hover:text-white transition-colors">Trip Planner</a>
                  <a href="/explore" className="block text-white/40 text-sm hover:text-white transition-colors">Explore Destinations</a>
                  <a href="/saved-trips" className="block text-white/40 text-sm hover:text-white transition-colors">Saved Trips</a>
                </div>
              </div>
              <div>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Popular</p>
                <div className="space-y-2">
                  <a href="/itinerary?place=uk_kedarnath" className="block text-white/40 text-sm hover:text-white transition-colors">Kedarnath</a>
                  <a href="/itinerary?place=la_leh" className="block text-white/40 text-sm hover:text-white transition-colors">Ladakh</a>
                  <a href="/itinerary?place=up_varanasi" className="block text-white/40 text-sm hover:text-white transition-colors">Varanasi</a>
                  <a href="/itinerary?place=rj_jaipur" className="block text-white/40 text-sm hover:text-white transition-colors">Rajasthan</a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-white/20 text-xs">© {new Date().getFullYear()} Tourisma. Free to use.</p>
            <p className="text-white/20 text-xs">Plan smarter. Travel better. Explore India.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
