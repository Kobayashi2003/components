import { useState } from 'react'
import { AssigneePicker } from '..'
import './styles.css'

const people = [
  {
    id: 'adam',
    name: 'Adam Marsh',
    detail: 'Design',
    color: 'radial-gradient(circle at 30% 20%, #ff65b8, #d52dd7 58%, #7653ff)',
  },
  {
    id: 'priya',
    name: 'Priya Raman',
    detail: 'Research',
    color: 'radial-gradient(circle at 20% 20%, #27d9ed, #287dfd 55%, #7538ef)',
  },
  {
    id: 'nora',
    name: 'Nora Wilder',
    detail: 'Engineering',
    color: 'radial-gradient(circle at 30% 15%, #b4ff42, #38df7b 55%, #26c5e1)',
  },
  {
    id: 'marco',
    name: 'Marco Bellini',
    detail: 'Product',
    color: 'radial-gradient(circle at 70% 20%, #ed278c, #ff6250 65%)',
  },
]

export default function AssigneePickerShowcase() {
  const [selected, setSelected] = useState(['adam', 'priya'])
  return (
    <section className="control-demo">
      <AssigneePicker people={people} value={selected} onChange={setSelected} />
      <output aria-live="polite">{selected.length} people selected</output>
    </section>
  )
}
