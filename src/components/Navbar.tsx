'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Map, Calendar, Bookmark, LogOut, ChevronDown, User, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useItineraryStore } from '@/store/itineraryStore';
import AuthModal from '@/components/AuthModal';

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const selectedPlaces = useItineraryStore(s => s.selectedPlaces);
  const [showAuth, setShowAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home', icon: Compass },
    { href: '/explore', label: 'Explore', icon: Map },
    { href: '/itinerary', label: 'Itinerary', icon: Calendar, badge: selectedPlaces.length },
  ];

  return (
    <>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <nav className="sticky top-0 z-40 w-full bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-[0_0_12px_rgba(249,115,22,0.4)] group-hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-all">
                <Compass className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">Tourisma</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon, badge }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                      ${isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                    <Icon className="w-4 h-4" strokeWidth={2.2} />
                    {label}
                    {badge != null && badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(v => !v)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-white transition-all"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-xs font-extrabold text-white">
                      {(user.email ?? user.phone ?? 'U')[0].toUpperCase()}
                    </div>
                    <span className="hidden sm:block max-w-[120px] truncate text-white/80 text-xs">
                      {user.email ?? user.phone}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#111113] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                      <Link href="/saved-trips"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                        <Bookmark className="w-4 h-4" strokeWidth={2.2} />
                        Saved Trips
                      </Link>
                      <div className="h-px bg-white/10 mx-3" />
                      <button
                        onClick={async () => { await signOut(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-4 h-4" strokeWidth={2.2} />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white text-sm font-bold hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all">
                  <User className="w-4 h-4" strokeWidth={2.5} />
                  Sign in
                </button>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(v => !v)}
                className="md:hidden w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                {mobileOpen ? <X className="w-4 h-4" strokeWidth={2.5} /> : <Menu className="w-4 h-4" strokeWidth={2.5} />}
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          {mobileOpen && (
            <div className="md:hidden border-t border-white/5 py-3 space-y-1">
              {navLinks.map(({ href, label, icon: Icon, badge }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                      ${isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                    <Icon className="w-4 h-4" strokeWidth={2.2} />
                    {label}
                    {badge != null && badge > 0 && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              {user && (
                <Link href="/saved-trips"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all">
                  <Bookmark className="w-4 h-4" strokeWidth={2.2} />
                  Saved Trips
                </Link>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
