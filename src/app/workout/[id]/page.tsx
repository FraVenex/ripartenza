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
          {workout.structure.steps.map((item, i) => {
            const isRepeat = (item as any).type === 'repeat' || Boolean((item as any).repeatCount && (item as any).steps);

            if (isRepeat) {
              const repeat = item as any;
              return (
                <div key={i} className="bg-bg/40 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-pill bg-track/10 px-2.5 py-0.5 font-stat text-xs font-bold text-track">
                      {repeat.repeatCount}× Ripetizioni
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 pl-3 border-l-2 border-track/30">
                    {(repeat.steps || []).map((sub: any, j: number) => (
                      <div key={j} className="flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-display font-semibold text-ink">{sub.label}</p>
                          {sub.notes && <p className="text-[11px] text-ink-soft">{sub.notes}</p>}
                        </div>
                        <div className="shrink-0 text-right font-stat text-[11px] text-ink-soft tabular">
                          {sub.durationMin ? <p>{sub.durationMin} min</p> : null}
                          {sub.distanceKm ? <p>{sub.distanceKm} km</p> : null}
                          {sub.targetPace ? <p>{sub.targetPace}</p> : null}
                          {sub.targetHrZone ? <p>FC: {sub.targetHrZone}</p> : null}
                          {sub.targetCadence ? <p>Cad: {sub.targetCadence}</p> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            const step = item as any;
            return (
              <div key={i} className="flex items-center justify-between gap-3 p-3.5">
                <div>
                  <p className="font-display text-base font-semibold leading-tight text-ink">{step.label}</p>
                  {step.notes && <p className="mt-0.5 text-xs text-ink-soft">{step.notes}</p>}
                </div>
                <div className="shrink-0 text-right font-stat text-xs text-ink-soft tabular">
                  {step.durationMin ? <p>{step.durationMin} min</p> : null}
                  {step.distanceKm ? <p>{step.distanceKm} km</p> : null}
                  {step.targetPace ? <p>{step.targetPace}</p> : null}
                  {step.targetHrZone ? <p>FC: {step.targetHrZone}</p> : null}
                  {step.targetCadence ? <p>Cad: {step.targetCadence}</p> : null}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {workout.completedActivity && (
        <section className="card p-4 shadow-card">
          <p className="mb-2 font-display text-base font-bold text-ink">Svolto (Garmin)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-stat text-xs tabular">
            {workout.completedActivity.distanceM && <p className="rounded-ios bg-bg p-2 text-center font-semibold text-ink">{(workout.completedActivity.distanceM / 1000).toFixed(2)} km</p>}
            {workout.completedActivity.durationS && <p className="rounded-ios bg-bg p-2 text-center font-semibold text-ink">{Math.round(workout.completedActivity.durationS / 60)} min</p>}
            {workout.completedActivity.avgHrBpm && <p className="rounded-ios bg-bg p-2 text-center font-semibold text-ink">FC Med: {Math.round(workout.completedActivity.avgHrBpm)} bpm</p>}
            {workout.completedActivity.maxHrBpm && <p className="rounded-ios bg-bg p-2 text-center font-semibold text-ink">FC Max: {Math.round(workout.completedActivity.maxHrBpm)} bpm</p>}
          </div>
        </section>
      )}

      <WorkoutActions workout={workout} />
    </div>
  );
}

