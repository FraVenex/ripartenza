'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { UserSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface GarminStatusInfo {
  connected: boolean;
  totalActivities?: number;
  latestActivityDate?: string | null;
  lastSyncAt?: string | null;
}

function SettingsForm() {
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [garminEmail, setGarminEmail] = useState('');
  const [garminPassword, setGarminPassword] = useState('');
  const [garminStatus, setGarminStatus] = useState<GarminStatusInfo | null>(null);
  const [savingGarmin, setSavingGarmin] = useState(false);
  const [garminMsg, setGarminMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  function loadGarminStatus() {
    fetch('/api/garmin/credentials')
      .then((r) => r.json())
      .then((data) => {
        setGarminStatus(data);
      });
  }

  useEffect(() => {
    fetch('/api/settings/api-key')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data.settings);
      });

    loadGarminStatus();
  }, [searchParams]);

  async function handleSaveAi(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);

    const res = await fetch('/api/settings/api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKey || undefined }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveMsg('Impostazioni Google Gemini salvate ✓');
      setApiKey('');
      fetch('/api/settings/api-key')
        .then((r) => r.json())
        .then((data) => setSettings(data.settings));
    } else {
      const data = await res.json();
      setSaveMsg(data.error ?? 'Errore nel salvataggio.');
    }
  }

  async function handleRemoveKey() {
    await fetch('/api/settings/api-key', { method: 'DELETE' });
    setSaveMsg('Chiave rimossa.');
    setSettings((s) => (s ? { ...s, hasApiKey: false, apiKeyLastFour: null } : s));
  }

  async function handleSaveGarmin(e: React.FormEvent) {
    e.preventDefault();
    setSavingGarmin(true);
    setGarminMsg(null);
    const res = await fetch('/api/garmin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: garminEmail, password: garminPassword }),
    });
    const data = await res.json();
    setSavingGarmin(false);
    if (res.ok) {
      setGarminMsg(data.message);
      setGarminPassword('');
      loadGarminStatus();
    } else {
      setGarminMsg(data.error ?? 'Errore salvataggio credenziali Garmin.');
    }
  }

  async function handleRemoveGarmin() {
    await fetch('/api/garmin/credentials', { method: 'DELETE' });
    setGarminStatus({ connected: false });
    setGarminMsg('Credenziali Garmin rimosse.');
  }

  async function handleSync(auto = true, days?: number) {
    setSyncing(true);
    setGarminMsg(null);
    const res = await fetch('/api/garmin/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auto ? { auto: true } : { days }),
    });
    const data = await res.json();
    setSyncing(false);
    setGarminMsg(res.ok ? data.message : data.error);
    if (res.ok) {
      loadGarminStatus();
    }
  }

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex flex-col gap-0.5">
        <p className="font-stat text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Preferenze</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">Impostazioni</h1>
      </header>

      <section className="card flex flex-col gap-4 p-4 shadow-card">
        <div>
          <p className="font-display text-base font-bold text-ink">Google Gemini AI</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Chiave API personale generata su Google AI Studio.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-ios bg-bg p-3 text-xs">
          <span className="text-ink-soft">Modello attivo del Coach:</span>
          <span className="font-semibold text-ink">Gemini 3.7 Flash</span>
        </div>

        <form onSubmit={handleSaveAi} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
            Chiave API {settings?.hasApiKey ? `(attuale: •••${settings.apiKeyLastFour})` : ''}
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={settings?.hasApiKey ? 'Lascia vuoto per non modificarla' : 'AIzaSy...'}
              className="w-full rounded-ios border border-line bg-bg px-3 py-2 text-xs font-normal outline-none focus:border-zone"
            />
          </label>

          {saveMsg && <p className="text-xs font-semibold text-recovery-dark">{saveMsg}</p>}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="ios-btn-active rounded-pill bg-track px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-60">
              {saving ? 'Salvataggio…' : 'Salva Gemini'}
            </button>
            {settings?.hasApiKey && (
              <button type="button" onClick={handleRemoveKey} className="ios-btn-active rounded-pill border border-line bg-bg px-4 py-2 text-xs font-semibold text-ink-soft">
                Rimuovi
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card flex flex-col gap-4 p-4 shadow-card">
        <div>
          <p className="font-display text-base font-bold text-ink">Garmin Connect</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Sincronizza le tue corse storiche nel database per il Coach.
          </p>
        </div>

        <form onSubmit={handleSaveGarmin} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
            Email Garmin
            <input
              type="email"
              value={garminEmail}
              onChange={(e) => setGarminEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-ios border border-line bg-bg px-3 py-2 text-xs font-normal outline-none focus:border-zone"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
            Password Garmin
            <input
              type="password"
              value={garminPassword}
              onChange={(e) => setGarminPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-ios border border-line bg-bg px-3 py-2 text-xs font-normal outline-none focus:border-zone"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button type="submit" disabled={savingGarmin} className="ios-btn-active rounded-pill bg-zone px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-60">
              {savingGarmin ? 'Verifica in corso…' : garminStatus?.connected ? 'Aggiorna Garmin' : 'Connetti Garmin'}
            </button>
            {garminStatus?.connected && (
              <button type="button" onClick={handleRemoveGarmin} className="ios-btn-active rounded-pill border border-line bg-bg px-4 py-2 text-xs font-semibold text-ink-soft">
                Scollega
              </button>
            )}
          </div>
        </form>

        {garminStatus?.connected && (
          <div className="mt-1 flex flex-col gap-3 border-t border-line/60 pt-3">
            <div className="flex flex-col gap-1 rounded-ios bg-bg p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Stato:</span>
                <span className="font-semibold text-recovery-dark">Sincronizzato ✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Corse in DB:</span>
                <span className="font-semibold">{garminStatus.totalActivities ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-ink-faint">
                <span>Ultimo controllo:</span>
                <span>
                  {garminStatus.lastSyncAt
                    ? new Date(garminStatus.lastSyncAt).toLocaleString('it-IT', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'N/D'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSync(true)}
                disabled={syncing}
                className="ios-btn-active rounded-pill bg-track px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
              >
                {syncing ? 'Sincronizzo…' : 'Sincronizza Ora'}
              </button>

              <button
                onClick={() => handleSync(false, 365)}
                disabled={syncing}
                className="text-[11px] font-semibold text-ink-soft underline hover:text-ink disabled:opacity-60"
              >
                Ripristina intero storico (365 gg)
              </button>
            </div>
          </div>
        )}

        {garminMsg && <p className="text-xs text-ink-soft">{garminMsg}</p>}
      </section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="p-4 text-xs text-ink-soft">Caricamento impostazioni...</p>}>
      <SettingsForm />
    </Suspense>
  );
}

