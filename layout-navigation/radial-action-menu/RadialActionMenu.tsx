import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ControlIcon } from './internal/ControlIcon';
import { useDismiss } from './internal/useDismiss';
import { moveControlFocus } from './internal/moveControlFocus';

export interface RadialAction {
  id: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
}
export interface RadialActionMenuProps {
  items: RadialAction[];
  onSelect?: (id: string) => void;
  radius?: number;
  stagger?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export function RadialActionMenu({
  items,
  onSelect,
  radius = 78,
  stagger = 28,
  disabled = false,
  label = 'Add',
  className = '',
  style,
}: RadialActionMenuProps) {
  const [expanded, setExpanded] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const open = expanded && !disabled;
  const distance = Math.min(110, Math.max(64, radius));
  const close = () => setExpanded(false);
  useDismiss(root, open, close);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() =>
      menu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [open]);
  const restore = () => {
    close();
    trigger.current?.focus();
  };

  return (
    <div
      ref={root}
      className={`atlas-control radial-action-menu ${className}`}
      data-open={open}
      style={style}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onKeyDown={event => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          event.stopPropagation();
          restore();
        }
      }}
    >
      <div
        ref={menu}
        id={id}
        className="radial-action-menu__items"
        role="menu"
        aria-label={label}
        inert={!open}
        onKeyDown={moveControlFocus}
      >
        {items.slice(0, 7).map((item, index, visible) => {
          const angle =
            ((180 + (visible.length === 1 ? 90 : (index / (visible.length - 1)) * 180)) * Math.PI) /
            180;
          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={disabled || item.disabled}
              aria-label={item.label}
              data-label-above={Math.sin(angle) < -0.35}
              style={
                {
                  '--radial-x': `${Math.cos(angle) * distance}px`,
                  '--radial-y': `${Math.sin(angle) * distance}px`,
                  '--radial-delay': `${index * Math.min(80, Math.max(0, stagger))}ms`,
                } as CSSProperties
              }
              onClick={() => {
                onSelect?.(item.id);
                restore();
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      <button
        ref={trigger}
        type="button"
        className="radial-action-menu__trigger"
        aria-label={open ? 'Close menu' : label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        disabled={disabled}
        onClick={() => setExpanded(!open)}
      >
        <ControlIcon name="plus" size={24} />
      </button>
    </div>
  );
}
