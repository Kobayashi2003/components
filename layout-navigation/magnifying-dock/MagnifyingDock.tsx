import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { ControlNavigationItem } from './internal/ControlNavigationItem';
import { useControlState } from './internal/useControlState';
import { moveControlFocus } from './internal/moveControlFocus';

export type DockItem = ControlNavigationItem;
export interface MagnifyingDockProps {
  items: DockItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  magnification?: number;
  lift?: number;
  reach?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export function MagnifyingDock({
  items,
  value,
  defaultValue,
  onChange,
  magnification = 1.32,
  lift = 8,
  reach = 2,
  disabled = false,
  label = 'Dock',
  className = '',
  style,
}: MagnifyingDockProps) {
  const [selected, update] = useControlState(value, defaultValue ?? items[0]?.id ?? '', onChange);
  const [near, setNear] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const pointer = useRef<number | null>(null);
  const indexAt = (x: number) => {
    const box = root.current?.getBoundingClientRect();
    if (!box || !items.length) return null;
    const scale = box.width / (root.current?.offsetWidth || box.width);
    const width = (box.width / scale - 32) / items.length;
    return Math.max(0, Math.min(items.length - 1, ((x - box.left) / scale - 16) / width - 0.5));
  };
  return (
    <nav
      ref={root}
      aria-label={label}
      className={`atlas-control magnifying-dock ${className}`}
      style={style}
      onKeyDown={moveControlFocus}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setNear(null);
      }}
      onPointerMove={event => {
        if (!disabled && (event.pointerType === 'mouse' || pointer.current === event.pointerId))
          setNear(indexAt(event.clientX));
      }}
      onPointerLeave={() => {
        if (pointer.current === null) setNear(null);
      }}
      onPointerDownCapture={event => {
        if (disabled || !event.isPrimary || event.button !== 0 || event.pointerType === 'mouse')
          return;
        pointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        setNear(indexAt(event.clientX));
      }}
      onPointerUp={event => {
        if (pointer.current !== event.pointerId) return;
        const index = indexAt(event.clientX);
        const item = index === null ? undefined : items[Math.round(index)];
        if (item && !item.disabled && !disabled) update(item.id);
        pointer.current = null;
        setNear(null);
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        pointer.current = null;
        setNear(null);
      }}
      onLostPointerCapture={() => {
        pointer.current = null;
        setNear(null);
      }}
    >
      {items.map((item, index) => {
        const distance = near === null || disabled ? Infinity : Math.abs(index - near);
        const radius = Math.max(0.5, Math.min(4, reach));
        const influence =
          distance > radius ? 0 : (1 + Math.cos((Math.PI * distance) / (radius + 1))) / 2;
        return (
          <button
            type="button"
            key={item.id}
            aria-label={item.label}
            aria-current={selected === item.id ? 'page' : undefined}
            disabled={disabled || item.disabled}
            onFocus={() => setNear(index)}
            onClick={event => {
              if (
                event.detail === 0 ||
                !('pointerType' in event.nativeEvent) ||
                event.nativeEvent.pointerType === 'mouse'
              )
                update(item.id);
            }}
            style={
              {
                '--dock-scale': 1 + (Math.max(1, Math.min(2, magnification)) - 1) * influence,
                '--dock-lift': `${-Math.max(0, Math.min(24, lift)) * influence}px`,
              } as CSSProperties
            }
          >
            <span className="magnifying-dock__glyph">{item.icon}</span>
            <span className="magnifying-dock__dot" />
            <span
              className="magnifying-dock__tip"
              data-visible={near !== null && Math.round(near) === index && !disabled}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
