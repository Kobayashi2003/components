import { useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { ControlIcon } from './internal/ControlIcon'
import { useDismiss } from './internal/useDismiss'
import { moveControlFocus } from './internal/moveControlFocus'

export interface CreateMenuItem {
  id: string
  label: string
  icon?: ReactNode
  disabled?: boolean
}
export interface CreateMenuProps {
  items: CreateMenuItem[]
  onSelect?: (id: string) => void
  label?: string
  disabled?: boolean
  className?: string
  style?: CSSProperties
}

export function CreateMenu({
  items,
  onSelect,
  label = 'Create',
  disabled = false,
  className = '',
  style,
}: CreateMenuProps) {
  const [expanded, setExpanded] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const id = useId()
  const open = expanded && !disabled
  const close = () => setExpanded(false)
  useDismiss(root, open, close)
  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() =>
      menu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus(),
    )
    return () => cancelAnimationFrame(frame)
  }, [open])
  const restore = () => {
    close()
    requestAnimationFrame(() => trigger.current?.focus())
  }

  return (
    <div
      ref={root}
      className={`atlas-control create-menu ${className}`}
      data-open={open}
      style={{ '--create-height': `${items.length * 44 + 24}px`, ...style } as CSSProperties}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          event.stopPropagation()
          restore()
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close()
      }}
    >
      <button
        ref={trigger}
        className="create-menu__trigger"
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        tabIndex={open ? -1 : 0}
        aria-hidden={open}
        onClick={() => setExpanded(true)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setExpanded(true)
          }
        }}
      >
        <ControlIcon name="plus" />
        {label}
      </button>
      <div
        id={id}
        ref={menu}
        className="create-menu__menu"
        role="menu"
        aria-label={label}
        inert={!open}
        onKeyDown={moveControlFocus}
      >
        {items.map((item, index) => (
          <button
            type="button"
            role="menuitem"
            key={item.id}
            disabled={disabled || item.disabled}
            style={{ '--item-index': index } as CSSProperties}
            onClick={() => {
              onSelect?.(item.id)
              restore()
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
