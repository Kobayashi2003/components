import { useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ControlIcon } from './internal/ControlIcon'
import { useControlState } from './internal/useControlState'
import { useDismiss } from './internal/useDismiss'

export interface Assignee {
  id: string
  name: string
  detail?: string
  avatar?: string
  color?: string
  disabled?: boolean
}
export interface AssigneePickerProps {
  people: Assignee[]
  value?: string[]
  defaultValue?: string[]
  onChange?: (ids: string[]) => void
  defaultOpen?: boolean
  label?: string
  disabled?: boolean
  className?: string
  style?: CSSProperties
}

function Avatar({ person }: { person: Assignee }) {
  return (
    <span className="assignee-picker__avatar" style={{ background: person.color ?? '#657591' }}>
      {person.avatar ? (
        <img src={person.avatar} alt="" />
      ) : !person.color ? (
        person.name
          .split(' ')
          .map((part) => part[0])
          .slice(0, 2)
          .join('')
      ) : null}
    </span>
  )
}

export function AssigneePicker({
  people,
  value,
  defaultValue = [],
  onChange,
  defaultOpen = true,
  label = 'Assignees',
  disabled = false,
  className = '',
  style,
}: AssigneePickerProps) {
  const [selected, update] = useControlState(value, defaultValue, onChange)
  const [expanded, setExpanded] = useState(defaultOpen)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  const open = expanded && !disabled
  useDismiss(root, open, () => setExpanded(false))
  useEffect(() => {
    if (!open) return
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setExpanded(false)
    }
    document.addEventListener('focusin', onFocus)
    return () => document.removeEventListener('focusin', onFocus)
  }, [open])
  const chosen = people.filter((person) => selected.includes(person.id))
  return (
    <div
      ref={root}
      className={`atlas-control assignee-picker ${className}`}
      style={style}
      data-open={open}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          event.stopPropagation()
          setExpanded(false)
          trigger.current?.focus()
        }
      }}
    >
      <button
        ref={trigger}
        className="assignee-picker__trigger"
        type="button"
        disabled={disabled}
        aria-label={`${label}: ${chosen.length} selected`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setExpanded(!open)}
      >
        <span className="assignee-picker__stack">
          {chosen.slice(0, 4).map((person) => (
            <Avatar key={person.id} person={person} />
          ))}
          {!chosen.length && <ControlIcon name="user" />}
          {chosen.length > 4 && (
            <span className="assignee-picker__extra">+{chosen.length - 4}</span>
          )}
        </span>
        <ControlIcon name="chevron" size={16} />
      </button>
      <div className="assignee-picker__reveal" inert={!open}>
        <div className="assignee-picker__clip">
          <div id={id} className="assignee-picker__list" role="group" aria-label={label}>
            {people.map((person) => (
              <label key={person.id} className="assignee-picker__row">
                <Avatar person={person} />
                <span className="assignee-picker__name">
                  {person.name}
                  <small>{person.detail}</small>
                </span>
                <input
                  type="checkbox"
                  checked={selected.includes(person.id)}
                  disabled={disabled || person.disabled}
                  onChange={() =>
                    update(
                      selected.includes(person.id)
                        ? selected.filter((key) => key !== person.id)
                        : [...selected, person.id],
                    )
                  }
                />
                <span className="assignee-picker__check" aria-hidden="true">
                  <ControlIcon name="check" size={14} />
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
