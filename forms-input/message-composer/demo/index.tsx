import { useState } from 'react';
import { MessageComposer } from '..';
import './styles.css';

export default function MessageComposerShowcase() {
  const [message, setMessage] = useState('Focus the field to reveal Send.');
  return (
    <section className="control-demo">
      <MessageComposer
        onSubmit={text => setMessage(`Submitted: ${text}`)}
        onDictate={() => setMessage('Dictate pressed')}
      />
      <output aria-live="polite">{message}</output>
    </section>
  );
}
