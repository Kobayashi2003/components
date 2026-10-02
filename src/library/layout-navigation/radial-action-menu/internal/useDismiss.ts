import { useEffect, useEffectEvent } from 'react'
import type { RefObject } from 'react'

export function useDismiss(root: RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  const dismiss = useEffectEvent(close)
  useEffect(() => {
    if (!open) return
    const pointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) dismiss()
    }
    document.addEventListener('pointerdown', pointer)
    return () => document.removeEventListener('pointerdown', pointer)
  }, [root, open])
}
