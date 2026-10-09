import { useState } from 'react';
import { ExpandingSearch } from '..';
import './styles.css';

export default function ExpandingSearchShowcase() {
  const [query, setQuery] = useState('');
  return (
    <section className="control-demo">
      <ExpandingSearch onSearch={setQuery} />
      <output aria-live="polite">
        {query ? `Search submitted: ${query}` : 'Open the search, type, then press Enter.'}
      </output>
    </section>
  );
}
