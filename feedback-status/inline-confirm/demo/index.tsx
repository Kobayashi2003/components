import { useState } from 'react';
import { InlineConfirm } from '..';
import './styles.css';

export default function InlineConfirmShowcase() {
  const [message, setMessage] = useState('Draft available');
  return (
    <section className="control-demo">
      <InlineConfirm
        onConfirm={() => setMessage('Draft deleted')}
        onUndo={() => setMessage('Draft restored')}
      />
      <output aria-live="polite">{message}</output>
    </section>
  );
}
