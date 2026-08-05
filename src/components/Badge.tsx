import clsx from 'clsx';
import { WORKOUT_TYPE_COLOR, WORKOUT_TYPE_LABEL, type WorkoutType } from '@/lib/types';

const COLOR_CLASSES: Record<string, string> = {
  track: 'bg-track-soft text-track-dark',
  recovery: 'bg-recovery-soft text-recovery-dark',
  zone: 'bg-zone-soft text-zone-dark',
  signal: 'bg-signal-soft text-signal-dark',
};

export function WorkoutTypeBadge({ type, className }: { type: WorkoutType; className?: string }) {
  const color = WORKOUT_TYPE_COLOR[type];
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-semibold tracking-wide uppercase',
        COLOR_CLASSES[color],
        className
      )}
    >
      {WORKOUT_TYPE_LABEL[type]}
    </span>
  );
}
