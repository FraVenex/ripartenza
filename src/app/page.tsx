import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { mapWorkoutRow } from '@/lib/server/userContext';
import { WorkoutTypeBadge } from '@/components/Badge';
import { LoadLine } from '@/components/LoadLine';
import type { Workout } from '@/lib/types';

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: activePlanRow } = await supabase
    .from('training_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: rows } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true });

  const allWorkouts: Workout[] = (rows ?? []).map(mapWorkoutRow);

  const currentPlanWorkouts = activePlanRow
    ? allWorkouts.filter((w) => w.planId === activePlanRow.id || (!w.planId && w.status === 'planned'))
    : allWorkouts.filter((w) => w.status === 'planned');

  const completedWorkouts = currentPlanWorkouts.filter((w) => w.status === 'completed');
  const plannedWorkouts = currentPlanWorkouts.filter((w) => w.status === 'planned');
  const nextWorkout = plannedWorkouts[0] ?? null;

  const isTestPhase = Boolean(
    nextWorkout?.type === 'test' &&
    (plannedWorkouts.length === 1 || activePlanRow?.goal?.toLowerCase().includes('test'))
  );

  const totalSessions = 12;
  const completedCount = completedWorkouts.length;
  const progressPercent = Math.min(100, Math.round((completedCount / totalSessions) * 100));

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="font-stat text-[11px] font-bold uppercase tracking-wider text-track">
            {isTestPhase ? 'Valutazione Iniziale' : 'Ciclo 6 Settimane (2 sessioni/settimana)'}
          </span>
          {activePlanRow && (
            <span className="rounded-pill bg-track-soft px-2 py-0.5 font-stat text-[10px] font-semibold text-track-dark">
              Attivo
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
            Piano
          </h1>
          <Link
            href="/coach"
            className="ios-btn-active rounded-pill bg-track px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95"
          >
            Parla col Coach 💬
          </Link>
        </div>
      </header>

      {isTestPhase ? (
        <section className="card p-4 shadow-card flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-display font-bold text-ink">Fase di Valutazione Iniziale</span>
            <span className="font-stat font-semibold text-zone">Test da completare</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surfaceSunken">
            <div className="h-full rounded-full bg-zone w-full animate-pulse opacity-60" />
          </div>
        </section>
      ) : currentPlanWorkouts.length > 0 ? (
        <section className="card p-4 shadow-card flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-display font-bold text-ink">Avanzamento Blocco (12 sessioni totali)</span>
            <span className="font-stat font-semibold text-track">
              {completedCount} / {totalSessions} sessioni ({progressPercent}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surfaceSunken">
            <div
              className="h-full rounded-full bg-track transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </section>
      ) : null}

      {nextWorkout ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-zone animate-pulse" />
              <h2 className="font-display text-lg font-bold text-ink">
                {nextWorkout.type === 'test' ? '🧪 Test di Valutazione da Svolgere' : 'Prossima Sessione da Svolgere'}
              </h2>
            </div>
            <span className="font-stat text-xs font-semibold text-ink-faint">Flessibile</span>
          </div>

          <div className="card overflow-hidden border-2 border-zone/60 p-5 shadow-card bg-white">
            {nextWorkout.type === 'test' && (
              <div className="mb-3 rounded-ios bg-zone-soft/50 border border-zone/30 p-2.5 text-xs text-ink leading-relaxed">
                💡 <strong>Test Cruciale:</strong> Questa sessione serve a valutare la tua attuale tolleranza e risposta cardio-articolare. Sulla base del risultato e del feedback che darai in chat, il Coach costruirà le 12 sessioni del piano di 6 settimane (2 uscite a settimana).
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <WorkoutTypeBadge type={nextWorkout.type} />
                <span className="font-stat text-xs font-bold text-zone uppercase tracking-wider">
                  {nextWorkout.type === 'test' ? 'Test di Valutazione' : `Sessione #${completedCount + 1}`}
                </span>
              </div>
              {nextWorkout.structure?.totalDurationMin || nextWorkout.structure?.totalDistanceKm ? (
                <span className="font-stat text-xs font-semibold text-ink-soft tabular">
                  {nextWorkout.structure.totalDistanceKm ? `${nextWorkout.structure.totalDistanceKm} km` : ''}
                  {nextWorkout.structure.totalDistanceKm && nextWorkout.structure.totalDurationMin ? ' · ' : ''}
                  {nextWorkout.structure.totalDurationMin ? `${nextWorkout.structure.totalDurationMin} min` : ''}
                </span>
              ) : null}
            </div>

            <h3 className="font-display text-2xl font-extrabold text-ink leading-tight">{nextWorkout.title}</h3>
            {nextWorkout.description && (
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{nextWorkout.description}</p>
            )}

            {nextWorkout.structure?.steps && nextWorkout.structure.steps.length > 0 && (
              <div className="mt-4 rounded-ios bg-bg/80 p-3 flex flex-col gap-1.5 text-xs border border-line/50">
                <p className="font-bold text-[10px] uppercase tracking-wider text-ink-faint mb-1">Struttura Sessione</p>
                {nextWorkout.structure.steps.map((item, i) => {
                  const isRep = (item as any).type === 'repeat' || Boolean((item as any).repeatCount && (item as any).steps);
                  if (isRep) {
                    const r = item as any;
                    const inner = (r.steps || []).map((s: any) => `${s.label}${s.durationMin ? ` ${s.durationMin}m` : ''}`).join(' + ');
                    return (
                      <div key={i} className="flex items-center justify-between font-stat text-ink">
                        <span className="font-semibold">{r.repeatCount}× ({inner})</span>
                      </div>
                    );
                  }
                  const s = item as any;
                  return (
                    <div key={i} className="flex items-center justify-between font-stat text-ink">
                      <span>{s.label}</span>
                      <span className="text-ink-soft">
                        {s.durationMin ? `${s.durationMin} min` : ''}
                        {s.distanceKm ? `${s.distanceKm} km` : ''}
                        {s.targetPace ? ` (${s.targetPace})` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line/60">
              <Link
                href={`/workout/${nextWorkout.id}`}
                className="ios-btn-active text-xs font-bold text-zone hover:underline"
              >
                Vedi scheda completa e invia a Garmin →
              </Link>
              <Link
                href={`/coach?initial_message=${encodeURIComponent(`Vorrei discutere la sessione "${nextWorkout.title}" (${nextWorkout.type}).`)}`}
                className="ios-btn-active rounded-pill bg-bg border border-line px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-surfaceSunken"
              >
                Discuti col Coach 💬
              </Link>
            </div>
          </div>
        </section>
      ) : currentPlanWorkouts.length === 0 ? (
        <section className="card flex flex-col items-center gap-4 p-8 text-center text-ink-soft shadow-card">
          <LoadLine className="h-12 w-full max-w-xs text-track" />
          <div>
            <h3 className="font-display text-lg font-bold text-ink">Inizia il tuo Percorso di 6 Settimane</h3>
            <p className="mt-1 max-w-sm text-xs leading-relaxed">
              Il Coach ti proporrà un test iniziale di consolidamento a 2 uscite a settimana. Sulla base del test verrà poi costruito il piano da 12 sessioni.
            </p>
          </div>
          <Link
            href="/coach"
            className="ios-btn-active rounded-pill bg-track px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95"
          >
            Fai il Test e Genera il Piano 🏃
          </Link>
        </section>
      ) : (
        <section className="card p-6 text-center text-ink-soft shadow-card">
          {completedWorkouts.length > 0 && (activePlanRow?.goal?.toLowerCase().includes('test') || completedWorkouts.some((w) => w.type === 'test')) ? (
            <div className="flex flex-col items-center gap-3">
              <span className="text-3xl">🧪</span>
              <h3 className="font-display text-lg font-bold text-ink">Test di Valutazione Completato!</h3>
              <p className="max-w-md text-xs leading-relaxed">
                Hai registrato la tua corsa di test. Apri la chat con il Coach per analizzare i dati fisiologici e costruire il tuo piano da 6 settimane (12 sessioni).
              </p>
              <Link
                href="/coach"
                className="ios-btn-active mt-1 inline-block rounded-pill bg-track px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95"
              >
                Analizza il Test con il Coach 💬
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm font-bold text-ink">Tutte le 12 sessioni del ciclo corrente sono state completate! 🎉</p>
              <p className="mt-1 text-xs">Parla con il Coach per analizzare i risultati del test finale e impostare il prossimo blocco da 6 settimane.</p>
              <Link
                href="/coach"
                className="ios-btn-active mt-3 inline-block rounded-pill bg-track px-4 py-2 text-xs font-bold text-white"
              >
                Valuta i Risultati col Coach
              </Link>
            </>
          )}
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/progress"
          className="ios-card-active card p-4 flex flex-col gap-1 text-ink shadow-card hover:border-track/40"
        >
          <span className="font-stat text-base">📊</span>
          <span className="font-display text-xs font-bold">Progressi e Statistiche</span>
          <span className="text-[11px] text-ink-faint">Consolidamento e carico</span>
        </Link>
        <Link
          href="/profile"
          className="ios-card-active card p-4 flex flex-col gap-1 text-ink shadow-card hover:border-track/40"
        >
          <span className="font-stat text-base">🩺</span>
          <span className="font-display text-xs font-bold">Profilo Medico</span>
          <span className="text-[11px] text-ink-faint">Infortuni e condizioni</span>
        </Link>
      </section>
    </div>
  );
}
