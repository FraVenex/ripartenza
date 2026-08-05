'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function GeneratePlanForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState('');
  const [weeks, setWeeks] = useState(6);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intro, setIntro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIntro(null);

    const startDate = new Date().toISOString().slice(0, 10);
    const res = await fetch('/api/assistant/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, weeks, daysPerWeek, startDate }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Errore sconosciuto.');
      return;
    }

    setIntro(data.intro);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded-pill bg-track px-4 py-2 text-sm font-semibold text-white">
        Genera un nuovo piano
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-3 p-5">
      <label className="text-sm font-medium">
        Obiettivo
        <input
          required
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder={'es. "Tornare a correre 5km senza dolore all\'anca"'}
          className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
        />
      </label>
      <div className="flex gap-3">
        <label className="flex-1 text-sm font-medium">
          Durata (settimane)
          <input
            type="number"
            min={1}
            max={12}
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm tabular"
          />
        </label>
        <label className="flex-1 text-sm font-medium">
          Sessioni/settimana
          <input
            type="number"
            min={2}
            max={7}
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm tabular"
          />
        </label>
      </div>

      {error && <p className="text-sm text-track-dark">{error}</p>}
      {intro && <p className="rounded-md bg-recovery-soft p-3 text-sm text-recovery-dark">{intro}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded-pill bg-track px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? 'Genero il piano…' : 'Genera'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-pill px-4 py-2 text-sm font-semibold text-ink-soft">
          Annulla
        </button>
      </div>
    </form>
  );
}
