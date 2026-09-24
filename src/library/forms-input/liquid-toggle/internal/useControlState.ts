import { useState } from 'react'

export function useControlState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
) {
  const [internal, setInternal] = useState(defaultValue)
  const current = value === undefined ? internal : value
  const update = (next: T) => {
    if (value === undefined) setInternal(next)
    onChange?.(next)
  }
  return [current, update] as const
}
