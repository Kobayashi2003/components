import { useCallback, useEffect, useRef, useState } from 'react'
import './styles.css'
import { AsciiPixelate } from '..'
import type { AsciiPixelateHandle, AsciiPixelateSource } from '..'
import defaultImageUrl from './default-image.png'

type Mode = 'image' | 'canvas' | 'camera'

const charsetPresets = [
  { label: 'Classic', value: '@#*+=-:. ' },
  { label: 'Blocks', value: '█▓▒░. ' },
  { label: 'Fine', value: 'MWNXK0Okxdolc:;,. ' },
]
const palettePresets = {
  sunset: ['#392b67', '#b44b8b', '#f0a36b', '#fff1b5'],
  ocean: ['#102b43', '#277d9c', '#72cbb4', '#e4f5c5'],
  ember: ['#351519', '#a6382f', '#f39147', '#fff0a4'],
}

export default function AsciiPixelateShowcase() {
  const [mode, setMode] = useState<Mode>('image')
  const [canvasSource, setCanvasSource] = useState<HTMLCanvasElement | null>(null)
  const [videoSource, setVideoSource] = useState<HTMLVideoElement | null>(null)
  const [cameraMessage, setCameraMessage] = useState('Camera starts only when selected.')
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [uploadedName, setUploadedName] = useState<string | null>(null)
  const [resolution, setResolution] = useState(112)
  const [fontSize, setFontSize] = useState(12)
  const [focusMultiplier, setFocusMultiplier] = useState(2.1)
  const [focusRadius, setFocusRadius] = useState(180)
  const [contrast, setContrast] = useState(1.15)
  const [blur, setBlur] = useState(0.3)
  const [charset, setCharset] = useState(charsetPresets[0].value)
  const [colorMode, setColorMode] = useState<'mono' | 'source' | 'palette'>('mono')
  const [densityMode, setDensityMode] = useState<'auto' | 'bright' | 'dark'>('auto')
  const [paletteName, setPaletteName] = useState<keyof typeof palettePresets>('sunset')
  const [sourceSaturation, setSourceSaturation] = useState(1.25)
  const [sourceBrightness, setSourceBrightness] = useState(1.15)
  const [sourceShadowLift, setSourceShadowLift] = useState(0.3)
  const [sourceFill, setSourceFill] = useState(0.25)
  const [aspect, setAspect] = useState('auto')
  const [fit, setFit] = useState<'contain' | 'cover'>('contain')
  const [copyMessage, setCopyMessage] = useState('Copy ASCII text')
  const [imageMessage, setImageMessage] = useState('Download PNG')
  const [color, setColor] = useState('#dbe9ff')
  const [background, setBackground] = useState('#081424')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const uploadedUrlRef = useRef<string | null>(null)
  const cameraRequestRef = useRef(0)
  const asciiRef = useRef<AsciiPixelateHandle>(null)

  async function copyText() {
    const value = asciiRef.current?.getText()
    if (!value) {
      setCopyMessage('No frame to copy yet')
      return
    }
    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage('Copied ASCII text')
    } catch {
      setCopyMessage('Clipboard unavailable')
    }
  }

  function downloadImage() {
    const canvas = asciiRef.current?.getCanvas()
    if (!canvas) {
      setImageMessage('No frame to export yet')
      return
    }
    try {
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = 'ascii-pixelate.png'
      link.click()
      setImageMessage('PNG downloaded')
    } catch {
      setImageMessage('Image export unavailable')
    }
  }

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setVideoSource(null)
  }, [])

  useEffect(
    () => () => {
      cameraRequestRef.current += 1
      streamRef.current?.getTracks().forEach((track) => track.stop())
    },
    [],
  )
  useEffect(
    () => () => {
      if (uploadedUrlRef.current) URL.revokeObjectURL(uploadedUrlRef.current)
    },
    [],
  )

  function uploadImage(file: File | undefined) {
    if (!file) return
    cameraRequestRef.current += 1
    stopCamera()
    if (uploadedUrlRef.current) URL.revokeObjectURL(uploadedUrlRef.current)
    const url = URL.createObjectURL(file)
    uploadedUrlRef.current = url
    setUploadedUrl(url)
    setUploadedName(file.name)
    setMode('image')
  }

  useEffect(() => {
    if (!canvasSource) return
    const context = canvasSource.getContext('2d')
    if (!context) return
    let frame = 0
    const draw = (time: number) => {
      const width = canvasSource.width
      const height = canvasSource.height
      const t = time * 0.001
      const gradient = context.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#0e3042')
      gradient.addColorStop(0.5, '#285b64')
      gradient.addColorStop(1, '#f7aa71')
      context.fillStyle = gradient
      context.fillRect(0, 0, width, height)
      for (let i = 0; i < 12; i += 1) {
        const x = width * (0.5 + Math.sin(t * 0.35 + i * 1.9) * (0.1 + i * 0.023))
        const y = height * (0.5 + Math.cos(t * 0.4 + i * 1.37) * (0.08 + i * 0.025))
        context.beginPath()
        context.arc(x, y, 30 + i * 24, 0, Math.PI * 2)
        context.strokeStyle = `rgba(233, 252, 217, ${0.42 - i * 0.025})`
        context.lineWidth = 4 + (i % 3)
        context.stroke()
      }
      context.fillStyle = '#fff1cb'
      context.font = '800 142px Arial'
      context.textAlign = 'center'
      context.fillText('WAVE', width / 2, height * 0.55)
      context.font = '28px monospace'
      context.fillText('LIVE CANVAS / 02', width / 2, height * 0.64)
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [canvasSource])

  async function selectMode(next: Mode) {
    const request = ++cameraRequestRef.current
    if (next !== 'camera') {
      stopCamera()
      setMode(next)
      return
    }
    setMode('camera')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraMessage('Camera access is unavailable in this browser.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      if (request !== cameraRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      const video = videoRef.current
      if (!video) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = stream
      video.srcObject = stream
      await video.play()
      if (request !== cameraRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      setVideoSource(video)
      setCameraMessage('Live camera feed')
    } catch {
      setCameraMessage('Camera permission was unavailable. Showing the image source.')
    }
  }

  const source: AsciiPixelateSource =
    mode === 'canvas'
      ? canvasSource
      : mode === 'camera'
        ? (videoSource ?? defaultImageUrl)
        : (uploadedUrl ?? defaultImageUrl)

  return (
    <div className="ascii-demo">
      <div className="ascii-demo__display">
        <AsciiPixelate
          ref={asciiRef}
          src={source}
          alt={`${mode} rendered as ASCII characters`}
          charset={charset}
          resolution={resolution}
          fontSize={fontSize}
          focusMultiplier={focusMultiplier}
          focusRadius={focusRadius}
          blur={blur}
          contrast={contrast}
          colorMode={colorMode}
          densityMode={densityMode}
          color={color}
          palette={palettePresets[paletteName]}
          sourceSaturation={sourceSaturation}
          sourceBrightness={sourceBrightness}
          sourceShadowLift={sourceShadowLift}
          sourceFill={sourceFill}
          background={background}
          aspectRatio={aspect === 'auto' ? 'auto' : Number(aspect)}
          fit={fit}
        />
        <p className="ascii-demo__hint">
          Move your pointer over the image to reveal finer characters.
        </p>
      </div>

      <aside className="ascii-demo__controls" aria-label="ASCII rendering controls">
        <div className="ascii-demo__heading">
          <h2>Make it ASCII</h2>
          <p>Choose a source, shape the characters, and export the result.</p>
        </div>
        <section className="ascii-demo__section" aria-labelledby="ascii-source-heading">
          <h3 id="ascii-source-heading">Source</h3>
          <div className="ascii-demo__modes" role="group" aria-label="Source type">
            {(['image', 'canvas', 'camera'] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={mode === item}
                onClick={() => void selectMode(item)}
              >
                {item}
              </button>
            ))}
          </div>
          {mode === 'image' && (
            <label className="ascii-demo__upload">
              <span>Choose image</span>
              <span className="ascii-demo__filename">{uploadedName ?? 'Default image'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => uploadImage(event.target.files?.[0])}
              />
            </label>
          )}
          {mode === 'camera' && (
            <p className="ascii-demo__mode-note" role="status">
              {cameraMessage}
            </p>
          )}
        </section>
        <section className="ascii-demo__section" aria-labelledby="ascii-type-heading">
          <h3 id="ascii-type-heading">Characters &amp; frame</h3>
          <label className="ascii-demo__field">
            Columns <output>{resolution}</output>
            <input
              type="range"
              min="28"
              max="1024"
              value={resolution}
              onChange={(event) => setResolution(Number(event.target.value))}
            />
          </label>
          <label className="ascii-demo__field">
            Character size <output>{fontSize}px</output>
            <input
              type="range"
              min="4"
              max="18"
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
            />
          </label>
          <label className="ascii-demo__field">
            Characters
            <select value={charset} onChange={(event) => setCharset(event.target.value)}>
              {charsetPresets.map((preset) => (
                <option key={preset.label} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
          <label className="ascii-demo__field">
            Character density
            <select
              value={densityMode}
              onChange={(event) => setDensityMode(event.target.value as 'auto' | 'bright' | 'dark')}
            >
              <option value="auto">Auto for colors</option>
              <option value="bright">Dense in bright areas</option>
              <option value="dark">Dense in dark areas</option>
            </select>
          </label>
          <label className="ascii-demo__field">
            Contrast <output>{contrast.toFixed(2)}</output>
            <input
              type="range"
              min="0.6"
              max="1.8"
              step="0.05"
              value={contrast}
              onChange={(event) => setContrast(Number(event.target.value))}
            />
          </label>
          <label className="ascii-demo__field">
            Aspect ratio
            <select value={aspect} onChange={(event) => setAspect(event.target.value)}>
              <option value="auto">Source (auto)</option>
              <option value="1">1:1</option>
              <option value="1.3333333333333333">4:3</option>
              <option value="1.7777777777777777">16:9</option>
            </select>
          </label>
          {aspect !== 'auto' && (
            <label className="ascii-demo__field">
              Source fit
              <select
                value={fit}
                onChange={(event) => setFit(event.target.value as 'contain' | 'cover')}
              >
                <option value="contain">Show full image</option>
                <option value="cover">Fill and crop</option>
              </select>
            </label>
          )}
        </section>
        <section className="ascii-demo__section" aria-labelledby="ascii-focus-heading">
          <h3 id="ascii-focus-heading">Pointer focus</h3>
          <label className="ascii-demo__field">
            Detail density <output>{focusMultiplier.toFixed(1)}×</output>
            <input
              type="range"
              min="1.2"
              max="3"
              step="0.1"
              value={focusMultiplier}
              onChange={(event) => setFocusMultiplier(Number(event.target.value))}
            />
          </label>
          <label className="ascii-demo__field">
            Focus radius <output>{focusRadius}px</output>
            <input
              type="range"
              min="90"
              max="260"
              value={focusRadius}
              onChange={(event) => setFocusRadius(Number(event.target.value))}
            />
          </label>
          <label className="ascii-demo__field">
            Unfocused blur <output>{blur.toFixed(1)}px</output>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={blur}
              onChange={(event) => setBlur(Number(event.target.value))}
            />
          </label>
        </section>
        <section className="ascii-demo__section" aria-labelledby="ascii-color-heading">
          <h3 id="ascii-color-heading">Color</h3>
          <label className="ascii-demo__field">
            Color treatment
            <select
              value={colorMode}
              onChange={(event) =>
                setColorMode(event.target.value as 'mono' | 'source' | 'palette')
              }
            >
              <option value="mono">Single color</option>
              <option value="source">Enhanced source color</option>
              <option value="palette">Gradient palette</option>
            </select>
          </label>
          {colorMode === 'mono' && (
            <label className="ascii-demo__field ascii-demo__color-field">
              Character color
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
            </label>
          )}
          {colorMode === 'palette' && (
            <label className="ascii-demo__field">
              Palette
              <select
                value={paletteName}
                onChange={(event) =>
                  setPaletteName(event.target.value as keyof typeof palettePresets)
                }
              >
                {Object.keys(palettePresets).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {colorMode === 'source' && (
            <>
              <label className="ascii-demo__field">
                Saturation <output>{sourceSaturation.toFixed(2)}×</output>
                <input
                  type="range"
                  min="0"
                  max="2.5"
                  step="0.05"
                  value={sourceSaturation}
                  onChange={(event) => setSourceSaturation(Number(event.target.value))}
                />
              </label>
              <label className="ascii-demo__field">
                Brightness <output>{sourceBrightness.toFixed(2)}×</output>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.05"
                  value={sourceBrightness}
                  onChange={(event) => setSourceBrightness(Number(event.target.value))}
                />
              </label>
              <label className="ascii-demo__field">
                Shadow detail <output>{sourceShadowLift.toFixed(2)}</output>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={sourceShadowLift}
                  onChange={(event) => setSourceShadowLift(Number(event.target.value))}
                />
              </label>
              <label className="ascii-demo__field">
                Color fill <output>{sourceFill.toFixed(2)}</output>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={sourceFill}
                  onChange={(event) => setSourceFill(Number(event.target.value))}
                />
              </label>
            </>
          )}
          <label className="ascii-demo__field ascii-demo__color-field">
            Background color
            <input
              type="color"
              value={background}
              onChange={(event) => setBackground(event.target.value)}
            />
          </label>
        </section>
        <section
          className="ascii-demo__section ascii-demo__export"
          aria-labelledby="ascii-export-heading"
        >
          <h3 id="ascii-export-heading">Export</h3>
          <div className="ascii-demo__export-actions">
            <button type="button" onClick={() => void copyText()}>
              {copyMessage}
            </button>
            <button type="button" onClick={downloadImage}>
              {imageMessage}
            </button>
          </div>
        </section>
      </aside>
      <canvas
        ref={setCanvasSource}
        className="ascii-demo__source"
        width="800"
        height="600"
        aria-hidden="true"
      />
      <video ref={videoRef} className="ascii-demo__source" muted playsInline aria-hidden="true" />
    </div>
  )
}
