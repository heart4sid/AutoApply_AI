// ============================================================
// AutoApply AI — Register Page
// ============================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!consent) {
      setError('You must authorize data processing consent to proceed.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Please check validation rules.');
      }

      setAuth(data.user, data.tokens);
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-100 px-6 font-sans">
      <div className="w-full max-w-md p-8 rounded-lg border border-neutral-800 bg-neutral-900/60 glass flex flex-col gap-6">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            ✦ AutoApply AI
          </Link>
          <h2 className="text-xl font-semibold mt-4 mb-1">Create your account</h2>
          <p className="text-sm text-neutral-400">Get started with autonomous application tracking</p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-950/50 border border-red-500/30 text-red-400 rounded-md">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-neutral-300">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-primary-500 outline-none rounded-md text-sm transition-all"
              placeholder="Priya Sharma"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-neutral-300">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-primary-500 outline-none rounded-md text-sm transition-all"
              placeholder="name@email.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-neutral-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-primary-500 outline-none rounded-md text-sm transition-all"
              placeholder="Min 12 chars, 1 upper, 1 special"
            />
          </div>

          <div className="flex items-start gap-3 py-1">
            <input
              id="consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 accent-primary-500 cursor-pointer"
            />
            <label htmlFor="consent" className="text-xs text-neutral-400 leading-normal cursor-pointer select-none">
              I authorize AutoApply AI to process my resume and represent me in auto-applying to jobs. I accept the Terms and Privacy Policy.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-md transition-all cursor-pointer"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-xs text-center text-neutral-400">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
