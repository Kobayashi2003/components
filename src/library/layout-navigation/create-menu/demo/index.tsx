import { useState } from 'react'
import { CreateMenu } from '..'
import { ControlIcon } from '../internal/ControlIcon'
import './styles.css'

const items = [
  { id: 'document', label: 'Document', icon: <ControlIcon name="document" /> },
  { id: 'spreadsheet', label: 'Spreadsheet', icon: <ControlIcon name="table" /> },
  { id: 'board', label: 'Board', icon: <ControlIcon name="board" /> },
  { id: 'folder', label: 'Folder', icon: <ControlIcon name="folder" /> },
]

export default function CreateMenuShowcase() {
  const [selected, setSelected] = useState('')
  return (
    <section className="control-demo">
      <CreateMenu items={items} onSelect={setSelected} />
      <output aria-live="polite">
        {selected ? `Selected: ${selected}` : 'Create something new.'}
      </output>
    </section>
  )
}
