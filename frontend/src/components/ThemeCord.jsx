import { useEffect, useRef, useState } from 'react';

const REST = 54; // cord length at rest (px)
const MAX_PULL = 52;
const TRIGGER = 22;

/**
 * A pull-cord light switch. Drag the bead down and let go (or click / press Enter) to flip
 * between light and dark. Light mode = the lamp is on.
 */
export default function ThemeCord({ light, onToggle }) {
  const [pull, setPull] = useState(0);
  const st = useRef({ y: 0, v: 0, drag: false, startY: 0, raf: 0, moved: false });
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const step = () => {
    const s = st.current;
    if (s.drag) return;
    // damped spring back to rest, with a little swing
    s.v += (-s.y * 0.22) * 1;
    s.v *= 0.82;
    s.y += s.v;
    if (Math.abs(s.y) < 0.15 && Math.abs(s.v) < 0.15) { s.y = 0; s.v = 0; setPull(0); return; }
    setPull(s.y);
    s.raf = requestAnimationFrame(step);
  };
  const release = () => { cancelAnimationFrame(st.current.raf); st.current.raf = requestAnimationFrame(step); };
  useEffect(() => () => cancelAnimationFrame(st.current.raf), []);

  const flip = () => { onToggle(); };
  const tug = () => {
    const s = st.current;
    cancelAnimationFrame(s.raf);
    flip();
    if (reduced) return;
    s.y = MAX_PULL * 0.7; s.v = 0; s.drag = false;
    setPull(s.y);
    release();
  };

  const down = (e) => {
    const s = st.current;
    s.drag = true; s.startY = e.clientY; s.moved = false;
    cancelAnimationFrame(s.raf);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    const s = st.current;
    if (!s.drag) return;
    const dy = e.clientY - s.startY;
    if (Math.abs(dy) > 4) s.moved = true;
    // rubber-band: the further you pull, the stiffer it gets
    s.y = Math.max(0, Math.min(MAX_PULL, dy > 30 ? 30 + (dy - 30) * 0.5 : dy));
    setPull(s.y);
  };
  const up = () => {
    const s = st.current;
    if (!s.drag) return;
    s.drag = false;
    if (!s.moved) { tug(); return; }
    if (s.y >= TRIGGER) flip();
    s.v = 0;
    release();
  };
  const key = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tug(); }
  };

  const len = REST + pull;
  const sway = reduced ? 0 : Math.sin(pull * 0.35) * (pull > 1 ? 1.2 : 0);
  return (
    <div className={`cord${light ? ' on' : ''}`}>
      <span className="cord-glow" aria-hidden="true" />
      <svg width="46" height={REST + MAX_PULL + 40} viewBox={`0 0 46 ${REST + MAX_PULL + 40}`} aria-hidden="true" className="cord-svg">
        <rect x="14" y="0" width="18" height="9" rx="3" className="cord-cap" />
        <rect x="19" y="9" width="8" height="7" rx="2" className="cord-cap2" />
        <line x1="23" y1="16" x2={23 + sway} y2={len} className="cord-line" />
        <line x1="23" y1="16" x2={23 + sway} y2={len} className="cord-dash" />
        <g transform={`translate(${23 + sway} ${len})`}>
          <rect x="-1.4" y="-2" width="2.8" height="8" rx="1" className="cord-cap2" />
          <circle cy="13" r="8.5" className="cord-bead" />
          <circle cx="-2.6" cy="10" r="2.4" className="cord-shine" />
        </g>
      </svg>
      <button
        type="button"
        role="switch"
        aria-checked={light}
        aria-label="Light"
        className="cord-hit"
        style={{ top: len + 2 }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
      />
      <span className="cord-hint mono" aria-hidden="true">{light ? 'light' : 'dark'}</span>
    </div>
  );
}
