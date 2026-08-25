import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { mapWorkoutRow } from '@/lib/server/userContext';
import { ArchiveView } from '@/components/ArchiveView';
import type { Workout } from '@/lib/types';

export default async function ArchivePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: rows } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  const workouts: Workout[] = (rows ?? []).map(mapWorkoutRow);

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex flex-col gap-1">
        <p className="font-stat text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
          Storico & Pianificazione
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">Archivio Sessioni</h1>
        <p className="text-xs text-ink-soft">
          Consulta tutte le sessioni svolte con i relativi dati e l'elenco dei prossimi allenamenti in programma.
        </p>
      </header>

      <ArchiveView workouts={workouts} />
    </div>
  );
}
