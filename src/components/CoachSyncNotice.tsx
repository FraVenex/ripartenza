'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CoachEval {
  evaluated: boolean;
  planAdapted: boolean;
  summary: string;
  workoutId: string;
  workoutTitle: string;
}

export function CoachSyncNotice() {
  const [evaluation, setEvaluation] = useState<CoachEval | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('latest_coach_evaluation');
    if (raw) {
      try {
        setEvaluation(JSON.parse(raw));
      } catch {
        sessionStorage.removeItem('latest_coach_evaluation');
      }
    }

    function handleSyncCompleted(e: Event) {
      const custom = e as CustomEvent;
      if (custom.detail?.coachEvaluations && custom.detail.coachEvaluations.length > 0) {
        const ev = custom.detail.coachEvaluations[0];
        setEvaluation(ev);
        sessionStorage.setItem('latest_coach_evaluation', JSON.stringify(ev));
      }
    }

    window.addEventListener('garmin_sync_completed', handleSyncCompleted);
    return () => {
      window.removeEventListener('garmin_sync_completed', handleSyncCompleted);
    };
  }, []);

  if (!evaluation) return null;

  function dismiss() {
    sessionStorage.removeItem('latest_coach_evaluation');
    setEvaluation(null);
  }

  return (
    <section className="card relative flex flex-col gap-3 p-4 shadow-card border-l-4 border-track bg-surface">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-track animate-pulse" />
          <h3 className="font-display text-base font-bold text-ink">
            {evaluation.planAdapted
              ? `Piano adattato dopo la corsa "${evaluation.workoutTitle}"`
              : `Corsa "${evaluation.workoutTitle}" analizzata dal Coach`}
          </h3>
        </div>
        <button
          onClick={dismiss}
          className="text-xs font-bold text-ink-soft hover:text-ink px-1"
          aria-label="Chiudi notifica"
        >
          ✕
        </button>
      </div>

      <p className="text-xs leading-relaxed text-ink-soft line-clamp-3">
        {evaluation.summary}
      </p>

      <div className="flex items-center justify-between pt-1">
        <Link
          href="/coach"
          className="ios-btn-active text-xs font-semibold text-track hover:underline"
        >
          Discuti con il Coach →
        </Link>
        {evaluation.planAdapted && (
          <Link
            href="/"
            className="ios-btn-active rounded-pill bg-track/10 px-3 py-1 text-xs font-semibold text-track"
          >
            Vedi nuovo piano
          </Link>
        )}
      </div>
    </section>
  );
}
