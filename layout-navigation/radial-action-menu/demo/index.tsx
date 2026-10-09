import { useState } from 'react';
import { RadialActionMenu } from '..';
import { ControlIcon } from '../internal/ControlIcon';
import './styles.css';

const items = [
  { id: 'frame', label: 'Frame', icon: <ControlIcon name="frame" /> },
  { id: 'text', label: 'Text', icon: <ControlIcon name="text" /> },
  { id: 'shape', label: 'Shape', icon: <ControlIcon name="shape" /> },
  { id: 'pen', label: 'Pen', icon: <ControlIcon name="pen" /> },
  { id: 'note', label: 'Note', icon: <ControlIcon name="star" /> },
];

export default function RadialActionMenuShowcase() {
  const [selected, setSelected] = useState('');
  return (
    <section className="control-demo">
      <RadialActionMenu items={items} onSelect={setSelected} />
      <output aria-live="polite">
        {selected ? `Selected tool: ${selected}` : 'Open the tool fan.'}
      </output>
    </section>
  );
}
