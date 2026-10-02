import { useId, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ControlIcon } from './internal/ControlIcon'
import { useControlState } from './internal/useControlState'

export interface ChecklistItem {
  id: string
  label: string
  checked?: boolean
}
export interface TaskChecklistProps {
  items?: ChecklistItem[]
  defaultItems?: ChecklistItem[]
  onChange?: (items: ChecklistItem[]) => void
  label?: string
  disabled?: boolean
  allowAdd?: boolean
  className?: string
  style?: CSSProperties
}

export function TaskChecklist({
  items,
  defaultItems = [],
  onChange,
  label = 'Checklist',
  disabled = false,
  allowAdd = true,
  className = '',
  style,
}: TaskChecklistProps) {
  const [list, update] = useControlState(items, defaultItems, onChange)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const addRef = useRef<HTMLButtonElement>(null)
  const serial = useRef(0)
  const id = useId()
  const cancelled = useRef(false)
  const commitDraft = () => {
    const text = draft.trim()
    if (!disabled && text)
      update([...list, { id: `${id}-${++serial.current}`, label: text, checked: false }])
    setDraft('')
    return !!text
  }
  const close = (restoreFocus: boolean) => {
    setEditing(false)
    if (restoreFocus) requestAnimationFrame(() => addRef.current?.focus())
  }

  return (
    <div
      className={['atlas-control', 'task-checklist', className].filter(Boolean).join(' ')}
      style={style}
      role="group"
      aria-label={label}
    >
      {list.map((item) => (
        <label key={item.id} className="task-checklist__row">
          <input
            type="checkbox"
            checked={!!item.checked}
            disabled={disabled}
            onChange={() =>
              update(
                list.map((row) => (row.id === item.id ? { ...row, checked: !row.checked } : row)),
              )
            }
          />
          <span className="task-checklist__box" aria-hidden="true">
            <ControlIcon name="check" size={14} />
          </span>
          <span className="task-checklist__text">{item.label}</span>
        </label>
      ))}
      {allowAdd &&
        (editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              // Enter keeps the field open for the next task; an empty Enter finishes.
              if (!commitDraft()) close(true)
            }}
            className="task-checklist__add"
          >
            <span className="task-checklist__empty" aria-hidden="true" />
            <input
              aria-label="New task"
              autoFocus
              placeholder="New task"
              maxLength={160}
              value={draft}
              disabled={disabled}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => {
                if (!cancelled.current) commitDraft()
                cancelled.current = false
                close(false)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault()
                  event.stopPropagation()
                  cancelled.current = true
                  setDraft('')
                  close(true)
                }
              }}
            />
          </form>
        ) : (
          <button
            ref={addRef}
            type="button"
            className="task-checklist__add"
            disabled={disabled}
            onClick={() => {
              cancelled.current = false
              setEditing(true)
            }}
          >
            <span className="task-checklist__empty" aria-hidden="true" />
            Add new task
          </button>
        ))}
    </div>
  )
}
