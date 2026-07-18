// ============================================================
// AutoApply AI — Login Page
// ============================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiClient.post('/auth/login', { email, password });
      setAuth(data.user, data.tokens);
      
      // Route based on onboarding status
      if (data.user.onboardingComplete) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
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
          <h2 className="text-xl font-semibold mt-4 mb-1">Welcome back</h2>
          <p className="text-sm text-neutral-400">Log in to manage your career automation</p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-950/50 border border-red-500/30 text-red-400 rounded-md">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-neutral-300">Password</label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-primary-500 outline-none rounded-md text-sm transition-all"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-md transition-all cursor-pointer"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-xs text-center text-neutral-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
