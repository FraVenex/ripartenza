import Link from 'next/link';
import { WorkoutTypeBadge } from '@/components/Badge';
import type { Workout } from '@/lib/types';

const STATUS_LABEL: Record<Workout['status'], string> = {
  planned: 'Da fare',
  completed: 'Completato',
  skipped: 'Saltato',
  modified: 'Modificato',
};

export function WorkoutCard({ workout }: { workout: Workout }) {
  const dateLabel = new Date(workout.date + 'T00:00:00').toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const msg = `Vorrei discutere e modificare l'allenamento "${workout.title}" del ${workout.date} (${workout.type}). Vorrei cambiare...`;
  const coachUrl = `/coach?initial_message=${encodeURIComponent(msg)}`;

  return (
    <div className="ios-card-active card flex items-center justify-between gap-3 p-4 transition-all hover:shadow-card">
      <Link href={`/workout/${workout.id}`} className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <WorkoutTypeBadge type={workout.type} />
          <span className="font-stat text-[11px] font-medium text-ink-faint">{dateLabel}</span>
        </div>
        <p className="truncate font-display text-lg font-semibold leading-tight text-ink">{workout.title}</p>
        {workout.structure?.totalDistanceKm || workout.structure?.totalDurationMin ? (
          <p className="mt-1 font-stat text-xs text-ink-soft tabular">
            {workout.structure.totalDistanceKm ? `${workout.structure.totalDistanceKm} km` : ''}
            {workout.structure.totalDistanceKm && workout.structure.totalDurationMin ? ' · ' : ''}
            {workout.structure.totalDurationMin ? `${workout.structure.totalDurationMin} min` : ''}
          </p>
        ) : null}
      </Link>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="font-stat text-[11px] font-medium text-ink-faint">{STATUS_LABEL[workout.status]}</span>
        <Link
          href={coachUrl}
          className="ios-btn-active rounded-pill bg-bg border border-line px-3 py-1 text-xs font-semibold text-ink-soft hover:bg-surfaceSunken hover:text-ink"
          title="Modifica o discuti questo allenamento in chat col coach"
        >
          Discuti 💬
        </Link>
      </div>
    </div>
  );
}

