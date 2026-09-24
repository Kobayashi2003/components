import { TaskChecklist } from '..'
import './styles.css'

const tasks = [
  { id: 'studio', label: 'Book the studio' },
  { id: 'estimate', label: 'Send the estimate' },
  { id: 'typeface', label: 'Pick a typeface' },
]

export default function TaskChecklistShowcase() {
  return (
    <section className="control-demo">
      <TaskChecklist defaultItems={tasks} />
      <p>Check a task, or add one directly to the list.</p>
    </section>
  )
}
