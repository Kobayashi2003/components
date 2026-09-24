import { useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ControlIcon } from './internal/ControlIcon'
import { useControlState } from './internal/useControlState'

export interface ExpandingSearchProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  style?: CSSProperties
}

export function ExpandingSearch({
  value,
  defaultValue = '',
  onChange,
  onSearch,
  label = 'Search',
  placeholder = 'Search',
  disabled = false,
  className = '',
  style,
}: ExpandingSearchProps) {
  const [text, update] = useControlState(value, defaultValue, onChange)
  const [expanded, setExpanded] = useState(false)
  const field = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const open = !disabled && (expanded || !!text)
  return (
    <form
      role="search"
      aria-label={label}
      className={`atlas-control expanding-search ${className}`}
      data-open={open}
      style={style}
      onSubmit={(event) => {
        event.preventDefault()
        if (!disabled && text.trim()) onSearch?.(text.trim())
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false)
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          setExpanded(true)
          field.current?.focus()
        }}
      >
        <ControlIcon name="search" size={24} />
      </button>
      <input
        ref={field}
        aria-label={label}
        placeholder={placeholder}
        disabled={disabled}
        tabIndex={open ? 0 : -1}
        value={text}
        onFocus={() => setExpanded(true)}
        onChange={(event) => update(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            update('')
            setExpanded(false)
            trigger.current?.focus()
          }
        }}
      />
    </form>
  )
}
