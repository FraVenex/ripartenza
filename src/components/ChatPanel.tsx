'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { WORKOUT_TYPE_LABEL, type WorkoutType } from '@/lib/types';
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
  const bottomRef = useRef<HTMLDivElement>(null);

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

    const initMsg = searchParams.get('initial_message');
    if (initMsg) {
      setInput(initMsg);
    }
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, proposals, loading]);

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

    if (data.workoutsAutoSaved) {
      setWorkoutsSavedNotice(true);
    }
    if (data.profileUpdated) {
      setProfileUpdatedNotice(true);
    }
  }

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col justify-between md:h-[calc(100vh-160px)]">
      <div className="flex-1 space-y-3.5 overflow-y-auto px-1 pb-4">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-line/60 bg-surface/80 p-3 text-xs text-ink-soft shadow-card backdrop-blur-md">
          <span>La chat gestisce la conoscenza per creare e modificare il tuo piano.</span>
          <button
            onClick={handleReset}
            disabled={resetting || loading}
            className="ios-btn-active shrink-0 rounded-pill border border-track/30 bg-track-soft px-3 py-1 font-semibold text-track-dark disabled:opacity-50"
          >
            {resetting ? 'Cancellazione…' : 'Reset 🗑️'}
          </button>
        </div>

        {messages.length === 0 && (
          <div className="card p-5 text-center text-sm leading-relaxed text-ink-soft shadow-card">
            Parla con il coach: raccontagli i tuoi obiettivi per le prossime 8 settimane, i giorni in cui puoi correre o eventuali problemi fisici. Il coach creerà e aggiornerà il tuo piano di allenamento direttamente da questa chat.
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
              <span>Il coach sta elaborando il piano…</span>
            </div>
          </div>
        )}

        {workoutsSavedNotice && (
          <div className="rounded-2xl border border-track/30 bg-track-soft/50 p-3 text-center text-xs font-medium text-track-dark shadow-sm">
            Allenamenti salvati ed aggiornati nel tuo piano in automatico ✓
          </div>
        )}

        {profileUpdatedNotice && (
          <div className="rounded-2xl border border-recovery/30 bg-recovery-soft/50 p-3 text-center text-xs font-medium text-recovery-dark shadow-sm">
            Profilo medico ed infortuni aggiornato dal coach ✓
          </div>
        )}

        {proposals.length > 0 && (
          <div className="flex flex-col gap-2 pt-2">
            <p className="font-stat text-[11px] uppercase tracking-wider text-ink-faint">Allenamenti aggiornati nel piano:</p>
            {proposals.map((p, i) => (
              <div key={i} className="card flex items-center justify-between gap-3 p-3 shadow-card">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-track-dark">{WORKOUT_TYPE_LABEL[p.type] ?? p.type}</p>
                  <p className="font-display text-base font-semibold leading-tight">{p.title}</p>
                  <p className="mt-0.5 font-stat text-xs text-ink-faint">{p.date}</p>
                </div>
                <span className="rounded-pill bg-recovery px-3 py-1 text-xs font-semibold text-white">
                  Salvato ✓
                </span>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-center text-xs font-medium text-track-dark">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-full border border-line/60 bg-white p-1.5 shadow-card">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Messaggio al coach..."
          className="flex-1 resize-none bg-transparent px-3 py-1 text-sm outline-none placeholder:text-ink-faint"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="ios-btn-active flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zone text-white disabled:opacity-40"
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
    .replace(/```workout_json[\s\S]*?```/g, '')
    .replace(/```profile_update_json[\s\S]*?```/g, '')
    .trim();
}

export function ChatPanel() {
  return (
    <Suspense fallback={<p className="p-4 text-sm text-ink-soft">Caricamento chat...</p>}>
      <ChatPanelContent />
    </Suspense>
  );
}

