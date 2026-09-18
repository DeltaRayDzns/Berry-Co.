'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(
        error.message.toLowerCase().includes('email not confirmed')
          ? 'Please confirm your email address before signing in.'
          : error.message
      );
      setLoading(false);
    } else {
      router.push(searchParams.get('redirectTo') || '/page');
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#EAD0AA] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FBF4E4] rounded-[2.5rem] p-8 shadow-sm border border-[#35322E]/10 flex flex-col items-center">
        
        {/* Brand Header */}
        <Link href="/" className="text-4xl font-extrabold text-[#E23B2E] tracking-tight mb-2">
          Deckdrop
        </Link>
        <h1 className="text-xl font-extrabold text-[#35322E] mb-6">Welcome Back</h1>

        {/* Error Message Banner */}
        {errorMsg && (
          <div className="w-full bg-[#E23B2E]/10 border border-[#E23B2E] text-[#E23B2E] text-xs font-bold rounded-xl p-3 mb-4 text-center">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-[#35322E] mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@example.com"
              className="w-full bg-[#F3E4C8] border border-[#35322E]/30 rounded-xl px-4 py-2.5 text-sm text-[#35322E] outline-none focus:border-[#E23B2E] transition font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#35322E] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#F3E4C8] border border-[#35322E]/30 rounded-xl px-4 py-2.5 text-sm text-[#35322E] outline-none focus:border-[#E23B2E] transition font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E23B2E] hover:bg-[#B82A20] text-[#FFFDF8] font-extrabold py-3 rounded-full transition shadow-sm mt-2 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-xs text-[#35322E] font-semibold text-center">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[#E23B2E] font-bold hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}