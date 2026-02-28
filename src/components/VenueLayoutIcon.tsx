/**
 * Iconos de esquema de acomodación para salones (auditorio, mesa de trabajo, mesa de junta, forma U).
 * Representan la disposición de sillas y el distanciamiento social.
 */
import { cn } from "@/lib/utils";

const layoutTypes = [
  "auditorio",
  "mesa_trabajo",
  "mesa_junta",
  "forma_u",
] as const;

export type LayoutType = (typeof layoutTypes)[number];

interface VenueLayoutIconProps {
  layoutType: LayoutType | string | null | undefined;
  className?: string;
  size?: number;
}

export function VenueLayoutIcon({ layoutType, className, size = 48 }: VenueLayoutIconProps) {
  const s = size;
  const cell = Math.max(4, Math.floor(size / 12));
  const gap = 1;

  if (!layoutType) {
    return (
      <div className={cn("rounded bg-muted/50 flex items-center justify-center", className)} style={{ width: s, height: s }} />
    );
  }

  const t = String(layoutType).toLowerCase().replace(/\s+/g, "_");

  // Auditorio: filas de cuadros (sillas) con línea superior (escenario)
  if (t === "auditorio") {
    const rows = 4;
    const cols = 5;
    return (
      <svg
        viewBox={`0 0 ${cols * (cell + gap) + gap} ${rows * (cell + gap) + gap + 4}`}
        className={cn("text-gold", className)}
        width={s}
        height={s}
        aria-hidden
      >
        <line x1={0} y1={2} x2={cols * (cell + gap) + gap} y2={2} stroke="currentColor" strokeWidth={0.8} />
        {Array.from({ length: rows }).map((_, ri) =>
          Array.from({ length: cols }).map((_, ci) => (
            <rect
              key={`${ri}-${ci}`}
              x={gap + ci * (cell + gap)}
              y={4 + gap + ri * (cell + gap)}
              width={cell}
              height={cell}
              fill="currentColor"
              opacity={0.9}
              rx={0.5}
            />
          ))
        )}
      </svg>
    );
  }

  // Mesa de trabajo: varias mesas pequeñas con 2 sillas cada una
  if (t === "mesa_trabajo") {
    const tables = [
      [1, 1], [4, 1], [7, 1],
      [1, 4], [4, 4], [7, 4],
    ];
    const tw = 3;
    const th = 1.5;
    const chair = 1;
    return (
      <svg
        viewBox="0 0 12 8"
        className={cn("text-gold", className)}
        width={s}
        height={s}
        aria-hidden
      >
        {tables.map(([x, y], i) => (
          <g key={i}>
            <rect x={x} y={y} width={tw} height={th} fill="currentColor" opacity={0.5} rx={0.3} />
            <rect x={x} y={y - chair - 0.2} width={0.8} height={chair} fill="currentColor" opacity={0.9} rx={0.2} />
            <rect x={x + tw - 0.8} y={y - chair - 0.2} width={0.8} height={chair} fill="currentColor" opacity={0.9} rx={0.2} />
            <rect x={x} y={y + th + 0.2} width={0.8} height={chair} fill="currentColor" opacity={0.9} rx={0.2} />
            <rect x={x + tw - 0.8} y={y + th + 0.2} width={0.8} height={chair} fill="currentColor" opacity={0.9} rx={0.2} />
          </g>
        ))}
      </svg>
    );
  }

  // Mesa de junta: una mesa rectangular con sillas alrededor
  if (t === "mesa_junta") {
    return (
      <svg viewBox="0 0 10 8" className={cn("text-gold", className)} width={s} height={s} aria-hidden>
        <rect x={1.5} y={2} width={7} height={4} fill="currentColor" opacity={0.5} rx={0.4} />
        {[2, 3.5, 5, 6.5, 8].map((cx, i) => (
          <rect key={i} x={cx - 0.4} y={0.5} width={0.8} height={1.2} fill="currentColor" opacity={0.9} rx={0.2} />
        ))}
        {[2, 3.5, 5, 6.5, 8].map((cx, i) => (
          <rect key={`b-${i}`} x={cx - 0.4} y={6.3} width={0.8} height={1.2} fill="currentColor" opacity={0.9} rx={0.2} />
        ))}
        <rect x={0.2} y={3.2} width={1.2} height={0.8} fill="currentColor" opacity={0.9} rx={0.2} />
        <rect x={8.6} y={3.2} width={1.2} height={0.8} fill="currentColor" opacity={0.9} rx={0.2} />
      </svg>
    );
  }

  // Forma de U: mesa en U con sillas por fuera
  if (t === "forma_u") {
    return (
      <svg viewBox="0 0 10 10" className={cn("text-gold", className)} width={s} height={s} aria-hidden>
        <path
          d="M 1 2 L 1 8 L 2 8 L 2 3 L 8 3 L 8 8 L 9 8 L 9 2 L 1 2"
          fill="none"
          stroke="currentColor"
          strokeWidth={0.6}
          opacity={0.7}
        />
        <path d="M 2 2 L 8 2 L 8 3 L 2 3 Z" fill="currentColor" opacity={0.5} />
        <path d="M 1 2 L 2 2 L 2 8 L 1 8 Z" fill="currentColor" opacity={0.5} />
        <path d="M 8 2 L 9 2 L 9 8 L 8 8 Z" fill="currentColor" opacity={0.5} />
        {[2, 3, 4, 5, 6].map((cx) => (
          <rect key={cx} x={cx - 0.35} y={0.4} width={0.7} height={1} fill="currentColor" opacity={0.9} rx={0.2} />
        ))}
        {[1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5].map((cy) => (
          <rect key={cy} x={0.3} y={cy} width={0.8} height={0.6} fill="currentColor" opacity={0.9} rx={0.2} />
        ))}
        {[1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5].map((cy) => (
          <rect key={`r-${cy}`} x={8.9} y={cy} width={0.8} height={0.6} fill="currentColor" opacity={0.9} rx={0.2} />
        ))}
      </svg>
    );
  }

  return (
    <div className={cn("rounded bg-muted/50 flex items-center justify-center", className)} style={{ width: s, height: s }}>
      <span className="text-xs text-muted-foreground">?</span>
    </div>
  );
}

export const LAYOUT_TYPE_LABELS: Record<LayoutType, string> = {
  auditorio: "Auditorio",
  mesa_trabajo: "Mesa De Trabajo",
  mesa_junta: "Mesa De Junta",
  forma_u: "Forma De U",
};
