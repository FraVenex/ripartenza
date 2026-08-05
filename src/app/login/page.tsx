'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LoadLine } from '@/components/LoadLine';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center gap-6 px-4">
      <div className="w-full max-w-xs">
        <LoadLine className="mb-3 h-8 w-full text-track" />
        <h1 className="text-center font-display text-4xl font-extrabold tracking-tight text-ink">Ripartenza</h1>
        <p className="mt-1 text-center text-xs font-medium text-ink-soft">Corri con metodo, non con paura.</p>

        <form onSubmit={handleSubmit} className="card mt-6 flex flex-col gap-3.5 p-5 shadow-card">
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-ios border border-line bg-bg px-3 py-2 text-xs font-normal outline-none focus:border-zone"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-ios border border-line bg-bg px-3 py-2 text-xs font-normal outline-none focus:border-zone"
            />
          </label>

          {error && <p className="text-center text-xs font-semibold text-track-dark">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="ios-btn-active mt-1 rounded-pill bg-track px-4 py-2.5 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
          >
            {loading ? 'Attendere…' : mode === 'signin' ? 'Accedi' : 'Crea account'}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-center text-xs font-semibold text-ink-faint underline hover:text-ink"
          >
            {mode === 'signin' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}

