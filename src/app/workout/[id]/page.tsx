import { redirect, notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { mapWorkoutRow } from '@/lib/server/userContext';
import { WorkoutTypeBadge } from '@/components/Badge';
import { WorkoutActions } from '@/components/WorkoutActions';

export default async function WorkoutDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: row, error } = await supabase.from('workouts').select('*').eq('id', params.id).eq('user_id', user.id).single();
  if (error || !row) notFound();

  const workout = mapWorkoutRow(row);
  const dateLabel = new Date(workout.date + 'T00:00:00').toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex flex-col gap-5 pt-2">
      <header className="flex flex-col gap-1.5">
        <div>
          <WorkoutTypeBadge type={workout.type} />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">{workout.title}</h1>
        <p className="font-stat text-xs font-semibold capitalize text-ink-faint">{dateLabel}</p>
      </header>

      {workout.description && <p className="text-xs leading-relaxed text-ink-soft">{workout.description}</p>}

      {workout.structure.steps.length > 0 && (
        <section className="card divide-y divide-line/60 overflow-hidden shadow-card">
          {workout.structure.steps.map((step, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <p className="font-display text-base font-semibold leading-tight text-ink">{step.label}</p>
                {step.notes && <p className="mt-0.5 text-xs text-ink-soft">{step.notes}</p>}
              </div>
              <div className="shrink-0 text-right font-stat text-xs text-ink-soft tabular">
                {step.durationMin ? <p>{step.durationMin} min</p> : null}
                {step.distanceKm ? <p>{step.distanceKm} km</p> : null}
                {step.targetPace ? <p>{step.targetPace}</p> : null}
                {step.targetHrZone ? <p>{step.targetHrZone}</p> : null}
              </div>
            </div>
          ))}
        </section>
      )}

      {workout.completedActivity && (
        <section className="card p-4 shadow-card">
          <p className="mb-2 font-display text-base font-bold text-ink">Svolto (Garmin)</p>
          <div className="grid grid-cols-3 gap-2 font-stat text-xs tabular">
            {workout.completedActivity.distanceM && <p className="rounded-ios bg-bg p-2 text-center font-semibold text-ink">{(workout.completedActivity.distanceM / 1000).toFixed(2)} km</p>}
            {workout.completedActivity.durationS && <p className="rounded-ios bg-bg p-2 text-center font-semibold text-ink">{Math.round(workout.completedActivity.durationS / 60)} min</p>}
            {workout.completedActivity.avgHrBpm && <p className="rounded-ios bg-bg p-2 text-center font-semibold text-ink">{Math.round(workout.completedActivity.avgHrBpm)} bpm</p>}
          </div>
        </section>
      )}

      <WorkoutActions workout={workout} />
    </div>
  );
}

