import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { mapWorkoutRow } from '@/lib/server/userContext';
import { WorkoutCard } from '@/components/WorkoutCard';
import type { Workout } from '@/lib/types';

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

export default async function PlanPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

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

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex flex-col gap-2">
        <p className="font-stat text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Programmazione</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">Piano 8 Settimane</h1>
          <Link href="/coach" className="ios-btn-active rounded-pill bg-track px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm">
            Modifica col Coach →
          </Link>
        </div>
      </header>

      <div className="card flex items-center justify-between gap-3 p-4 shadow-card">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-ink">Vista Calendario Piano</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
            Per creare, modificare o azzerare il piano usa la chat del coach.
          </p>
        </div>
        <Link href="/coach" className="ios-btn-active shrink-0 rounded-pill border border-line bg-bg px-3 py-1.5 text-xs font-semibold text-ink-soft hover:text-ink">
          Chat Coach
        </Link>
      </div>

      {grouped.size === 0 && (
        <div className="card p-5 text-center text-xs leading-relaxed text-ink-soft shadow-card">
          Nessun allenamento ancora nel piano. <Link href="/coach" className="font-semibold text-track underline">Scrivi al Coach</Link> per generare il tuo piano da 8 settimane!
        </div>
      )}

      {Array.from(grouped.entries()).map(([weekStart, items]) => (
        <section key={weekStart} className="flex flex-col gap-2">
          <h2 className="px-1 font-stat text-[11px] font-bold uppercase tracking-wider text-ink-faint">
            Settimana del {new Date(weekStart + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
          </h2>
          <div className="flex flex-col gap-2">
            {items.map((w) => (
              <WorkoutCard key={w.id} workout={w} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

