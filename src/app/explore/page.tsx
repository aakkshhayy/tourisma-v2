'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, MapPin, Filter, X, ArrowRight } from 'lucide-react';
import { PLACES, STATES, getStateById } from '@/lib/places';

const CATEGORY_LABELS: Record<string, string> = {
  heritage: 'Heritage',
  nature: 'Nature',
  religious: 'Religious',
  beach: 'Beach',
  hill_station: 'Hill Station',
  wildlife: 'Wildlife',
  cultural: 'Cultural',
};

const CATEGORY_COLORS: Record<string, string> = {
  heritage: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
  nature: 'bg-green-500/20 text-green-400 border-green-500/20',
  religious: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
  beach: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20',
  hill_station: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  wildlife: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  cultural: 'bg-rose-500/20 text-rose-400 border-rose-500/20',
};

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = Object.keys(CATEGORY_LABELS);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PLACES.filter(p => {
      const stateInfo = getStateById(p.state);
      const matchesSearch = !q
        || p.name.toLowerCase().includes(q)
        || p.tagline.toLowerCase().includes(q)
        || p.description.toLowerCase().includes(q)
        || stateInfo?.name.toLowerCase().includes(q)
        || p.aliases?.some(a => a.toLowerCase().includes(q))
        || p.highlights.some(h => h.toLowerCase().includes(q));
      const matchesState = !selectedState || p.state === selectedState;
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesState && matchesCategory;
    });
  }, [search, selectedState, selectedCategory]);

  const clearFilters = () => {
    setSearch('');
    setSelectedState('');
    setSelectedCategory('');
  };

  const hasFilters = search || selectedState || selectedCategory;

  return (
    <main className="min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <div className="relative bg-[#0d0d10] border-b border-white/5 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px]" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}>
            <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">Destinations</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
              Explore{' '}
              <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                India
              </span>
            </h1>
            <p className="text-white/40 text-lg max-w-xl">
              {PLACES.length} destinations across {STATES.length} states — find your perfect trip
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-30 bg-[#0A0A0B]/95 backdrop-blur-xl border-b border-white/5 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={2.2} />
            <input
              type="text"
              placeholder="Search places, states, categories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/60 flex items-center justify-center transition-colors">
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* State + category filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Filter className="w-3.5 h-3.5 text-white/30" strokeWidth={2.2} />
            </div>
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all appearance-none cursor-pointer">
              <option value="" className="bg-[#111113]">All states</option>
              {STATES.map(s => (
                <option key={s.id} value={s.id} className="bg-[#111113]">{s.name}</option>
              ))}
            </select>

            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(c => c === cat ? '' : cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                  ${selectedCategory === cat
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20 hover:text-white/80'}`}>
                {CATEGORY_LABELS[cat]}
              </button>
            ))}

            {hasFilters && (
              <button onClick={clearFilters}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all">
                <X className="w-3 h-3" strokeWidth={2.5} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-white/40 text-sm">
            <span className="font-bold text-white">{filtered.length}</span> of {PLACES.length} destinations
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-white/20" strokeWidth={2.2} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No places found</h3>
            <p className="text-white/40 text-sm mb-4">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="text-sm font-bold text-orange-400 hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((place, i) => {
              const stateInfo = getStateById(place.state);
              return (
                <motion.div
                  key={place.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.6) }}>
                  <Link href={`/destination/${place.id}`}
                    className="group block bg-[#111113] border border-[#222226] hover:border-orange-500/30 rounded-2xl p-5 transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.08)] hover:-translate-y-0.5">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{place.emoji}</span>
                      <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" strokeWidth={2.5} />
                    </div>
                    <h3 className="font-bold text-white text-base mb-1 leading-tight group-hover:text-orange-400 transition-colors">{place.name}</h3>
                    <div className="flex items-center gap-1.5 text-white/40 text-xs mb-2">
                      <MapPin className="w-3 h-3" strokeWidth={2.2} />
                      {stateInfo?.name}
                    </div>
                    <p className="text-white/40 text-xs line-clamp-2 mb-3 leading-relaxed">{place.tagline}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[place.category] ?? 'bg-white/5 text-white/40 border-white/10'}`}>
                        {CATEGORY_LABELS[place.category]}
                      </span>
                      <span className="text-[10px] font-semibold text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        {place.recommendedDays}d
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
