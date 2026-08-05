/**
 * LoadLine è l'elemento firma di Ripartenza: una linea che sale a gradini
 * regolari invece che a picchi. Rappresenta visivamente il principio
 * centrale dell'app — progressione controllata del carico, non impennate —
 * ed è la stessa forma sia nel motivo decorativo (qui) sia, altrove
 * nell'app, nei grafici reali di volume settimanale.
 */
export function LoadLine({ className, animated = true }: { className?: string; animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 600 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 100 L60 100 L60 84 L140 84 L140 68 L220 68 L220 74 L300 74 L300 52 L380 52 L380 58 L460 58 L460 32 L540 32 L540 38 L600 38"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="600"
        className={animated ? 'animate-drawLine' : undefined}
      />
      <circle cx="600" cy="38" r="5" fill="currentColor" />
    </svg>
  );
}
