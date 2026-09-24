import { useState } from 'react'
import { LiquidToggle } from '..'
import './styles.css'

export default function LiquidToggleShowcase() {
  const [checked, setChecked] = useState(true)
  return (
    <section className="control-demo">
      <LiquidToggle label="Preview switch" checked={checked} onChange={setChecked} />
      <output aria-live="polite">{checked ? 'On' : 'Off'} · Click or drag the thumb.</output>
    </section>
  )
}
