import clsx from 'clsx';

export function MedicalFlag({
  title,
  children,
  tone = 'info',
}: {
  title: string;
  children: React.ReactNode;
  tone?: 'info' | 'warning';
}) {
  return (
    <div
      className={clsx(
        'card flex gap-3 border-l-4 p-4',
        tone === 'warning' ? 'border-l-signal bg-signal-soft/40' : 'border-l-zone bg-zone-soft/40'
      )}
    >
      <div
        className={clsx(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-stat text-xs font-bold',
          tone === 'warning' ? 'bg-signal text-white' : 'bg-zone text-white'
        )}
        aria-hidden="true"
      >
        {tone === 'warning' ? '!' : 'i'}
      </div>
      <div>
        <p className="font-display text-base leading-none">{title}</p>
        <p className="mt-1.5 text-sm text-ink-soft">{children}</p>
      </div>
    </div>
  );
}
