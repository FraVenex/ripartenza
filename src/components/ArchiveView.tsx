'use client';

import { useState } from 'react';
import Link from 'next/link';
import { WorkoutTypeBadge } from '@/components/Badge';
import { WORKOUT_TYPE_LABEL, type Workout, type WorkoutType } from '@/lib/types';

interface ArchiveViewProps {
  workouts: Workout[];
}

export function ArchiveView({ workouts }: ArchiveViewProps) {
  const [tab, setTab] = useState<'all' | 'completed' | 'planned'>('completed');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = workouts.filter((w) => {
    if (tab === 'completed' && w.status !== 'completed') return false;
    if (tab === 'planned' && w.status !== 'planned') return false;
    if (typeFilter !== 'all' && w.type !== typeFilter) return false;
    return true;
  });

  const completedList = workouts.filter((w) => w.status === 'completed');
  const plannedList = workouts.filter((w) => w.status === 'planned');

  const formatPace = (paceMinKm: number | null | undefined) => {
    if (!paceMinKm) return 'N/D';
    const min = Math.floor(paceMinKm);
    const sec = Math.round((paceMinKm % 1) * 60);
    return `${min}'${sec.toString().padStart(2, '0')}"/km`;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center rounded-full bg-surfaceSunken p-1 text-xs">
          <button
            onClick={() => setTab('completed')}
            className={`rounded-full px-4 py-1.5 font-bold transition-all ${
              tab === 'completed'
                ? 'bg-white text-ink shadow-sm'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Svolte ({completedList.length})
          </button>
          <button
            onClick={() => setTab('planned')}
            className={`rounded-full px-4 py-1.5 font-bold transition-all ${
              tab === 'planned'
                ? 'bg-white text-ink shadow-sm'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            In Programma ({plannedList.length})
          </button>
          <button
            onClick={() => setTab('all')}
            className={`rounded-full px-4 py-1.5 font-bold transition-all ${
              tab === 'all'
                ? 'bg-white text-ink shadow-sm'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Tutte ({workouts.length})
          </button>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-ios border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink outline-none"
        >
          <option value="all">Tutte le tipologie</option>
          <option value="easy">Facile</option>
          <option value="long">Lungo</option>
          <option value="tempo">Soglia</option>
          <option value="intervals">Ripetute</option>
          <option value="walk_run">Cammina-Corri</option>
          <option value="test">Test di Valutazione</option>
          <option value="strength">Rinforzo</option>
          <option value="mobility">Mobilità</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-xs text-ink-soft shadow-card">
          Nessuna sessione trovata per i filtri selezionati.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((w, idx) => {
            const dateStr = w.date
              ? new Date(w.date + 'T00:00:00').toLocaleDateString('it-IT', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : `Sessione #${idx + 1}`;

            const comp = w.completedActivity;

            return (
              <div
                key={w.id}
                className="ios-card-active card p-4 shadow-card flex flex-col gap-2.5 transition-all hover:border-track/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <WorkoutTypeBadge type={w.type} />
                    <span className="font-stat text-xs font-semibold text-ink-faint">{dateStr}</span>
                  </div>
                  <span
                    className={`font-stat text-xs font-bold ${
                      w.status === 'completed'
                        ? 'text-track'
                        : w.status === 'skipped'
                        ? 'text-ink-faint'
                        : 'text-zone'
                    }`}
                  >
                    {w.status === 'completed' ? 'Completata ✓' : w.status === 'skipped' ? 'Saltata' : 'In programma'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">{w.title}</h3>
                    {w.description && <p className="text-xs text-ink-soft line-clamp-2">{w.description}</p>}
                  </div>
                  <Link
                    href={`/workout/${w.id}`}
                    className="ios-btn-active shrink-0 text-xs font-bold text-track hover:underline"
                  >
                    Scheda →
                  </Link>
                </div>

                {comp && (
                  <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 font-stat text-xs bg-bg/60 p-2.5 rounded-ios border border-line/40">
                    <div>
                      <span className="text-[10px] text-ink-faint uppercase font-bold block">Distanza</span>
                      <span className="font-bold text-ink">{comp.distanceM ? `${(comp.distanceM / 1000).toFixed(2)} km` : 'N/D'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-faint uppercase font-bold block">Durata</span>
                      <span className="font-bold text-ink">{comp.durationS ? `${Math.round(comp.durationS / 60)} min` : 'N/D'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-faint uppercase font-bold block">Passo Medio</span>
                      <span className="font-bold text-ink">{formatPace(comp.avgPaceMinPerKm)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-faint uppercase font-bold block">FC Media</span>
                      <span className="font-bold text-ink">{comp.avgHrBpm ? `${Math.round(comp.avgHrBpm)} bpm` : 'N/D'}</span>
                    </div>
                  </div>
                )}

                {(comp?.elevationGainM != null || comp?.weather || w.rpe != null || w.coachFeedback) && (
                  <div className="flex flex-col gap-1.5 pt-1 text-xs text-ink-soft border-t border-line/40">
                    <div className="flex flex-wrap items-center gap-3">
                      {comp?.elevationGainM != null && (
                        <span>⛰️ Dislivello: <strong>+{comp.elevationGainM}m</strong></span>
                      )}
                      {comp?.weather && (
                        <span>🌤️ Meteo: <strong>{comp.weather.temperatureC}°C</strong> ({comp.weather.conditionDescription})</span>
                      )}
                      {w.rpe != null && (
                        <span>🔥 Sforzo RPE: <strong>{w.rpe}/10</strong></span>
                      )}
                      {w.painScore != null && (
                        <span>🩹 Dolore: <strong>{w.painScore}/10</strong>{w.painLocation ? ` (${w.painLocation})` : ''}</span>
                      )}
                    </div>
                    {w.coachFeedback && (
                      <p className="line-clamp-2 italic text-ink-soft bg-track-soft/30 p-2 rounded-ios">
                        💬 Coach: {w.coachFeedback}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
