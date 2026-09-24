import { useState } from 'react'
import { IconNavigationBar } from '..'
import { ControlIcon } from '../internal/ControlIcon'
import './styles.css'

const items = [
  { id: 'home', label: 'Home', icon: <ControlIcon name="home" /> },
  { id: 'search', label: 'Search', icon: <ControlIcon name="search" /> },
  { id: 'files', label: 'Files', icon: <ControlIcon name="folder" /> },
  { id: 'saved', label: 'Saved', icon: <ControlIcon name="bookmark" /> },
  { id: 'you', label: 'You', icon: <ControlIcon name="user" /> },
]

export default function IconNavigationBarShowcase() {
  const [selected, setSelected] = useState('home')
  return (
    <section className="control-demo">
      <IconNavigationBar items={items} value={selected} onChange={setSelected} />
      <output aria-live="polite">Current section: {selected}</output>
    </section>
  )
}
