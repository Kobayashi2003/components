import type { CSSProperties } from 'react'
import type { ControlNavigationItem } from './internal/ControlNavigationItem'
import { useControlState } from './internal/useControlState'
import { moveControlFocus } from './internal/moveControlFocus'

export type IconBarItem = ControlNavigationItem
export interface IconNavigationBarProps {
  items: IconBarItem[]
  value?: string
  defaultValue?: string
  onChange?: (id: string) => void
  label?: string
  orientation?: 'horizontal' | 'vertical'
  disabled?: boolean
  className?: string
  style?: CSSProperties
}

export function IconNavigationBar({
  items,
  value,
  defaultValue,
  onChange,
  label = 'Main',
  orientation = 'horizontal',
  disabled = false,
  className = '',
  style,
}: IconNavigationBarProps) {
  const [selected, update] = useControlState(value, defaultValue ?? items[0]?.id ?? '', onChange)
  const index = items.findIndex((item) => item.id === selected)
  return (
    <nav
      aria-label={label}
      className={`atlas-control icon-navigation-bar ${className}`}
      data-axis={orientation}
      style={{ '--icon-index': Math.max(0, index), ...style } as CSSProperties}
      onKeyDown={moveControlFocus}
    >
      <div className="icon-navigation-bar__track">
        <span
          className="icon-navigation-bar__active"
          aria-hidden="true"
          style={{ opacity: index < 0 ? 0 : 1 }}
        />
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            title={item.label}
            aria-current={selected === item.id ? 'page' : undefined}
            disabled={disabled || item.disabled}
            onClick={() => {
              if (item.id !== selected) update(item.id)
            }}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </nav>
  )
}
