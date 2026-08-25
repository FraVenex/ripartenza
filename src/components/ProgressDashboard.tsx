'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GarminActivityLogItem } from '@/lib/server/userContext';
import type { Workout } from '@/lib/types';

interface ProgressDashboardProps {
  activities: GarminActivityLogItem[];
  workouts: Workout[];
}

export function ProgressDashboard({ activities, workouts }: ProgressDashboardProps) {
  const [timeRange, setTimeRange] = useState<'4w' | '12w' | 'all'>('12w');

  const runningActs = activities.filter((a) => (a.distanceM ?? 0) > 0);

  const totalDistanceKm = runningActs.reduce((acc, a) => acc + ((a.distanceM ?? 0) / 1000), 0);
  const totalDurationMin = runningActs.reduce((acc, a) => acc + Math.round((a.durationS ?? 0) / 60), 0);
  const totalElevationGain = runningActs.reduce((acc, a) => acc + (a.elevationGainM ?? 0), 0);

  const avgSpeedWeighted = totalDurationMin > 0 && totalDistanceKm > 0
    ? totalDurationMin / totalDistanceKm
    : 0;

  const validHrActs = runningActs.filter((a) => (a.avgHrBpm ?? 0) > 60);
  const avgHr = validHrActs.length > 0
    ? Math.round(validHrActs.reduce((acc, a) => acc + (a.avgHrBpm ?? 0), 0) / validHrActs.length)
    : 0;

  const formatPace = (paceMinKm: number) => {
    if (!paceMinKm || !isFinite(paceMinKm)) return 'N/D';
    const min = Math.floor(paceMinKm);
    const sec = Math.round((paceMinKm % 1) * 60);
    return `${min}'${sec.toString().padStart(2, '0')}"/km`;
  };

  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0) return `${mins} min`;
    return `${hours}h ${mins}m`;
  };

  const weeklyDataMap = new Map<string, { km: number; elev: number; runs: number; paces: number[] }>();
  const sortedActs = [...runningActs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const act of sortedActs) {
    const d = new Date(act.date + 'T00:00:00');
    const day = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    const weekKey = monday.toISOString().slice(0, 10);

    const existing = weeklyDataMap.get(weekKey) ?? { km: 0, elev: 0, runs: 0, paces: [] };
    existing.km += (act.distanceM ?? 0) / 1000;
    existing.elev += act.elevationGainM ?? 0;
    existing.runs += 1;
    if (act.avgPaceMinPerKm) existing.paces.push(act.avgPaceMinPerKm);
    weeklyDataMap.set(weekKey, existing);
  }

  const weeklyEntries = Array.from(weeklyDataMap.entries());
  const displayWeeks = timeRange === '4w' ? weeklyEntries.slice(-4) : timeRange === '12w' ? weeklyEntries.slice(-12) : weeklyEntries;
  const maxWeeklyKm = Math.max(...displayWeeks.map(([, data]) => data.km), 15);

  const completedWorkouts = workouts.filter((w) => w.status === 'completed');
  const completedCount = completedWorkouts.length;
  const totalPlannedInCycle = 12;
  const cycleProgressPct = Math.min(100, Math.round((completedCount / totalPlannedInCycle) * 100));

  const currentWeekNumber = Math.min(6, Math.floor(completedCount / 2) + 1);
  const currentWeekSessionNumber = (completedCount % 2) + 1;

  const painFeedbackSessions = completedWorkouts.filter((w) => w.painScore !== null && w.painScore !== undefined);
  const painFreeSessions = painFeedbackSessions.filter((w) => (w.painScore ?? 0) === 0);
  const painFreePercentage = painFeedbackSessions.length > 0
    ? Math.round((painFreeSessions.length / painFeedbackSessions.length) * 100)
    : 100;

  const avgKmPerSession = completedCount > 0 ? totalDistanceKm / completedCount : 5;
  const projectedTotalKm = Math.round(totalDistanceKm + (totalPlannedInCycle - Math.min(completedCount, totalPlannedInCycle)) * (avgKmPerSession || 5));

  const longestRunDurationMin = Math.max(
    ...runningActs.map((a) => Math.round((a.durationS ?? 0) / 60)),
    20
  );
  const projectedContinuousRunMin = Math.min(60, Math.round(longestRunDurationMin * 1.25));

  const testWorkouts = workouts.filter((w) => w.type === 'test');
  const completedTests = testWorkouts.filter((w) => w.status === 'completed');
  const pendingTests = testWorkouts.filter((w) => w.status === 'planned');

  const weatherRecorded = runningActs.filter((a) => a.weather?.temperatureC != null);
  const avgTemp = weatherRecorded.length > 0
    ? Math.round(weatherRecorded.reduce((acc, a) => acc + (a.weather?.temperatureC ?? 0), 0) / weatherRecorded.length)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card p-3.5 shadow-card">
          <p className="font-stat text-[10px] font-bold uppercase tracking-wider text-ink-faint">Distanza Totale</p>
          <p className="font-display text-2xl font-extrabold text-ink mt-1">
            {totalDistanceKm.toFixed(1)} <span className="text-xs font-semibold text-ink-soft">km</span>
          </p>
        </div>

        <div className="card p-3.5 shadow-card">
          <p className="font-stat text-[10px] font-bold uppercase tracking-wider text-ink-faint">Tempo Corsa</p>
          <p className="font-display text-2xl font-extrabold text-ink mt-1">{formatTime(totalDurationMin)}</p>
        </div>

        <div className="card p-3.5 shadow-card">
          <p className="font-stat text-[10px] font-bold uppercase tracking-wider text-ink-faint">Dislivello (+)</p>
          <p className="font-display text-2xl font-extrabold text-ink mt-1">
            +{totalElevationGain} <span className="text-xs font-semibold text-ink-soft">m</span>
          </p>
        </div>

        <div className="card p-3.5 shadow-card">
          <p className="font-stat text-[10px] font-bold uppercase tracking-wider text-ink-faint">Passo Medio</p>
          <p className="font-display text-2xl font-extrabold text-ink mt-1">{formatPace(avgSpeedWeighted)}</p>
        </div>

        <div className="card p-3.5 shadow-card">
          <p className="font-stat text-[10px] font-bold uppercase tracking-wider text-ink-faint">FC Media</p>
          <p className="font-display text-2xl font-extrabold text-ink mt-1">{avgHr > 0 ? `${avgHr} bpm` : 'N/D'}</p>
        </div>

        <div className="card p-3.5 shadow-card">
          <p className="font-stat text-[10px] font-bold uppercase tracking-wider text-ink-faint">Sessioni Svolte</p>
          <p className="font-display text-2xl font-extrabold text-ink mt-1">{runningActs.length}</p>
        </div>
      </div>

      <section className="card p-5 shadow-card flex flex-col gap-4 border-2 border-track/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-stat text-xs font-bold uppercase tracking-wider text-track">Progressione Ciclo 6 Settimane</span>
              <span className="rounded-pill bg-track-soft px-2 py-0.5 font-stat text-[10px] font-bold text-track-dark">
                2 sessioni/settimana
              </span>
            </div>
            <h2 className="font-display text-xl font-extrabold text-ink mt-0.5">
              Settimana {currentWeekNumber} di 6 · Sessione #{completedCount + 1} di 12
            </h2>
          </div>
          <span className="font-display text-2xl font-black text-track">{cycleProgressPct}%</span>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-surfaceSunken">
          <div
            className="h-full rounded-full bg-track transition-all duration-500"
            style={{ width: `${cycleProgressPct}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="rounded-ios bg-bg p-3 border border-line/40">
            <span className="text-[10px] text-ink-faint uppercase font-bold block">Frequenza Target</span>
            <span className="font-extrabold text-ink text-sm">2 corse a settimana</span>
            <span className="text-[11px] text-ink-soft block mt-0.5">12 sessioni totali nel blocco</span>
          </div>

          <div className="rounded-ios bg-bg p-3 border border-line/40">
            <span className="text-[10px] text-ink-faint uppercase font-bold block">Indice Senza Dolore</span>
            <span className="font-extrabold text-recovery-dark text-sm">{painFreePercentage}% sessioni</span>
            <span className="text-[11px] text-ink-soft block mt-0.5">Protezione e riabilitazione</span>
          </div>

          <div className="rounded-ios bg-bg p-3 border border-line/40">
            <span className="text-[10px] text-ink-faint uppercase font-bold block">Prossimo Test di Valutazione</span>
            <span className="font-extrabold text-zone-dark text-sm">
              {pendingTests.length > 0 ? pendingTests[0].title : 'Sessione #12 (Fine Week 6)'}
            </span>
            <span className="text-[11px] text-ink-soft block mt-0.5">Consolidamento e progressione</span>
          </div>
        </div>
      </section>

      <section className="card p-5 shadow-card flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Volume Settimanale & Continuità</h2>
            <p className="text-xs text-ink-soft">Chilometri corsi e numero di sessioni (target: 2/settimana)</p>
          </div>
          <div className="flex items-center rounded-full bg-surfaceSunken p-0.5 text-xs">
            <button
              onClick={() => setTimeRange('4w')}
              className={`rounded-full px-3 py-1 font-bold ${timeRange === '4w' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'}`}
            >
              4 Settimane
            </button>
            <button
              onClick={() => setTimeRange('12w')}
              className={`rounded-full px-3 py-1 font-bold ${timeRange === '12w' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'}`}
            >
              12 Settimane
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`rounded-full px-3 py-1 font-bold ${timeRange === 'all' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'}`}
            >
              Tutto
            </button>
          </div>
        </div>

        {displayWeeks.length === 0 ? (
          <p className="py-8 text-center text-xs text-ink-soft">Nessuna attività registrata nel periodo selezionato.</p>
        ) : (
          <div className="flex items-end gap-2 pt-6 pb-2 overflow-x-auto min-h-[180px]">
            {displayWeeks.map(([wKey, data]) => {
              const barHeightPct = Math.min(100, Math.max(10, (data.km / maxWeeklyKm) * 100));
              const label = new Date(wKey + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
              return (
                <div key={wKey} className="flex-1 min-w-[52px] flex flex-col items-center gap-1.5 group">
                  <div className="text-center font-stat">
                    <span className="text-[11px] font-bold text-ink group-hover:text-track block">
                      {data.km.toFixed(1)}k
                    </span>
                    <span className="text-[9px] font-semibold text-ink-faint block">
                      {data.runs} {data.runs === 1 ? 'corsa' : 'corse'}
                    </span>
                  </div>
                  <div className="w-full max-w-[38px] bg-surfaceSunken rounded-t-lg h-36 flex items-end p-1">
                    <div
                      className={`w-full rounded-md transition-all duration-500 ${
                        data.runs >= 2 ? 'bg-track group-hover:bg-track-dark' : 'bg-zone group-hover:bg-zone-dark'
                      }`}
                      style={{ height: `${barHeightPct}%` }}
                    />
                  </div>
                  <span className="font-stat text-[10px] font-medium text-ink-faint text-center truncate w-full">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="card p-5 shadow-card flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">📈</span>
              <h2 className="font-display text-lg font-bold text-ink">Proiezioni di Consolidamento</h2>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">
              Stime di adattamento e volume raggiungibili al termine delle 6 settimane
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-ios bg-bg p-4 flex flex-col justify-between border border-line/50">
              <span className="font-stat text-xs font-bold text-ink-faint uppercase">Volume Finale Stimato</span>
              <p className="font-display text-2xl font-extrabold text-track my-1">{projectedTotalKm} km</p>
              <span className="text-[11px] text-ink-soft">Al termine delle 12 sessioni</span>
            </div>

            <div className="rounded-ios bg-bg p-4 flex flex-col justify-between border border-line/50">
              <span className="font-stat text-xs font-bold text-ink-faint uppercase">Corsa Continua Target</span>
              <p className="font-display text-2xl font-extrabold text-track my-1">~{projectedContinuousRunMin} min</p>
              <span className="text-[11px] text-ink-soft">Con FC Z2 stabile e senza dolore</span>
            </div>
          </div>

          <div className="rounded-ios bg-track-soft/40 p-3.5 text-xs text-ink leading-relaxed border border-track/20">
            📌 <strong>Obiettivo del Blocco:</strong> Consolidare 2 uscite a settimana aumentando gradualmente la densità di corsa continua. Il test finale alla 12ª sessione verificherà che l'adattamento articolare e cardio-respiratorio sia completo prima di incrementare il carico nel ciclo successivo.
          </div>
        </section>

        <section className="card p-5 shadow-card flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">🧪</span>
              <h2 className="font-display text-lg font-bold text-ink">Test di Valutazione del Ciclo</h2>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">
              Test iniziale di calibrazione e test finale di consolidamento
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {testWorkouts.length > 0 ? (
              testWorkouts.map((tw) => (
                <div key={tw.id} className="rounded-ios bg-bg p-3 border border-line/50 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-display font-bold text-ink">{tw.title}</p>
                    <p className="text-[11px] text-ink-soft">{tw.description || 'Test di valutazione programmato'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-stat font-bold px-2 py-0.5 rounded-pill text-[10px] ${
                      tw.status === 'completed' ? 'bg-track-soft text-track-dark' : 'bg-zone-soft text-zone-dark'
                    }`}>
                      {tw.status === 'completed' ? 'Completato ✓' : 'Da svolgere'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-ios bg-bg p-4 text-center text-xs text-ink-soft border border-line/40">
                Il test iniziale deve essere svolto per calibrare le 12 sessioni del piano di 6 settimane.
              </div>
            )}

            {avgTemp != null && (
              <div className="flex items-center justify-between text-xs text-ink-soft pt-1 px-1">
                <span>🌤️ Temperatura media affrontata:</span>
                <span className="font-bold text-ink">{avgTemp}°C</span>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="flex justify-center pt-2">
        <Link
          href="/coach"
          className="ios-btn-active rounded-pill bg-track px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95"
        >
          Discuti i tuoi Progressi con il Coach AI 💬
        </Link>
      </div>
    </div>
  );
}
