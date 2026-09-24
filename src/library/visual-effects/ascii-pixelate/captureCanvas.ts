/** Copy the visible character layers without exposing the live canvases to callers. */
export function captureAsciiCanvas(
  root: HTMLDivElement | null,
  base: HTMLCanvasElement | null,
  detail: HTMLCanvasElement | null,
): HTMLCanvasElement | null {
  if (!root || !base?.width || !detail) return null

  const result = document.createElement('canvas')
  result.width = base.width
  result.height = base.height
  const context = result.getContext('2d')
  if (!context) return null

  context.fillStyle = getComputedStyle(root).backgroundColor
  context.fillRect(0, 0, result.width, result.height)
  context.filter = getComputedStyle(base).filter
  context.drawImage(base, 0, 0)
  context.filter = 'none'

  const opacity = Number(getComputedStyle(detail).opacity)
  if (opacity <= 0 || !detail.width || !detail.height) return result

  const overlay = document.createElement('canvas')
  overlay.width = result.width
  overlay.height = result.height
  const overlayContext = overlay.getContext('2d')
  if (!overlayContext) return result
  overlayContext.drawImage(detail, 0, 0, result.width, result.height)

  const bounds = root.getBoundingClientRect()
  const scaleX = result.width / bounds.width
  const scaleY = result.height / bounds.height
  const x = parseFloat(root.style.getPropertyValue('--ascii-x')) * scaleX
  const y = parseFloat(root.style.getPropertyValue('--ascii-y')) * scaleY
  const radius = parseFloat(root.style.getPropertyValue('--ascii-radius')) * scaleX
  if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(radius)) {
    const gradient = overlayContext.createRadialGradient(x, y, radius * 0.18, x, y, radius)
    gradient.addColorStop(0, '#000')
    gradient.addColorStop(1, 'transparent')
    overlayContext.globalCompositeOperation = 'destination-in'
    overlayContext.fillStyle = gradient
    overlayContext.fillRect(0, 0, result.width, result.height)
  }

  context.globalAlpha = opacity
  context.drawImage(overlay, 0, 0)
  return result
}
