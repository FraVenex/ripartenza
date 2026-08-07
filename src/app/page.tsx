import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadRecentWorkouts } from '@/lib/server/userContext';
import { WeekTrack } from '@/components/WeekTrack';
import { WorkoutCard } from '@/components/WorkoutCard';
import { LoadLine } from '@/components/LoadLine';
import { CoachSyncNotice } from '@/components/CoachSyncNotice';

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const weekStart = startOfWeek(new Date());
  const allRecent = await loadRecentWorkouts(supabase, user.id, 28);
  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekWorkouts = allRecent.filter((w) => w.date >= weekStart.toISOString().slice(0, 10) && w.date < weekEnd.toISOString().slice(0, 10));
  const todayWorkout = weekWorkouts.find((w) => w.date === today);

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex flex-col gap-1">
        <p className="font-stat text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Questa settimana</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">Oggi</h1>
      </header>

      <CoachSyncNotice />

      <section className="card p-4 shadow-card">
        <WeekTrack weekStart={weekStart} workouts={weekWorkouts} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">In Programma</h2>
        {todayWorkout ? (
          <WorkoutCard workout={todayWorkout} />
        ) : (
          <div className="card flex items-center justify-between gap-3 p-4 shadow-card">
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-semibold leading-snug">Nessun allenamento per oggi</p>
              <p className="mt-1 text-xs text-ink-soft">Chiedi al coach di generarti un piano o aggiungine uno.</p>
            </div>
            <Link href="/coach" className="ios-btn-active shrink-0 rounded-pill bg-track px-4 py-2 text-xs font-semibold text-white shadow-sm">
              Vai al coach
            </Link>
          </div>
        )}
      </section>

      {weekWorkouts.length === 0 && (
        <section className="card flex flex-col items-center gap-4 p-6 text-center text-ink-soft shadow-card">
          <LoadLine className="h-12 w-full max-w-xs text-track" />
          <p className="max-w-xs text-xs leading-relaxed">
            Il piano si costruisce a gradini, non a scatti. Vai al coach per generarne uno a partire dal tuo profilo medico.
          </p>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3">
        <Link href="/plan" className="ios-card-active card p-4 text-xs font-semibold text-ink shadow-card hover:border-track/40">
          Piano completo →
        </Link>
        <Link href="/profile" className="ios-card-active card p-4 text-xs font-semibold text-ink shadow-card hover:border-track/40">
          Profilo medico →
        </Link>
      </section>
    </div>
  );
}

