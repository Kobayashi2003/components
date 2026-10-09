import { useState } from 'react';
import { NotifyButton } from '..';
import './styles.css';

export default function NotifyButtonShowcase() {
  const [enabled, setEnabled] = useState(false);
  return (
    <section className="control-demo">
      <NotifyButton value={enabled} onChange={setEnabled} />
      <output aria-live="polite">
        {enabled
          ? 'Notifications enabled for this preview.'
          : 'Click to toggle the notification state.'}
      </output>
    </section>
  );
}
