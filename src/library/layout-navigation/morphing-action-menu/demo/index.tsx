import { useState } from 'react'
import { MorphingActionMenu } from '..'
import { ControlIcon } from '../internal/ControlIcon'
import './styles.css'

const items = [
  { id: 'document', label: 'Document', icon: <ControlIcon name="document" /> },
  { id: 'spreadsheet', label: 'Spreadsheet', icon: <ControlIcon name="table" /> },
  { id: 'board', label: 'Board', icon: <ControlIcon name="board" /> },
  { id: 'folder', label: 'Folder', icon: <ControlIcon name="folder" /> },
]

export default function MorphingActionMenuShowcase() {
  const [selected, setSelected] = useState('')
  return (
    <section className="control-demo">
      <MorphingActionMenu items={items} onSelect={setSelected} />
      <output aria-live="polite">
        {selected ? `Selected: ${selected}` : 'Create something new.'}
      </output>
    </section>
  )
}
