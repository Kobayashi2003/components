import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { CSSProperties, Ref } from 'react'
import { captureAsciiCanvas } from './captureCanvas'
import {
  DEFAULT_CHARSET,
  DEFAULT_PALETTE,
  getSourceSize,
  MAX_COLUMNS,
  MAX_DETAIL_COLUMNS,
  renderAsciiLayer,
} from './renderAscii'
import type { AsciiColorMode, AsciiDensityMode, AsciiMediaSource } from './renderAscii'

export type AsciiPixelateSource =
  string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | null

export interface AsciiPixelateProps {
  ref?: Ref<AsciiPixelateHandle>
  src: AsciiPixelateSource
  alt?: string
  charset?: string
  resolution?: number
  fontSize?: number
  focusMultiplier?: number
  focusRadius?: number
  blur?: number
  contrast?: number
  colorMode?: AsciiColorMode
  densityMode?: AsciiDensityMode
  color?: string
  palette?: readonly string[]
  sourceSaturation?: number
  sourceBrightness?: number
  sourceShadowLift?: number
  sourceFill?: number
  background?: string
  fit?: 'cover' | 'contain'
  fps?: number
  aspectRatio?: number | 'auto'
  disabled?: boolean
  className?: string
  style?: CSSProperties
  onError?: (error: Error) => void
}

export interface AsciiPixelateHandle {
  getText: () => string
  getCanvas: () => HTMLCanvasElement | null
}

