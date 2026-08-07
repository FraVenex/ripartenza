'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Workout } from '@/lib/types';

export function WorkoutActions({ workout }: { workout: Workout }) {
  const router = useRouter();
  const [rpe, setRpe] = useState<number | ''>(workout.rpe ?? '');
  const [pain, setPain] = useState<number | ''>(workout.painScore ?? 0);
  const [painLocation, setPainLocation] = useState(workout.painLocation ?? '');
  const [saving, setSaving] = useState(false);
  const [garminMsg, setGarminMsg] = useState<string | null>(null);
  const [sendingGarmin, setSendingGarmin] = useState(false);

  async function updateWorkout(fields: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/workouts/${workout.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  async function sendToGarmin() {
    setSendingGarmin(true);
    setGarminMsg(null);
    const res = await fetch('/api/garmin/workout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workoutId: workout.id }),
    });
    const data = await res.json();
    setSendingGarmin(false);
    setGarminMsg(res.ok ? 'Inviato a Garmin ✓' : data.error ?? 'Errore invio a Garmin.');
  }

  function handleDiscussWithCoach() {
    const stepsStr = workout.structure?.steps?.map((s) => `${s.label}${s.durationMin ? ` ${s.durationMin}m` : ''}${s.distanceKm ? ` ${s.distanceKm}km` : ''}`).join(', ') ?? '';
    const msg = `Vorrei discutere e modificare l'allenamento "${workout.title}" del ${workout.date} (${workout.type}${stepsStr ? `: ${stepsStr}` : ''}). Vorrei cambiare...`;
    router.push(`/coach?initial_message=${encodeURIComponent(msg)}`);
  }

  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleDiscussWithCoach}
          className="rounded-pill bg-track px-4 py-2 text-sm font-semibold text-white"
        >
          Discuti o modifica con il Coach 💬
        </button>
        <button
          onClick={() => updateWorkout({ status: 'skipped' })}
          className="rounded-pill border border-line px-4 py-2 text-sm font-semibold text-ink-soft disabled:opacity-60"
          disabled={saving}
        >
          Salta
        </button>
        <button
          onClick={sendToGarmin}
          className="rounded-pill border border-zone px-4 py-2 text-sm font-semibold text-zone disabled:opacity-60"
          disabled={sendingGarmin}
        >
          {sendingGarmin ? 'Invio…' : 'Invia a Garmin'}
        </button>
      </div>
      {garminMsg && <p className="text-sm text-ink-soft">{garminMsg}</p>}

      <div className="border-t border-line pt-4">
        <p className="mb-2 font-display text-lg leading-none">Come è andata?</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium">
            Sforzo percepito (RPE 1-10)
            <input
              type="number"
              min={1}
              max={10}
              value={rpe}
              onChange={(e) => setRpe(e.target.value ? Number(e.target.value) : '')}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm tabular"
            />
          </label>
          <label className="text-sm font-medium">
            Dolore (0-10)
            <input
              type="number"
              min={0}
              max={10}
              value={pain}
              onChange={(e) => setPain(e.target.value ? Number(e.target.value) : '')}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm tabular"
            />
          </label>
        </div>
        <label className="mt-3 block text-sm font-medium">
          Dove fa male (se presente)
          <input
            value={painLocation}
            onChange={(e) => setPainLocation(e.target.value)}
            placeholder="es. anca destra, tendine d'Achille sinistro…"
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
          />
        </label>
        <button
          onClick={() => updateWorkout({ rpe: rpe || null, painScore: pain === '' ? null : pain, painLocation: painLocation || null })}
          disabled={saving}
          className="mt-3 rounded-pill bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Salvo…' : 'Salva feedback'}
        </button>
        <p className="mt-2 text-xs text-ink-faint">
          Questo feedback viene letto dal coach AI alla prossima conversazione per adattare il carico.
        </p>
      </div>
    </div>
  );
}
