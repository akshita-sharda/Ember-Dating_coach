import { useEffect, useState } from 'react';
import Figurine from './Figurine.jsx';

const SCRIPT = [
  ['sunny', 'delight', 'Nice. That opener is warm and specific.'],
  ['sage', 'think', 'Hmm, ask one open question, then listen.'],
  ['rio', 'encourage', 'You’ve got this. Send it.'],
];

/** Landing hero: the three coaches as a calm trio; one of them reacts every few seconds. */
export default function HeroTrio() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % SCRIPT.length), 3800);
    return () => clearInterval(t);
  }, []);
  const [active, mood, line] = SCRIPT[i];
  const at = (id) => (id === active ? mood : 'idle');
  return (
    <div className="trio">
      {['sage', 'sunny', 'rio'].map((id) => (
        <div key={id} className={`trio-slot ${id}${id === active ? ' speaking' : ''}`}>
          <Figurine id={id} mood={at(id)} talking={id === active} />
          <span className="trio-name">{id}</span>
        </div>
      ))}
      <div className="readout glass" aria-live="off">
        <span className="mono">{active} · {mood}</span>
        <p>{line}</p>
        <div className="bars" aria-hidden="true"><i style={{ '--v': 0.82 }} /><i style={{ '--v': 0.55 }} /><i style={{ '--v': 0.7 }} /></div>
      </div>
    </div>
  );
}
