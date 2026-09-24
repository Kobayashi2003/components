import { useRef, useState } from 'react'
import { AsciiGlitch } from '..'
import type { AsciiGlitchHandle } from '..'
import './styles.css'

export default function AsciiGlitchShowcase() {
  const glitchRef = useRef<AsciiGlitchHandle>(null)
  const [text, setText] = useState('SYSTEM ONLINE')
  const [intensity, setIntensity] = useState(0.7)
  const [duration, setDuration] = useState(600)
  const [shift, setShift] = useState(18)
  const [glyphs, setGlyphs] = useState('$#@/\\|=+*%▒░')
  const [scanlines, setScanlines] = useState(true)
  const [flicker, setFlicker] = useState(true)
  const [hover, setHover] = useState(true)
  const [loop, setLoop] = useState(true)
  const toggles = [
    { label: 'Scanlines', checked: scanlines, setChecked: setScanlines },
    { label: 'Opacity flicker', checked: flicker, setChecked: setFlicker },
    { label: 'Trigger on hover', checked: hover, setChecked: setHover },
    { label: 'Auto repeat', checked: loop, setChecked: setLoop },
  ]

  return (
    <div className="ascii-glitch-demo">
      <section className="ascii-glitch-demo__stage" aria-label="ASCII Glitch preview">
        <div className="ascii-glitch-demo__topline">
          <span>TERMINAL / TEXT SIGNAL</span>
          <span className="ascii-glitch-demo__live">SIGNAL ACTIVE</span>
        </div>
        <div className="ascii-glitch-demo__center">
          <span className="ascii-glitch-demo__eyebrow">TRANSMISSION 001</span>
          <AsciiGlitch
            ref={glitchRef}
            text={text || ' '}
            intensity={intensity}
            duration={duration}
            shift={shift}
            glyphs={glyphs}
            scanlines={scanlines}
            flicker={flicker}
            triggerOnHover={hover}
            loopInterval={loop ? 2800 : undefined}
            className="ascii-glitch-demo__message"
          />
          <p>Character data is briefly corrupted, then restored.</p>
          <button type="button" onClick={() => glitchRef.current?.trigger()}>
            TRANSMIT GLITCH <span aria-hidden="true">↗</span>
          </button>
        </div>
        <div className="ascii-glitch-demo__bottomline">
          <span>CHAR SWAP / HORIZONTAL SHIFT / SCANLINE / FLICKER</span>
          <span>ASCII—01</span>
        </div>
      </section>

      <aside className="ascii-glitch-demo__controls" aria-label="ASCII Glitch controls">
        <header>
          <h2>ASCII Glitch</h2>
          <p>Interfere with a text signal.</p>
        </header>

        <section>
          <h3>Content</h3>
          <label className="ascii-glitch-demo__field">
            Text
            <textarea
              value={text}
              maxLength={80}
              rows={2}
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          <label className="ascii-glitch-demo__field">
            Replacement glyphs
            <input
              type="text"
              value={glyphs}
              maxLength={40}
              onChange={(event) => setGlyphs(event.target.value)}
            />
          </label>
        </section>

        <section>
          <h3>Distortion</h3>
          <label className="ascii-glitch-demo__field">
            Intensity <output>{Math.round(intensity * 100)}%</output>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={intensity}
              onChange={(event) => setIntensity(Number(event.target.value))}
            />
          </label>
          <label className="ascii-glitch-demo__field">
            Horizontal shift <output>{shift}px</output>
            <input
              type="range"
              min="0"
              max="48"
              value={shift}
              onChange={(event) => setShift(Number(event.target.value))}
            />
          </label>
          <label className="ascii-glitch-demo__field">
            Burst duration <output>{duration}ms</output>
            <input
              type="range"
              min="200"
              max="1400"
              step="50"
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
            />
          </label>
        </section>

        <section>
          <h3>Signal</h3>
          {toggles.map(({ label, checked, setChecked }) => (
            <label className="ascii-glitch-demo__toggle" key={label}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => setChecked(event.target.checked)}
              />
            </label>
          ))}
        </section>
      </aside>
    </div>
  )
}
