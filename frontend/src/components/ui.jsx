import { useEffect, useRef, useState } from 'react';
import { makeShareImage, shareOrDownload } from '../share.js';

export function Sticker({ as: Tag = 'div', color, tilt = 0, className = '', style, children, ...rest }) {
  return (
    <Tag className={`sticker ${className}`} style={{ '--c': color, '--tilt': `${tilt}deg`, ...style }} {...rest}>
      {children}
    </Tag>
  );
}

export function Chip({ active, onClick, children, title }) {
  return (
    <button type="button" className={`chip${active ? ' on' : ''}`} aria-pressed={!!active} onClick={onClick} title={title}>
      {children}
    </button>
  );
}

export const toneFor = (v) => (v >= 70 ? 'good' : v >= 45 ? 'meh' : 'bad');

/** Animated horizontal meter (0-100). */
export function Meter({ value, label }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setW(Math.max(0, Math.min(100, value ?? 0))));
    return () => cancelAnimationFrame(id);
  }, [value]);
  if (value === null || value === undefined) return null;
  return (
    <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}>
      <div className={`meter-fill ${toneFor(value)}`} style={{ width: `${w}%` }} />
      <span className="meter-text">{label ? `${label} ` : ''}{value}</span>
    </div>
  );
}

export function ScoreBadge({ value, label = 'score' }) {
  if (value === null || value === undefined) return null;
  return (
    <div className={`badge ${toneFor(value)}`} title={`${label} score`}>
      <b>{value}</b>
      <small>{label}</small>
    </div>
  );
}

export function Dots() {
  return (
    <span className="dots" role="status" aria-label="Loading">
      <i />
      <i />
      <i />
    </span>
  );
}

export function Notice({ kind = 'info', children }) {
  return (
    <div className={`notice ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function CopyButton({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
    } catch {
      setDone(false);
      window.prompt('Copy this:', text);
    }
    setTimeout(() => setDone(false), 1400);
  };
  return (
    <button type="button" className="mini" onClick={copy}>
      {done ? 'Copied ✓' : label}
    </button>
  );
}

export function SaveButton({ onSave, text, from }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      type="button"
      className="mini"
      disabled={saved}
      onClick={() => {
        onSave({ text, from });
        setSaved(true);
      }}
    >
      {saved ? 'Saved ✓' : 'Save'}
    </button>
  );
}

/** Builds a share card PNG on click, then opens the share sheet or downloads it. */
export function ShareButton({ build, filename = 'love-guru.png', label = 'Share card' }) {
  const [state, setState] = useState('idle');
  const go = async () => {
    setState('busy');
    try {
      const blob = await makeShareImage(build());
      const how = await shareOrDownload(blob, filename);
      setState(how === 'shared' ? 'done' : 'saved');
    } catch {
      setState('error');
    }
    setTimeout(() => setState('idle'), 2200);
  };
  const text = { idle: label, busy: 'Making it…', done: 'Shared ✓', saved: 'Saved to downloads ✓', error: "Couldn't make it" }[state];
  return (
    <button type="button" className="btn ghost" onClick={go} disabled={state === 'busy'}>
      {text}
    </button>
  );
}

export function CrisisCard({ message }) {
  return (
    <div className="crisis" role="alert">
      <h3>Let's pause the coaching</h3>
      <p>{message}</p>
    </div>
  );
}

/**
 * Wraps a tool result: handles the crisis card, engine notices and heads-ups in one place.
 * `children` is a render function so a crisis response (which has no tool fields) never reaches tool markup.
 */
export function ResultShell({ r, children }) {
  if (r.crisis) return <CrisisCard message={r.message} />;
  return (
    <div className="result pop">
      {r.notice && <Notice kind="info">{r.notice}</Notice>}
      {r.heads_up && <Notice kind="warn">{r.heads_up}</Notice>}
      {children(r)}
    </div>
  );
}

/** Reveals text character by character (instant for reduced-motion users). */
export function TypeText({ text, speed = 18 }) {
  const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [n, setN] = useState(reduced ? text.length : 0);
  useEffect(() => {
    if (reduced) return undefined;
    setN(0);
    const id = setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          clearInterval(id);
          return v;
        }
        return v + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, reduced]);
  return <>{text.slice(0, n)}</>;
}

/** A card that tilts toward the pointer (CSS 3D) with a moving glare. Static for reduced-motion users. */
export function Tilt({ as: Tag = 'div', className = '', max = 9, children, ...rest }) {
  const ref = useRef(null);
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const move = (e) => {
    const el = ref.current;
    if (!el || reduced) return;
    const b = el.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
    el.style.setProperty('--rx', `${(-y * max).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * max).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(0)}%`);
    el.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(0)}%`);
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    ['--rx', '--ry'].forEach((k) => el.style.setProperty(k, '0deg'));
  };
  return (
    <Tag ref={ref} className={`tilt ${className}`} onPointerMove={move} onPointerLeave={leave} {...rest}>
      {children}
    </Tag>
  );
}

/** Circular progress ring with a number in the middle. */
export function Ring({ value = 0, size = 92, label, sub }) {
  const r = (size - 12) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value));
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`${label || 'score'} ${v}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" />
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-mid"><b>{label ?? v}</b>{sub && <small>{sub}</small>}</div>
    </div>
  );
}
