'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Workout } from '@/lib/types';

export function WorkoutActions({ workout }: { workout: Workout }) {
  const router = useRouter();
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
    const stepsStr = workout.structure?.steps?.map((s) => {
      const item = s as any;
      if (item.type === 'repeat' || Boolean(item.repeatCount && item.steps)) {
        const inner = (item.steps || []).map((sub: any) => `${sub.label}${sub.durationMin ? ` ${sub.durationMin}m` : ''}${sub.distanceKm ? ` ${sub.distanceKm}km` : ''}`).join(' + ');
        return `${item.repeatCount}x(${inner})`;
      }
      return `${item.label}${item.durationMin ? ` ${item.durationMin}m` : ''}${item.distanceKm ? ` ${item.distanceKm}km` : ''}`;
    }).join(', ') ?? '';
    const msg = `Vorrei discutere e modificare l'allenamento "${workout.title}" (${workout.type}${stepsStr ? `: ${stepsStr}` : ''}).`;
    router.push(`/coach?initial_message=${encodeURIComponent(msg)}`);
  }

  return (
    <div className="card flex flex-col gap-3 p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDiscussWithCoach}
            className="ios-btn-active rounded-pill bg-track px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95"
          >
            Discuti con il Coach 💬
          </button>
          <button
            onClick={sendToGarmin}
            className="ios-btn-active rounded-pill border border-zone bg-zone-soft/30 px-3.5 py-2 text-xs font-semibold text-zone hover:bg-zone-soft disabled:opacity-60"
            disabled={sendingGarmin}
          >
            {sendingGarmin ? 'Invio in corso…' : 'Invia all\'orologio Garmin ⌚'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {workout.status === 'planned' ? (
            <button
              onClick={() => updateWorkout({ status: 'skipped' })}
              className="rounded-pill border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-surfaceSunken disabled:opacity-60"
              disabled={saving}
            >
              Segna come saltato
            </button>
          ) : (
            <button
              onClick={() =>
                updateWorkout({
                  status: 'planned',
                  completed_activity: null,
                  rpe: null,
                  pain_score: null,
                  pain_location: null,
                  notes: null,
                  coach_feedback: null,
                })
              }
              className="rounded-pill border border-track/40 bg-track-soft/40 px-3 py-1.5 text-xs font-bold text-track-dark hover:bg-track-soft disabled:opacity-60"
              disabled={saving}
              title="Ripristina questa sessione (o test) nello stato da svolgere"
            >
              Ripristina come Da svolgere 🔄
            </button>
          )}
        </div>
      </div>

      {garminMsg && <p className="text-xs font-medium text-track">{garminMsg}</p>}
    </div>
  );
}
