import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadRecentGarminActivities, loadRecentWorkouts } from '@/lib/server/userContext';
import { ProgressDashboard } from '@/components/ProgressDashboard';

export default async function ProgressPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [activities, workouts] = await Promise.all([
    loadRecentGarminActivities(supabase, user.id),
    loadRecentWorkouts(supabase, user.id, 180, 90),
  ]);

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex flex-col gap-1">
        <p className="font-stat text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
          Metriche & Analisi
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">I Tuoi Progressi</h1>
        <p className="text-xs text-ink-soft">
          Monitora volume, passo medio, frequenza cardiaca, dislivello, test di valutazione e proiezioni future.
        </p>
      </header>

      <ProgressDashboard activities={activities} workouts={workouts} />
    </div>
  );
}
