import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ChatPanel } from '@/components/ChatPanel';

export default async function CoachPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="flex flex-col gap-4 pt-2">
      <header className="flex flex-col gap-0.5">
        <p className="font-stat text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Assistente AI</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">Coach</h1>
      </header>
      <ChatPanel />
    </div>
  );
}

