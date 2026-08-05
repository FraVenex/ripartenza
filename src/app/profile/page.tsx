'use client';

import { useEffect, useState } from 'react';
import { KNOWLEDGE_BASE } from '@/lib/medical/knowledgeBase';
import { MedicalFlag } from '@/components/MedicalFlag';
import type { MedicalCondition } from '@/lib/types';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);
  const [runningHistory, setRunningHistory] = useState('');
  const [layoffWeeks, setLayoffWeeks] = useState<number | ''>('');
  const [clinicianClearance, setClinicianClearance] = useState(false);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        const p = data.profile;
        if (p) {
          setConditions([...(p.conditions ?? []), ...(p.injuries ?? [])]);
          setRunningHistory(p.runningHistory ?? '');
          setLayoffWeeks(p.layoffWeeks ?? '');
          setClinicianClearance(!!p.clinicianClearance);
          setNotes(p.notes ?? '');
        }
        setLoading(false);
      });
  }, []);

  function toggleCondition(kbId: string, label: string) {
    setConditions((prev) => {
      const exists = prev.find((c) => c.knowledgeBaseId === kbId);
      if (exists) return prev.filter((c) => c.knowledgeBaseId !== kbId);
      return [...prev, { knowledgeBaseId: kbId, label, active: true }];
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const activeConditions = conditions.filter((c) => c.active);
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conditions: activeConditions,
        injuries: [],
        runningHistory,
        layoffWeeks: layoffWeeks === '' ? null : layoffWeeks,
        clinicianClearance,
        notes,
      }),
    });
    setSaving(false);
    setSaved(true);
  }

  if (loading) return <p className="p-4 text-xs text-ink-faint">Caricamento profilo…</p>;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <header className="flex flex-col gap-1">
        <p className="font-stat text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Salute & Riabilitazione</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">Profilo Medico</h1>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
          Informazioni utilizzate dal coach AI per adattare ogni allenamento alla tua situazione reale.
        </p>
      </header>

      <MedicalFlag title="Non è una diagnosi" tone="info">
        Ripartenza non sostituisce un medico o fisioterapista. Se hai dolore persistente, valutati prima di correre.
      </MedicalFlag>

      <section className="card flex flex-col gap-3 p-4 shadow-card">
        <p className="font-display text-base font-bold text-ink">Condizioni / infortuni</p>
        <div className="flex flex-wrap gap-1.5">
          {KNOWLEDGE_BASE.filter((e) => e.id !== 'general_return_to_running' && e.id !== 'long_layoff_detraining').map((e) => {
            const active = conditions.some((c) => c.knowledgeBaseId === e.id);
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => toggleCondition(e.id, e.label)}
                className={`ios-btn-active rounded-pill border px-3 py-1 text-xs font-semibold transition-colors ${
                  active ? 'border-track bg-track-soft text-track-dark' : 'border-line bg-bg text-ink-soft hover:text-ink'
                }`}
              >
                {e.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card flex flex-col gap-4 p-4 shadow-card">
        <label className="flex flex-col gap-1 text-xs font-bold text-ink">
          Storia di corsa
          <textarea
            value={runningHistory}
            onChange={(e) => setRunningHistory(e.target.value)}
            rows={3}
            placeholder={'es. "Correvo 3 volte a settimana da 2 anni, poi fermo per 8 mesi per artrosi all\'anca..."'}
            className="w-full rounded-ios border border-line bg-bg px-3 py-2 text-xs font-normal outline-none focus:border-zone"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-bold text-ink">
          Settimane di stop
          <input
            type="number"
            min={0}
            value={layoffWeeks}
            onChange={(e) => setLayoffWeeks(e.target.value ? Number(e.target.value) : '')}
            className="w-28 rounded-ios border border-line bg-bg px-3 py-1.5 text-xs font-normal outline-none tabular focus:border-zone"
          />
        </label>

        <label className="flex items-center gap-2.5 text-xs font-semibold text-ink">
          <input
            type="checkbox"
            checked={clinicianClearance}
            onChange={(e) => setClinicianClearance(e.target.checked)}
            className="h-4 w-4 rounded border-line text-zone focus:ring-zone"
          />
          Via libera medico / fisioterapista a correre
        </label>

        <label className="flex flex-col gap-1 text-xs font-bold text-ink">
          Note aggiuntive
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-ios border border-line bg-bg px-3 py-2 text-xs font-normal outline-none focus:border-zone"
          />
        </label>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="ios-btn-active rounded-pill bg-track px-5 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
        >
          {saving ? 'Salvataggio…' : 'Salva profilo'}
        </button>
        {saved && <span className="text-xs font-semibold text-recovery-dark">Salvato ✓</span>}
      </div>
    </div>
  );
}

