import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import type { LightSource } from '../model';

type LightGizmoProps = {
  light: LightSource;
  index: number;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerEnd: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onNudge: (x: number, y: number) => void;
};

const nudges: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

export function LightGizmo({
  light,
  index,
  onPointerDown,
  onPointerMove,
  onPointerEnd,
  onNudge,
}: LightGizmoProps) {
  const style = {
    left: `${light.position.x * 100}%`,
    top: `${light.position.y * 100}%`,
    '--light-color': light.color,
    '--light-radius': `${Math.round(22 + light.radius * 0.36)}px`,
  } as CSSProperties;

  return (
    <button
      type="button"
      className="geometry-light-gizmo"
      style={style}
      aria-label={`Move light ${index + 1}`}
      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
      onKeyDown={(event: ReactKeyboardEvent<HTMLButtonElement>) => {
        const direction = nudges[event.key];
        if (!direction) return;
        // Keep arrows on the light instead of rotating the object behind it.
        event.preventDefault();
        event.stopPropagation();
        const step = event.shiftKey ? 0.08 : 0.02;
        onNudge(direction[0] * step, direction[1] * step);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <span aria-hidden="true" />
      <em aria-hidden="true">L{index + 1}</em>
    </button>
  );
}
