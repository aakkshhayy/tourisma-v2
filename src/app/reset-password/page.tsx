'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);   // true once recovery session is active
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the recovery token in the URL is valid
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push('/'), 2500);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
      <div className="bg-[#111113] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-8">

        {done ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg mb-5">
              <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-2">Password updated!</h2>
            <p className="text-white/40 text-sm">Redirecting you to the home page…</p>
          </div>
        ) : !ready ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-[0_0_24px_rgba(249,115,22,0.4)] mb-5">
              <KeyRound className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-2">Verifying link…</h2>
            <p className="text-white/40 text-sm">If this page doesn&apos;t load, your reset link may have expired. Request a new one from the sign-in screen.</p>
            <div className="mt-6 flex justify-center">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" strokeWidth={2.5} />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-[0_0_20px_rgba(249,115,22,0.4)] mb-4">
                <KeyRound className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-extrabold text-white">Set new password</h2>
              <p className="text-white/40 text-sm mt-1">Choose a strong password for your account.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-medium text-red-400">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={2.2} />
                <input type={showPw ? 'text' : 'password'} placeholder="New password (min 6 chars)"
                  value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" strokeWidth={2.2} /> : <Eye className="w-4 h-4" strokeWidth={2.2} />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={2.2} />
                <input type={showPw ? 'text' : 'password'} placeholder="Confirm new password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all" />
              </div>
              <button type="submit" disabled={loading || !password || !confirm}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-extrabold text-sm hover:shadow-[0_0_24px_rgba(249,115,22,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} /> : <KeyRound className="w-4 h-4" strokeWidth={2.5} />}
                Update password
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
