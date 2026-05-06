'use client';

import { useState, useRef } from 'react';
import { X, Mail, Lock, Loader2, LogIn, UserPlus, ShieldCheck, Phone, MailCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail } = useAuth();

  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [emailScreen, setEmailScreen] = useState<'signin' | 'signup' | 'confirm'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const resetOtp = () => setOtp(['', '', '', '', '', '']);

  const OtpBoxes = ({ autoFocus = false }: { autoFocus?: boolean }) => (
    <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
      {otp.map((digit, i) => (
        <input key={i} ref={el => { otpRefs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1} value={digit}
          autoFocus={autoFocus && i === 0}
          onChange={e => handleOtpChange(i, e.target.value)}
          onKeyDown={e => handleOtpKeyDown(i, e)}
          className={`w-11 text-center text-xl font-extrabold rounded-xl border-2 focus:outline-none transition-all bg-white/5
            ${digit ? 'border-orange-500 text-white' : 'border-white/20 text-white'}
            focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20`}
          style={{ height: 52 }}
        />
      ))}
    </div>
  );

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await signInWithEmail(email, password);
    if (error) {
      if (error.toLowerCase().includes('not confirmed')) {
        setError('Please check your inbox and click the confirmation link we sent you.');
      } else {
        setError(error);
      }
      setLoading(false);
    } else {
      onClose();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error, confirmed } = await signUpWithEmail(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else if (confirmed) {
      onClose();
    } else {
      setLoading(false);
      setEmailScreen('confirm');
    }
  };

  const handlePhoneSend = async () => {
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
    if (error) { setError(error.message); setLoading(false); }
    else { resetOtp(); setPhoneStep('otp'); setLoading(false); }
  };

  const handlePhoneVerify = async () => {
    const token = otp.join('');
    if (token.length < 6) return;
    setLoading(true); setError(null);
    const { error } = await supabase.auth.verifyOtp({ phone: `+91${phone}`, token, type: 'sms' });
    if (error) { setError(error.message); setLoading(false); } else onClose();
  };

  const switchTab = (t: 'email' | 'phone') => {
    setTab(t); setError(null); resetOtp();
    setPhoneStep('input'); setEmailScreen('signin');
  };

  if (tab === 'phone' && phoneStep === 'otp') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-[#111113] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-8">
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition-colors">
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg mb-4">
              <ShieldCheck className="w-7 h-7 text-white" strokeWidth={2.2} />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Enter OTP</h2>
            <p className="text-white/50 text-sm mt-2">
              We sent a 6-digit code to<br />
              <span className="font-bold text-white">+91 {phone}</span>
            </p>
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-medium text-red-400 text-center">{error}</div>
          )}
          <OtpBoxes autoFocus />
          <button onClick={handlePhoneVerify} disabled={loading || otp.some(d => !d)}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-extrabold text-sm hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} /> : <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />}
            Verify & sign in
          </button>
          <p className="mt-4 text-center text-xs text-white/40">
            Wrong number?{' '}
            <button onClick={() => { setPhoneStep('input'); resetOtp(); setError(null); }}
              className="font-bold text-orange-400 hover:underline">Go back</button>
          </p>
        </div>
      </div>
    );
  }

  if (emailScreen === 'confirm') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-[#111113] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition-colors">
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg mb-5">
            <MailCheck className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Check your inbox</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-1">We sent a confirmation link to</p>
          <p className="font-bold text-white text-base mb-5">{email}</p>
          <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-white/60 leading-relaxed mb-6">
            Click the <span className="font-bold text-white">Confirm your email</span> button in the email to activate your account. Then come back and sign in.
          </div>
          <button
            onClick={() => { setEmailScreen('signin'); setError(null); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-extrabold text-sm transition-all">
            <LogIn className="w-4 h-4" strokeWidth={2.5} />
            Back to sign in
          </button>
          <p className="mt-3 text-xs text-white/30">Didn&apos;t get the email? Check your spam folder.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#111113] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-8">
        <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 transition-colors">
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-[0_0_20px_rgba(249,115,22,0.4)] mb-4">
            <LogIn className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Sign in to Tourisma</h2>
          <p className="text-white/40 text-sm mt-1">Save and revisit your itineraries anytime.</p>
        </div>

        <div className="flex bg-white/5 rounded-xl p-1 mb-5">
          {(['email', 'phone'] as const).map(t => (
            <button key={t} onClick={() => switchTab(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all
                ${tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
              {t === 'email' ? <Mail className="w-4 h-4" strokeWidth={2.2} /> : <Phone className="w-4 h-4" strokeWidth={2.2} />}
              {t === 'email' ? 'Email' : 'Phone'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-medium text-red-400">{error}</div>
        )}

        {tab === 'email' && (
          <form onSubmit={emailScreen === 'signin' ? handleSignIn : handleSignUp} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={2.2} />
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all" />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={2.2} />
              <input type="password" placeholder={emailScreen === 'signup' ? 'Password (min 6 chars)' : 'Password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all" />
            </div>
            <button type="submit" disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-extrabold text-sm hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                : emailScreen === 'signin' ? <LogIn className="w-4 h-4" strokeWidth={2.5} /> : <UserPlus className="w-4 h-4" strokeWidth={2.5} />}
              {emailScreen === 'signin' ? 'Sign in' : 'Create account'}
            </button>
            <p className="text-center text-sm text-white/40 pt-1">
              {emailScreen === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button type="button"
                onClick={() => { setEmailScreen(s => s === 'signin' ? 'signup' : 'signin'); setError(null); }}
                className="font-bold text-orange-400 hover:underline">
                {emailScreen === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </form>
        )}

        {tab === 'phone' && phoneStep === 'input' && (
          <div className="space-y-3">
            <div className="flex rounded-xl border border-white/10 overflow-hidden focus-within:border-orange-500/50 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
              <span className="flex items-center gap-1.5 pl-4 pr-3 bg-white/5 border-r border-white/10 text-sm font-bold text-white whitespace-nowrap">
                🇮🇳 +91
              </span>
              <input type="tel" placeholder="10-digit mobile number" value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 px-4 py-3.5 text-sm font-medium tracking-widest focus:outline-none bg-white/5 text-white placeholder:text-white/30" />
            </div>
            <button onClick={handlePhoneSend} disabled={loading || phone.length < 10}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-extrabold text-sm hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} /> : <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />}
              Send OTP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