export function AsciiPixelate({
  src,
  alt = 'ASCII rendering',
  charset = DEFAULT_CHARSET,
  resolution = 72,
  fontSize = 14,
  focusMultiplier = 1.9,
  focusRadius = 180,
  blur = 0.3,
  contrast = 1.15,
  colorMode = 'mono',
  densityMode = 'auto',
  color = '#d8f77b',
  palette = DEFAULT_PALETTE,
  sourceSaturation = 1.25,
  sourceBrightness = 1.15,
  sourceShadowLift = 0.3,
  sourceFill = 0.25,
  background = '#101416',
  fit = 'cover',
  fps = 24,
  aspectRatio = 'auto',
  disabled = false,
  className = '',
  style,
  onError,
  ref,
}: AsciiPixelateProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLCanvasElement>(null)
  const detailRef = useRef<HTMLCanvasElement>(null)
  const outgoingRef = useRef<HTMLCanvasElement>(null)
  const hasFrameRef = useRef(false)
  const focusActiveRef = useRef(false)
  const detailRefreshRef = useRef<() => void>(() => {})
  const textRef = useRef('')
  const [naturalAspect, setNaturalAspect] = useState<number | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      getText: () => textRef.current,
      getCanvas: () => captureAsciiCanvas(rootRef.current, baseRef.current, detailRef.current),
    }),
    [],
  )

  useEffect(() => {
    const root = rootRef.current
    const base = baseRef.current
    const detail = detailRef.current
    const outgoing = outgoingRef.current
    if (!root || !base || !detail || !outgoing) return

    const baseContext = base.getContext('2d')
    const detailContext = detail.getContext('2d')
    const outgoingContext = outgoing.getContext('2d')
    const sample = document.createElement('canvas')
    const colorMap = document.createElement('canvas')
    if (!baseContext || !detailContext || !outgoingContext) return

    textRef.current = ''

    if (hasFrameRef.current) {
      outgoing.width = base.width
      outgoing.height = base.height
      outgoingContext.drawImage(base, 0, 0)
      outgoing.style.opacity = '1'
    }

    let active = true
    let frame = 0
    let lastFrame = 0
    let currentSource: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | null = null
    let visible = true
    let reportedError = false
    const baseColumns = Math.min(MAX_COLUMNS, Math.max(8, Math.round(resolution)))
    const detailColumns = Math.min(
      MAX_DETAIL_COLUMNS,
      Math.max(baseColumns + 1, Math.round(baseColumns * Math.max(1.1, focusMultiplier))),
    )
    const liveFps = Math.max(
      1,
      Math.min(
        60,
        fps,
        baseColumns >= 768
          ? 2
          : baseColumns >= 512
            ? 4
            : baseColumns >= 240
              ? 8
              : baseColumns >= 140
                ? 15
                : 60,
      ),
    )
    function report(error: unknown) {
      if (reportedError) return
      reportedError = true
      onError?.(error instanceof Error ? error : new Error(String(error)))
    }

    function renderLayer(canvas: HTMLCanvasElement, columns: number) {
      if (!currentSource || !active) return null
      const bounds = root!.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return null
      const pixelRatio = Math.min(
        2,
        Math.max(window.devicePixelRatio || 1, (columns / bounds.width) * 1.4),
      )
      return renderAsciiLayer({
        canvas,
        sampleCanvas: sample,
        colorCanvas: colorMap,
        source: currentSource,
        width: bounds.width,
        height: bounds.height,
        pixelRatio,
        columns,
        charset,
        fontSize,
        contrast,
        colorMode,
        densityMode,
        color,
        background: getComputedStyle(root!).backgroundColor,
        palette,
        sourceSaturation,
        sourceBrightness,
        sourceShadowLift,
        sourceFill,
        fit,
      })
    }
    function renderDetail() {
      try {
        renderLayer(detail!, detailColumns)
      } catch (error) {
        report(error)
      }
    }
    detailRefreshRef.current = renderDetail

    function render() {
      if (!currentSource || !active) return
      try {
        const text = renderLayer(base!, baseColumns)
        if (text === null) return
        textRef.current = text
        if (focusActiveRef.current) renderDetail()
        hasFrameRef.current = true
        requestAnimationFrame(() => {
          if (active) outgoing!.style.opacity = '0'
        })
      } catch (error) {
        report(error)
      }
    }

    function tick(time: number) {
      if (!active) return
      const frameInterval =
        1000 /
        (focusActiveRef.current && baseColumns >= 240
          ? Math.min(liveFps, baseColumns >= 768 ? 1 : 5)
          : liveFps)
      if (visible && time - lastFrame >= frameInterval) {
        render()
        lastFrame = time
      }
      frame = requestAnimationFrame(tick)
    }

    function start(source: AsciiMediaSource) {
      if (!active) return
      currentSource = source
      const [sourceWidth, sourceHeight] = getSourceSize(source)
      if (sourceWidth && sourceHeight) setNaturalAspect(sourceWidth / sourceHeight)
      render()
      if (source instanceof HTMLVideoElement || source instanceof HTMLCanvasElement) {
        frame = requestAnimationFrame(tick)
      }
    }

    const observer = new ResizeObserver(() => render())
    observer.observe(root)
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true
    })
    visibility.observe(root)

    let image: HTMLImageElement | null = null
    let pendingImage: HTMLImageElement | null = null
    let pendingVideo: HTMLVideoElement | null = null
    const onImageLoad = () => {
      if (image) start(image)
      else if (pendingImage) start(pendingImage)
    }
    const onVideoReady = () => {
      if (pendingVideo) {
        const [videoWidth, videoHeight] = getSourceSize(pendingVideo)
        if (videoWidth && videoHeight) setNaturalAspect(videoWidth / videoHeight)
        render()
      }
    }

    if (typeof src === 'string') {
      image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = onImageLoad
      image.onerror = () => report(new Error(`Could not load ASCII source: ${src}`))
      image.src = src
    } else if (src instanceof HTMLImageElement) {
      if (src.complete && src.naturalWidth) start(src)
      else {
        pendingImage = src
        src.addEventListener('load', onImageLoad)
      }
    } else if (src instanceof HTMLVideoElement) {
      pendingVideo = src
      start(src)
      src.addEventListener('loadeddata', onVideoReady)
    } else if (src instanceof HTMLCanvasElement) {
      start(src)
    }

    return () => {
      active = false
      detailRefreshRef.current = () => {}
      cancelAnimationFrame(frame)
      observer.disconnect()
      visibility.disconnect()
      if (image) {
        image.onload = null
        image.onerror = null
      }
      pendingImage?.removeEventListener('load', onImageLoad)
      pendingVideo?.removeEventListener('loadeddata', onVideoReady)
    }
  }, [
    src,
    charset,
    resolution,
    fontSize,
    focusMultiplier,
    contrast,
    colorMode,
    densityMode,
    color,
    palette,
    sourceSaturation,
    sourceBrightness,
    sourceShadowLift,
    sourceFill,
    background,
    fit,
    fps,
    onError,
  ])

  useEffect(() => {
    const root = rootRef.current
    const base = baseRef.current
    const detail = detailRef.current
    if (!root || !base || !detail) return

    const reset = () => {
      focusActiveRef.current = false
      detail.style.opacity = '0'
      base.style.filter = `blur(${Math.max(0, blur)}px)`
    }
    const update = (event: PointerEvent) => {
      if (disabled || event.pointerType !== 'mouse') return
      const rect = root.getBoundingClientRect()
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      const wasFocused = focusActiveRef.current
      const strength = inside ? 1 : 0
      focusActiveRef.current = inside
      if (inside && !wasFocused) detailRefreshRef.current()
      root.style.setProperty('--ascii-x', `${event.clientX - rect.left}px`)
      root.style.setProperty('--ascii-y', `${event.clientY - rect.top}px`)
      root.style.setProperty('--ascii-radius', `${Math.max(50, focusRadius)}px`)
      detail.style.opacity = String(strength)
      base.style.filter = `blur(${Math.max(0, blur) * (1 - strength * 0.75)}px)`
    }
    reset()
    window.addEventListener('pointermove', update, { passive: true })
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('pointermove', update)
      window.removeEventListener('blur', reset)
    }
  }, [disabled, focusRadius, blur])

  const displayAspect = aspectRatio === 'auto' ? (naturalAspect ?? 4 / 3) : aspectRatio

  return (
    <div
      ref={rootRef}
      className={`ascii-pixelate${className ? ` ${className}` : ''}`}
      style={
        {
          aspectRatio: displayAspect,
          '--ascii-aspect': displayAspect,
          background,
          ...style,
        } as CSSProperties
      }
      role="img"
      aria-label={alt}
    >
      <canvas
        ref={baseRef}
        className="ascii-pixelate__layer ascii-pixelate__base"
        aria-hidden="true"
      />
      <canvas
        ref={detailRef}
        className="ascii-pixelate__layer ascii-pixelate__detail"
        aria-hidden="true"
      />
      <canvas
        ref={outgoingRef}
        className="ascii-pixelate__layer ascii-pixelate__outgoing"
        aria-hidden="true"
      />
    </div>
  )
}
