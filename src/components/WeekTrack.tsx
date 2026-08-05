'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { WORKOUT_TYPE_COLOR, WORKOUT_TYPE_LABEL, type Workout } from '@/lib/types';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const BAR_COLOR: Record<string, string> = {
  track: 'bg-track',
  recovery: 'bg-recovery',
  zone: 'bg-zone',
  signal: 'bg-signal',
};

/**
 * Visualizza la settimana come 7 "corsie" orizzontali (una per giorno),
 * con l'altezza/intensità del colore che richiama la pista d'atletica
 * invece del solito calendario a caselle: l'obiettivo è far leggere a
 * colpo d'occhio il ritmo settimanale (facile/duro/riposo) più che le date.
 */
export function WeekTrack({ weekStart, workouts }: { weekStart: Date; workouts: Workout[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const byDate = new Map<string, Workout[]>();
  for (const w of workouts) {
    const key = w.date;
    byDate.set(key, [...(byDate.get(key) ?? []), w]);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d, i) => {
        const iso = d.toISOString().slice(0, 10);
        const dayWorkouts = byDate.get(iso) ?? [];
        const isToday = iso === today;
        return (
          <div key={iso} className="flex flex-col items-center gap-2">
            <span className={clsx('font-stat text-xs', isToday ? 'text-track font-bold' : 'text-ink-faint')}>
              {DAY_LABELS[i]}
            </span>
            <div className="flex w-full flex-col gap-1">
              {dayWorkouts.length === 0 && (
                <div className="h-16 w-full rounded-md border border-dashed border-line" aria-hidden="true" />
              )}
              {dayWorkouts.map((w) => {
                const color = WORKOUT_TYPE_COLOR[w.type];
                return (
                  <Link
                    key={w.id}
                    href={`/workout/${w.id}`}
                    className={clsx(
                      'block h-16 w-full rounded-md transition-transform hover:-translate-y-0.5',
                      BAR_COLOR[color],
                      w.status === 'completed' && 'opacity-60',
                      w.status === 'skipped' && 'opacity-30'
                    )}
                    title={`${WORKOUT_TYPE_LABEL[w.type]} · ${w.title}`}
                  >
                    <span className="sr-only">{w.title}</span>
                  </Link>
                );
              })}
            </div>
            <span className="font-stat text-[11px] text-ink-faint">{d.getDate()}</span>
          </div>
        );
      })}
    </div>
  );
}
