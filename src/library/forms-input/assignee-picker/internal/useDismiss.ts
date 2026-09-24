import { useEffect } from 'react'
import type { RefObject } from 'react'

export function useDismiss(root: RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return
    const pointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) close()
    }
    document.addEventListener('pointerdown', pointer)
    return () => document.removeEventListener('pointerdown', pointer)
  }, [root, open, close])
}
