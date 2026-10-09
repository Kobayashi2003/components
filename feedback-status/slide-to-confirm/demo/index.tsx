import { useState } from 'react';
import { SlideToConfirm } from '..';
import './styles.css';

export default function SlideToConfirmShowcase() {
  const [count, setCount] = useState(0);
  return (
    <section className="control-demo">
      <SlideToConfirm onConfirm={() => setCount(current => current + 1)} />
      <output aria-live="polite">
        {count
          ? `Confirmed ${count} time${count === 1 ? '' : 's'}`
          : 'Slide all the way to the right.'}
      </output>
    </section>
  );
}
