import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { mapWorkoutRow } from '@/lib/server/userContext';
import { WeekTrack } from '@/components/WeekTrack';
import { WorkoutCard } from '@/components/WorkoutCard';
import { LoadLine } from '@/components/LoadLine';
import { CoachSyncNotice } from '@/components/CoachSyncNotice';
import type { Workout } from '@/lib/types';

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function groupByIsoWeek(workouts: Workout[]): Map<string, Workout[]> {
  const groups = new Map<string, Workout[]>();
  for (const w of workouts) {
    const d = new Date(w.date + 'T00:00:00');
    const day = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    const key = monday.toISOString().slice(0, 10);
    groups.set(key, [...(groups.get(key) ?? []), w]);
  }
  return groups;
}

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const today = new Date().toISOString().slice(0, 10);
  const past = new Date();
  past.setDate(past.getDate() - 7);

  const { data: rows } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', past.toISOString().slice(0, 10))
    .order('date', { ascending: true });

  const mapped = (rows ?? []).map(mapWorkoutRow);
  const grouped = groupByIsoWeek(mapped);

  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const currentWeekWorkouts = mapped.filter(
    (w) => w.date >= weekStart.toISOString().slice(0, 10) && w.date < weekEnd.toISOString().slice(0, 10)
  );

  const todayWorkout = mapped.find((w) => w.date === today);

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex flex-col gap-2">
        <p className="font-stat text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
          Programmazione
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">Piano di Allenamento</h1>
          <Link
            href="/coach"
            className="ios-btn-active rounded-pill bg-track px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm"
          >
            Modifica col Coach →
          </Link>
        </div>
      </header>

      <CoachSyncNotice />

      <section className="card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-ink">Questa Settimana</h2>
          <span className="font-stat text-[11px] font-medium text-ink-faint">
            {currentWeekWorkouts.filter((w) => w.status === 'completed').length} / {currentWeekWorkouts.length} completati
          </span>
        </div>
        <WeekTrack weekStart={weekStart} workouts={currentWeekWorkouts} />
      </section>

      {todayWorkout && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-sm font-bold text-ink">In Programma Oggi</h2>
          <WorkoutCard workout={todayWorkout} />
        </section>
      )}

      {grouped.size === 0 ? (
        <section className="card flex flex-col items-center gap-4 p-6 text-center text-ink-soft shadow-card">
          <LoadLine className="h-12 w-full max-w-xs text-track" />
          <p className="max-w-xs text-xs leading-relaxed">
            Nessun allenamento nel piano. Parla con il Coach per generare la tua programmazione personalizzata.
          </p>
          <Link
            href="/coach"
            className="ios-btn-active rounded-pill bg-track px-4 py-2 text-xs font-semibold text-white shadow-sm"
          >
            Genera Piano col Coach
          </Link>
        </section>
      ) : (
        <section className="flex flex-col gap-6">
          {Array.from(grouped.entries()).map(([wStart, items]) => (
            <div key={wStart} className="flex flex-col gap-2">
              <h2 className="px-1 font-stat text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                Settimana del {new Date(wStart + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
              </h2>
              <div className="flex flex-col gap-2">
                {items.map((w) => (
                  <WorkoutCard key={w.id} workout={w} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/coach"
          className="ios-card-active card p-4 text-xs font-semibold text-ink shadow-card hover:border-track/40"
        >
          Chat Coach AI →
        </Link>
        <Link
          href="/profile"
          className="ios-card-active card p-4 text-xs font-semibold text-ink shadow-card hover:border-track/40"
        >
          Profilo medico →
        </Link>
      </section>
    </div>
  );
}

