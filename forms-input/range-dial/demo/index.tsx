import { useState } from 'react';
import { RangeDial } from '..';
import './styles.css';

export default function RangeDialShowcase() {
  const [value, setValue] = useState(62);
  const [wave, setWave] = useState(2.6);
  const [density, setDensity] = useState(60);
  const [sweep, setSweep] = useState(300);
  const [disabled, setDisabled] = useState(false);

  return (
    <section className="range-dial-demo">
      <div className="range-dial-demo__scene">
        <RangeDial
          label="Humidity"
          value={value}
          onChange={setValue}
          wave={wave}
          density={density}
          sweep={sweep}
          disabled={disabled}
        />
      </div>
      <aside className="range-dial-demo__controls" aria-label="Wheel parameters">
        <div className="range-dial-demo__heading">
          <h2>Wheel</h2>
          <span>DRAG</span>
        </div>
        <label>
          Wave <output>{wave.toFixed(1)}</output>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={wave}
            onChange={event => setWave(Number(event.target.value))}
          />
        </label>
        <label>
          Density <output>{density}</output>
          <input
            type="range"
            min="20"
            max="100"
            value={density}
            onChange={event => setDensity(Number(event.target.value))}
          />
        </label>
        <label>
          Sweep <output>{sweep}°</output>
          <input
            type="range"
            min="180"
            max="330"
            value={sweep}
            onChange={event => setSweep(Number(event.target.value))}
          />
        </label>
        <label className="range-dial-demo__disabled">
          <input
            type="checkbox"
            checked={disabled}
            onChange={event => setDisabled(event.target.checked)}
          />
          Disabled
        </label>
        <p>Drag around the ring. Arrow keys adjust by 1%; Home / End jump to the limits.</p>
      </aside>
    </section>
  );
}
