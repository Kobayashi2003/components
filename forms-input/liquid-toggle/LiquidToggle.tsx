import { useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { useControlState } from './internal/useControlState';

export interface LiquidToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  stretch?: number;
  className?: string;
  style?: CSSProperties;
}

export function LiquidToggle({
  checked,
  defaultChecked = false,
  onChange,
  label,
  disabled = false,
  stretch = 0.36,
  className = '',
  style,
}: LiquidToggleProps) {
  const [on, update] = useControlState(checked, defaultChecked, onChange);
  const [position, setPosition] = useState<number | null>(null);
  const gesture = useRef<{
    id: number;
    x: number;
    start: number;
    scale: number;
    moved: boolean;
    position: number;
  } | null>(null);
  const finish = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    gesture.current = null;
    setPosition(null);
    const next = drag.moved ? drag.position >= 0.5 : !on;
    if (!cancelled && !disabled && next !== on) update(next);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return (
    <div className={`atlas-control liquid-toggle ${className}`} style={style}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        data-on={on}
        data-dragging={position !== null && !disabled}
        style={
          {
            '--toggle-position': disabled ? Number(on) : (position ?? Number(on)),
            '--toggle-stretch': 1 + Math.min(1, Math.max(0, stretch)) * 0.35,
          } as CSSProperties
        }
        onClick={event => {
          if (event.detail === 0) update(!on);
        }}
        onPointerDown={event => {
          if (disabled || !event.isPrimary || event.button !== 0 || gesture.current) return;
          event.preventDefault();
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          gesture.current = {
            id: event.pointerId,
            x: event.clientX,
            start: Number(on),
            scale: event.currentTarget.getBoundingClientRect().width / 100,
            moved: false,
            position: Number(on),
          };
          setPosition(Number(on));
        }}
        onPointerMove={event => {
          const drag = gesture.current;
          if (!drag || drag.id !== event.pointerId) return;
          if (disabled) {
            finish(event, true);
            return;
          }
          const delta = (event.clientX - drag.x) / drag.scale;
          if (Math.abs(delta) > 3) drag.moved = true;
          drag.position = Math.min(1, Math.max(0, drag.start + delta / 54));
          setPosition(drag.position);
        }}
        onPointerUp={event => finish(event)}
        onPointerCancel={event => finish(event, true)}
        onLostPointerCapture={event => finish(event, true)}
      >
        <span className="liquid-toggle__thumb" aria-hidden="true">
          <i />
        </span>
      </button>
    </div>
  );
}
