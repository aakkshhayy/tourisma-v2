'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mail, Lock, Loader2, LogIn, UserPlus, ShieldCheck, AtSign, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

type Screen = 'signin' | 'signup' | 'verify';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

function OtpBoxes({
  otp, onChange, onKeyDown, onPaste, refs, autoFocus,
}: {
  otp: string[];
  onChange: (i: number, val: string) => void;
  onKeyDown: (i: number, e: React.KeyboardEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex justify-center gap-2.5" onPaste={onPaste}>
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          autoFocus={autoFocus && i === 0}
          onChange={e => onChange(i, e.target.value)}
          onKeyDown={e => onKeyDown(i, e)}
          className={`w-12 h-14 text-center text-2xl font-extrabold rounded-xl border-2 focus:outline-none transition-all bg-white/5
            ${digit ? 'border-orange-500 text-white' : 'border-white/15 text-white'}
            focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
        />
      ))}
    </div>
  );
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signInWithIdentifier, signUpWithEmail, verifyEmailOtp, checkUsernameAvailable } = useAuth();

  const [screen, setScreen] = useState<Screen>('signin');

  // shared fields
  const [identifier, setIdentifier] = useState(''); // email or username for sign-in
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // username availability
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

  // OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── username debounce ──────────────────────────────────────────────────
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validateUsername = useCallback((val: string) => {
    if (!val) { setUsernameStatus('idle'); return; }
    if (!USERNAME_RE.test(val.toLowerCase())) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    if (checkTimeout.current) clearTimeout(checkTimeout.current);
    checkTimeout.current = setTimeout(async () => {
      const available = await checkUsernameAvailable(val);
      setUsernameStatus(available ? 'available' : 'taken');
    }, 500);
  }, [checkUsernameAvailable]);

  useEffect(() => {
    validateUsername(username);
    return () => { if (checkTimeout.current) clearTimeout(checkTimeout.current); };
  }, [username, validateUsername]);

  // ── OTP helpers ───────────────────────────────────────────────────────
  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[i] = digit; setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split('')); otpRefs.current[5]?.focus(); }
    e.preventDefault();
  };

  const resetForm = () => {
    setIdentifier(''); setEmail(''); setUsername(''); setPassword('');
    setOtp(['', '', '', '', '', '']); setError(null); setUsernameStatus('idle');
    setShowPassword(false);
  };

  const switchScreen = (s: Screen) => { resetForm(); setScreen(s); };

  // ── handlers ──────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await signInWithIdentifier(identifier, password);
    if (error === 'EMAIL_NOT_CONFIRMED') {
      // bounce them to verification — we need their email
      setEmail(identifier.includes('@') ? identifier : '');
      setScreen('verify');
    } else if (error) {
      setError(error);
    } else {
      onClose();
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus !== 'available') return;
    setLoading(true); setError(null);
    const { error, confirmed } = await signUpWithEmail(email, password, username);
    if (error) {
      setError(error);
      setLoading(false);
    } else if (confirmed) {
      onClose();
    } else {
      setLoading(false);
      setScreen('verify');
    }
  };

  const handleVerify = async () => {
    const token = otp.join('');
    if (token.length < 6) return;
    setLoading(true); setError(null);
    const { error } = await verifyEmailOtp(email, token, username);
    if (error) {
      setError('Invalid or expired code. Check your inbox and try again.');
      setLoading(false);
    } else {
      onClose();
    }
  };

  // ── username hint ─────────────────────────────────────────────────────
  const usernameHint = () => {
    if (usernameStatus === 'invalid') return <span className="text-red-400">3–20 chars, letters, numbers, underscores only.</span>;
    if (usernameStatus === 'checking') return <span className="text-white/40">Checking…</span>;
    if (usernameStatus === 'taken') return <span className="text-red-400">Username already taken.</span>;
    if (usernameStatus === 'available') return <span className="text-emerald-400">Username available ✓</span>;
    return null;
  };

  const shellCls = "fixed inset-0 z-50 flex items-center justify-center p-4";
  const cardCls = "relative bg-[#111113] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-8";
  const closeBtnCls = "absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition-colors";

  // ── verify screen ─────────────────────────────────────────────────────
  if (screen === 'verify') {
    return (
      <div className={shellCls}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className={cardCls}>
          <button onClick={onClose} className={closeBtnCls}><X className="w-4 h-4" strokeWidth={2.5} /></button>
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-[0_0_24px_rgba(249,115,22,0.4)] mb-4">
            <ShieldCheck className="w-7 h-7 text-white" strokeWidth={2.2} />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Check your inbox</h2>
          <p className="text-white/50 text-sm mt-2 leading-relaxed">
            We sent a 6-digit code to<br />
            <span className="font-bold text-white">{email || 'your email'}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-medium text-red-400 text-center">
            {error}
          </div>
        )}

        <OtpBoxes
          otp={otp}
          onChange={handleOtpChange}
          onKeyDown={handleOtpKeyDown}
          onPaste={handleOtpPaste}
          refs={otpRefs}
          autoFocus
        />

        <button
          onClick={handleVerify}
          disabled={loading || otp.some(d => !d)}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-extrabold text-sm hover:shadow-[0_0_24px_rgba(249,115,22,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
            : <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />}
          Verify & continue
        </button>

        <p className="mt-4 text-center text-xs text-white/40">
          Didn&apos;t get the code? Check your spam folder or{' '}
          <button
            onClick={() => { switchScreen('signup'); }}
            className="font-bold text-orange-400 hover:underline">
            try again
          </button>
        </p>
        </div>
      </div>
    );
  }

  // ── sign-in / sign-up screen ──────────────────────────────────────────
  const isSignIn = screen === 'signin';

  return (
    <div className={shellCls}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cardCls}>
        <button onClick={onClose} className={closeBtnCls}><X className="w-4 h-4" strokeWidth={2.5} /></button>
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-[0_0_20px_rgba(249,115,22,0.4)] mb-4">
          {isSignIn
            ? <LogIn className="w-6 h-6 text-white" strokeWidth={2.5} />
            : <UserPlus className="w-6 h-6 text-white" strokeWidth={2.5} />}
        </div>
        <h2 className="text-2xl font-extrabold text-white">
          {isSignIn ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="text-white/40 text-sm mt-1">
          {isSignIn
            ? 'Sign in to access your saved itineraries.'
            : 'Join Tourisma and start planning your India trips.'}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-white/5 rounded-xl p-1 mb-5">
        {(['signin', 'signup'] as const).map(s => (
          <button
            key={s}
            onClick={() => switchScreen(s)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all
              ${screen === s ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
            {s === 'signin'
              ? <><LogIn className="w-3.5 h-3.5" strokeWidth={2.5} /> Sign in</>
              : <><UserPlus className="w-3.5 h-3.5" strokeWidth={2.5} /> Sign up</>}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-medium text-red-400">
          {error}
        </div>
      )}

      {/* Sign in form */}
      {isSignIn && (
        <form onSubmit={handleSignIn} className="space-y-3">
          <div className="relative">
            <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={2.2} />
            <input
              type="text"
              placeholder="Email or username"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={2.2} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={2.2} /> : <Eye className="w-4 h-4" strokeWidth={2.2} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !identifier || !password}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-extrabold text-sm hover:shadow-[0_0_24px_rgba(249,115,22,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
              : <LogIn className="w-4 h-4" strokeWidth={2.5} />}
            Sign in
          </button>
        </form>
      )}

      {/* Sign up form */}
      {!isSignIn && (
        <form onSubmit={handleSignUp} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={2.2} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div>
            <div className="relative">
              <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={2.2} />
              <input
                type="text"
                placeholder="Username (e.g. akshay_trips)"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                required
                maxLength={20}
                autoComplete="username"
                className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border text-white text-sm font-medium placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all
                  ${usernameStatus === 'available' ? 'border-emerald-500/50 focus:ring-emerald-500/20' :
                    usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-500/50 focus:ring-red-500/20' :
                    'border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20'}`}
              />
            </div>
            {username && (
              <p className="mt-1.5 ml-1 text-xs">{usernameHint()}</p>
            )}
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={2.2} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={2.2} /> : <Eye className="w-4 h-4" strokeWidth={2.2} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password || usernameStatus !== 'available'}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-extrabold text-sm hover:shadow-[0_0_24px_rgba(249,115,22,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
              : <UserPlus className="w-4 h-4" strokeWidth={2.5} />}
            Create account
          </button>

          <p className="text-center text-xs text-white/30 pt-1">
            We&apos;ll email you a 6-digit code to verify your account.
          </p>
        </form>
      )}
      </div>
    </div>
  );
}
