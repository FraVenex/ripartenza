'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { type WorkoutType } from '@/lib/types';
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
  activityName: string;
  date: string;
  startTimeLocal: string | null;
  type: string;
  matchingWorkout?: {
    id: string;
    title: string;
    type: WorkoutType;
    date: string;
  } | null;
}

function formatActivityDateTime(dateStr: string, timeLocalStr?: string | null) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const nowIso = new Date().toISOString().slice(0, 10);
    const isToday = nowIso === dateStr;

    const y = new Date();
    y.setDate(y.getDate() - 1);
    const isYesterday = y.toISOString().slice(0, 10) === dateStr;

    let datePart = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
    if (isToday) datePart = 'Oggi';
    else if (isYesterday) datePart = 'Ieri';

    let timePart = '';
    if (timeLocalStr && timeLocalStr.length >= 16) {
      timePart = timeLocalStr.substring(11, 16);
    }

    return `${datePart}${timePart ? ` (${timePart})` : ''}`;
  } catch {
    return dateStr;
  }
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
  const [isDismissed, setIsDismissed] = useState(false);

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

    const checkLatestRun = () => {
      fetch('/api/assistant/unreviewed-activity')
        .then((r) => r.json())
        .then((data) => {
          if (data?.unreviewedActivity) {
            setUnreviewedActivity(data.unreviewedActivity);
            setIsDismissed(false);
          } else {
            setUnreviewedActivity(null);
          }
        })
        .catch(() => {});
    };

    checkLatestRun();

    const handleSyncEvent = () => checkLatestRun();
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
  }, [messages, proposals, loading]);

  function handleDiscussInChat() {
    if (!unreviewedActivity) return;
    const sessionName = unreviewedActivity.activityName || unreviewedActivity.matchingWorkout?.title || 'Sessione di Corsa';
    const prep = `Ho completato la sessione "${sessionName}". Ecco le mie sensazioni: `;
    setInput(prep);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(prep.length, prep.length);
    }
  }

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

    if (unreviewedActivity) {
      fetch('/api/assistant/review-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: unreviewedActivity.id,
          workoutId: unreviewedActivity.matchingWorkout?.id || null,
        }),
      }).catch(() => {});
      setIsDismissed(true);
    }

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

  return (
    <div className="relative flex h-[calc(100vh-180px)] flex-col justify-between md:h-[calc(100vh-160px)]">
      <div className="mb-2 shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-line/60 bg-surface/80 p-2.5 text-xs text-ink-soft shadow-card backdrop-blur-md">
          <span className="truncate">Chat e guida per il piano da 6 settimane (2 sessioni/settimana).</span>
          <button
            onClick={handleReset}
            disabled={resetting || loading}
            className="ios-btn-active shrink-0 rounded-pill border border-track/30 bg-track-soft px-3 py-1 font-semibold text-track-dark disabled:opacity-50"
          >
            {resetting ? 'Reset…' : 'Reset 🗑️'}
          </button>
        </div>

        {unreviewedActivity && !isDismissed && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-track/30 bg-gradient-to-r from-track-soft/40 via-white to-zone-soft/30 px-4 py-3 shadow-card backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-track opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-track"></span>
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-track uppercase tracking-wider">
                  Sessione Scaricata ({formatActivityDateTime(unreviewedActivity.date, unreviewedActivity.startTimeLocal)})
                </div>
                <div className="truncate font-headline text-sm font-extrabold text-ink">
                  {unreviewedActivity.activityName || unreviewedActivity.matchingWorkout?.title || 'Sessione di Corsa'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDiscussInChat}
                disabled={loading}
                className="ios-btn-active inline-flex items-center gap-1.5 rounded-pill bg-track px-4 py-1.5 text-xs font-extrabold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-all"
              >
                <span>💬</span> Discuti la sessione con il Coach
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-xs font-bold text-ink-faint hover:bg-black/10 hover:text-ink transition-colors"
                title="Nascondi"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-3.5 overflow-y-auto px-1 pb-4">
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

      <div className="shrink-0 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2 rounded-2xl border border-line/60 bg-surface/90 p-2 shadow-card backdrop-blur-md"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Scrivi un messaggio al Coach..."
            disabled={loading}
            className="max-h-36 min-h-[38px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="ios-btn-active inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-track text-white shadow-sm disabled:opacity-30"
          >
            ↑
          </button>
        </form>
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
    } catch {}
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
