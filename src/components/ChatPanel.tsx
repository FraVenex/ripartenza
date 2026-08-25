'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { WORKOUT_TYPE_LABEL, type WorkoutType, type ActivityWeatherSummary } from '@/lib/types';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface ChatMsg {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ProposedWorkout {
  date: string;
  type: WorkoutType;
  title: string;
  description?: string;
  structure?: unknown;
}

interface UnreviewedActivity {
  id: string;
  garminActivityId: string;
  date: string;
  type: string;
  distanceM: number | null;
  durationS: number | null;
  avgHrBpm: number | null;
  maxHrBpm: number | null;
  avgPaceMinPerKm: number | null;
  elevationGainM: number | null;
  elevationLossM: number | null;
  avgCadence: number | null;
  weather?: ActivityWeatherSummary | null;
  matchingWorkout?: {
    id: string;
    title: string;
    type: WorkoutType;
  } | null;
}

function ChatPanelContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<ProposedWorkout[]>([]);
  const [workoutsSavedNotice, setWorkoutsSavedNotice] = useState(false);
  const [profileUpdatedNotice, setProfileUpdatedNotice] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [unreviewedActivity, setUnreviewedActivity] = useState<UnreviewedActivity | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRpe, setFeedbackRpe] = useState<number | ''>(5);
  const [feedbackPain, setFeedbackPain] = useState<number | ''>(0);
  const [feedbackPainLocation, setFeedbackPainLocation] = useState('');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/assistant')
      .then((r) => r.json())
      .then((data) => {
        const msgs: ChatMsg[] = data.messages ?? [];
        setMessages(msgs);

        const extractedProposals: ProposedWorkout[] = [];
        for (const m of msgs) {
          if (m.role === 'assistant') {
            const blocks = extractWorkoutJson(m.content);
            extractedProposals.push(...blocks);
          }
        }
        setProposals(extractedProposals);
      });

    const checkUnreviewed = () => {
      fetch('/api/assistant/unreviewed-activity')
        .then((r) => r.json())
        .then((data) => {
          if (data?.unreviewedActivity) {
            setUnreviewedActivity(data.unreviewedActivity);
          }
        })
        .catch(() => {});
    };

    checkUnreviewed();

    const handleSyncEvent = () => checkUnreviewed();
    window.addEventListener('garmin_sync_completed', handleSyncEvent);

    const initMsg = searchParams.get('initial_message');
    if (initMsg) {
      setInput(initMsg);
    }

    return () => {
      window.removeEventListener('garmin_sync_completed', handleSyncEvent);
    };
  }, [searchParams]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, proposals, loading, showFeedbackModal]);

  async function handleReset() {
    if (!window.confirm("Sei sicuro di voler cancellare l'intero piano di allenamento e lo storico della chat per ricominciare da zero?")) {
      return;
    }
    setResetting(true);
    setError(null);
    try {
      const res = await fetch('/api/assistant', { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Errore durante la cancellazione.');
      }
      setMessages([]);
      setProposals([]);
      setWorkoutsSavedNotice(false);
      setProfileUpdatedNotice(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setResetting(false);
    }
  }

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setError(null);
    setProfileUpdatedNotice(false);
    setWorkoutsSavedNotice(false);
    setMessages((m) => [...m, { role: 'user', content: userMsg }]);
    setLoading(true);

    const res = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Errore nella richiesta al coach.');
      return;
    }

    setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    if (data.proposedWorkouts && data.proposedWorkouts.length > 0) {
      setProposals((prev) => [...prev, ...data.proposedWorkouts]);
    }

    if (data.workoutsAutoSaved || data.actionsExecuted) {
      setWorkoutsSavedNotice(true);
    }
    if (data.profileUpdated) {
      setProfileUpdatedNotice(true);
    }
  }

  async function submitActivityFeedback() {
    if (!unreviewedActivity || reviewing) return;
    setReviewing(true);
    setError(null);

    try {
      const res = await fetch('/api/assistant/review-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: unreviewedActivity.id,
          workoutId: unreviewedActivity.matchingWorkout?.id,
          rpe: feedbackRpe || null,
          painScore: feedbackPain === '' ? 0 : feedbackPain,
          painLocation: feedbackPainLocation || null,
          notes: feedbackNotes || null,
        }),
      });

      const data = await res.json();
      setReviewing(false);

      if (!res.ok) {
        setError(data.error ?? 'Errore invio feedback al coach.');
        return;
      }

      setShowFeedbackModal(false);
      setUnreviewedActivity(null);

      const refreshedChat = await fetch('/api/assistant').then((r) => r.json());
      if (refreshedChat?.messages) {
        setMessages(refreshedChat.messages);
      }

      if (data.planAdapted) {
        setWorkoutsSavedNotice(true);
      }
    } catch (e) {
      setReviewing(false);
      setError((e as Error).message);
    }
  }

  const formatPace = (paceMinKm: number | null) => {
    if (!paceMinKm) return 'N/D';
    const min = Math.floor(paceMinKm);
    const sec = Math.round((paceMinKm % 1) * 60);
    return `${min}'${sec.toString().padStart(2, '0')}"/km`;
  };

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col justify-between md:h-[calc(100vh-160px)]">
      <div className="flex-1 space-y-3.5 overflow-y-auto px-1 pb-4">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-line/60 bg-surface/80 p-3 text-xs text-ink-soft shadow-card backdrop-blur-md">
          <span>La chat gestisce la conoscenza per creare e modificare il tuo piano da 6 settimane.</span>
          <button
            onClick={handleReset}
            disabled={resetting || loading}
            className="ios-btn-active shrink-0 rounded-pill border border-track/30 bg-track-soft px-3 py-1 font-semibold text-track-dark disabled:opacity-50"
          >
            {resetting ? 'Cancellazione…' : 'Reset 🗑️'}
          </button>
        </div>

        {unreviewedActivity && (
          <div className="rounded-2xl border-2 border-track bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-track animate-pulse" />
                <span className="font-stat text-xs font-bold uppercase tracking-wider text-track">Nuova Corsa Scaricata</span>
              </div>
              <span className="font-stat text-xs font-semibold text-ink-faint">
                {new Date(unreviewedActivity.date + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 font-stat text-xs">
              <div className="rounded-ios bg-bg p-2 text-center">
                <p className="text-[10px] text-ink-faint uppercase font-bold">Distanza</p>
                <p className="font-bold text-ink text-sm">
                  {unreviewedActivity.distanceM ? `${(unreviewedActivity.distanceM / 1000).toFixed(2)} km` : 'N/D'}
                </p>
              </div>
              <div className="rounded-ios bg-bg p-2 text-center">
                <p className="text-[10px] text-ink-faint uppercase font-bold">Tempo</p>
                <p className="font-bold text-ink text-sm">
                  {unreviewedActivity.durationS ? `${Math.round(unreviewedActivity.durationS / 60)} min` : 'N/D'}
                </p>
              </div>
              <div className="rounded-ios bg-bg p-2 text-center">
                <p className="text-[10px] text-ink-faint uppercase font-bold">Passo / FC</p>
                <p className="font-bold text-ink text-sm">
                  {formatPace(unreviewedActivity.avgPaceMinPerKm)}
                </p>
              </div>
              <div className="rounded-ios bg-bg p-2 text-center">
                <p className="text-[10px] text-ink-faint uppercase font-bold">Dislivello / Meteo</p>
                <p className="font-bold text-ink text-sm truncate">
                  {unreviewedActivity.elevationGainM != null ? `+${unreviewedActivity.elevationGainM}m` : ''}
                  {unreviewedActivity.weather ? ` · ${unreviewedActivity.weather.temperatureC}°C` : ''}
                </p>
              </div>
            </div>

            {unreviewedActivity.weather && (
              <p className="mt-2 text-[11px] text-ink-soft">
                🌤️ Meteo rilevato: <span className="font-semibold">{unreviewedActivity.weather.temperatureC}°C</span>, {unreviewedActivity.weather.conditionDescription}
                {unreviewedActivity.weather.humidityPercent ? ` (Umidità ${unreviewedActivity.weather.humidityPercent}%)` : ''}
              </p>
            )}

            {!showFeedbackModal ? (
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="ios-btn-active mt-3 w-full rounded-pill bg-track py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95"
              >
                Inserisci Feedback e Discuti con il Coach 💬
              </button>
            ) : (
              <div className="mt-3.5 border-t border-line/60 pt-3 flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-ink block mb-1">
                      Sforzo percepito (RPE: 1 Facile - 10 Massimale)
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFeedbackRpe(val)}
                          className={`h-8 w-8 rounded-full font-stat text-xs font-bold transition-all ${
                            feedbackRpe === val
                              ? 'bg-track text-white scale-105'
                              : 'bg-bg text-ink-soft hover:bg-surfaceSunken'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-ink block mb-1">
                      Livello di dolore / fastidi (0 Nessuno - 10 Forte)
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFeedbackPain(val)}
                          className={`h-8 w-8 rounded-full font-stat text-xs font-bold transition-all ${
                            feedbackPain === val
                              ? val === 0 ? 'bg-recovery text-white' : 'bg-track-dark text-white'
                              : 'bg-bg text-ink-soft hover:bg-surfaceSunken'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {Number(feedbackPain) > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-ink block mb-1">
                      Dove hai avvertito fastidio o dolore?
                    </label>
                    <input
                      type="text"
                      value={feedbackPainLocation}
                      onChange={(e) => setFeedbackPainLocation(e.target.value)}
                      placeholder="es. anca destra, polpaccio, tendine d'Achille..."
                      className="w-full rounded-ios border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-faint"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-ink block mb-1">
                    Come ti sei sentito? Note e sensazioni
                  </label>
                  <textarea
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    rows={2}
                    placeholder="es. Sensazione di buona reattività, gambe sciolte, ritmo facile tranne nel tratto in salita..."
                    className="w-full rounded-ios border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-faint"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    disabled={reviewing}
                    className="rounded-pill px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-surfaceSunken"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={submitActivityFeedback}
                    disabled={reviewing}
                    className="ios-btn-active rounded-pill bg-track px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50"
                  >
                    {reviewing ? 'Invio e analisi in corso…' : 'Invia al Coach per Analisi 🚀'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {messages.length === 0 && (
          <div className="card p-5 text-center text-sm leading-relaxed text-ink-soft shadow-card">
            Benvenuto! Qui puoi impostare i tuoi piani di 6 settimane con test di valutazione, discutere ogni sessione di corsa e fare qualsiasi domanda al Coach.
          </div>
        )}

        {messages.map((m, i) => (
          <div key={m.id ?? i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                m.role === 'user'
                  ? 'rounded-tr-xs bg-zone text-white'
                  : 'rounded-tl-xs border border-line/50 bg-white text-ink'
              }`}
            >
              {m.role === 'user' ? (
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              ) : (
                <MarkdownRenderer content={stripJsonBlocks(m.content)} />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-xs border border-line/50 bg-white px-4 py-2.5 text-xs text-ink-soft shadow-sm">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-zone" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-zone [animation-delay:0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-zone [animation-delay:0.4s]" />
              </div>
              <span>Il coach sta rispondendo…</span>
            </div>
          </div>
        )}

        {workoutsSavedNotice && (
          <div className="rounded-2xl border border-track/30 bg-track-soft/50 p-3 text-center text-xs font-medium text-track-dark shadow-sm">
            Piano e sessioni aggiornati con successo ✓
          </div>
        )}

        {profileUpdatedNotice && (
          <div className="rounded-2xl border border-recovery/30 bg-recovery-soft/50 p-3 text-center text-xs font-medium text-recovery-dark shadow-sm">
            Profilo medico ed infortuni aggiornato dal coach ✓
          </div>
        )}

        {error && <p className="text-center text-xs font-medium text-track-dark">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="mt-2 flex items-end gap-2 rounded-2xl border border-line/60 bg-white p-2 shadow-card focus-within:border-zone/60 transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Scrivi un messaggio o chiedi un consiglio al coach..."
          className="flex-1 max-h-36 min-h-[36px] resize-none bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-ink-faint overflow-y-auto leading-relaxed"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="ios-btn-active mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zone text-white shadow-sm disabled:opacity-40"
          title="Invia messaggio"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function extractWorkoutJson(text: string): ProposedWorkout[] {
  const blocks: ProposedWorkout[] = [];
  const regex = /```workout_json\s*([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch {
    }
  }
  return blocks;
}

function stripJsonBlocks(text: string): string {
  return text
    .replace(/```(?:workout_json|workout|profile_update_json|profile_json|plan_action_json|plan_actions|json)?[\s\S]*?```/g, '')
    .trim();
}

export function ChatPanel() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-ink-soft">Caricamento chat...</p>}>
      <ChatPanelContent />
    </Suspense>
  );
}
