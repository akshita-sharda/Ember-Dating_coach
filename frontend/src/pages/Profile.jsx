import { useState } from 'react';
import Figurine from '../gfx/Figurine.jsx';
import { Chip, CopyButton } from '../components/ui.jsx';
import { AGES, GOALS, STRUGGLES, useCatalog } from '../data.js';
import { navigate } from '../router.js';
import { useApp } from '../state.jsx';

const STYLE_OPTS = {
  vibe: ['chill', 'dry', 'soft', 'chaotic'],
  emoji: ['none', 'some', 'lots'],
  length: ['short', 'medium'],
  language: ['english', 'hinglish'],
};

export default function Profile() {
  const app = useApp();
  const { coaches } = useCatalog();
  const [confirm, setConfirm] = useState(false);
  const toggle = (k) => app.update({ struggles: app.struggles.includes(k) ? app.struggles.filter((x) => x !== k) : [...app.struggles, k] });
  const setStyle = (k, v) => app.update({ style: { ...app.style, [k]: v } });

  return (
    <section className="profile">
      <p className="eyebrow">Your profile</p>
      <h1 className="h2">Make it yours.</h1>

      <h2 className="h3">Your coach</h2>
      <div className="grid3 pick">
        {(coaches || []).map((c) => (
          <button key={c.id} type="button" className={`coach-pick${app.coach === c.id ? ' on' : ''}`} style={{ '--c': c.color }} aria-pressed={app.coach === c.id} onClick={() => app.update({ coach: c.id })}>
            <Figurine id={c.id} name={c.name} framing="bust" mood={app.coach === c.id ? 'happy' : 'idle'} />
            <b>{c.name}</b><span className="role">{c.role}</span><small>{c.tagline}</small>
          </button>
        ))}
      </div>

      <h2 className="h3">About you</h2>
      <div className="label">Age range</div>
      <div className="chips">{AGES.map(([k, l]) => <Chip key={k} active={app.age === k} onClick={() => app.update({ age: k })}>{l}</Chip>)}</div>
      <div className="label">Looking for</div>
      <div className="chips">{GOALS.map(([k, l]) => <Chip key={k} active={app.goal === k} onClick={() => app.update({ goal: k })}>{l}</Chip>)}</div>
      <div className="label">Where you get stuck</div>
      <div className="chips">{STRUGGLES.map(([k, l]) => <Chip key={k} active={app.struggles.includes(k)} onClick={() => toggle(k)}>{l}</Chip>)}</div>

      <h2 className="h3">Your texting style</h2>
      <p className="muted">Used by the reply helper and practice tools so suggestions sound like you.</p>
      {Object.entries(STYLE_OPTS).map(([k, opts]) => (
        <div key={k}>
          <div className="label">{k}</div>
          <div className="chips">{opts.map((o) => <Chip key={o} active={app.style[k] === o} onClick={() => setStyle(k, o)}>{o}</Chip>)}</div>
        </div>
      ))}

      <h2 className="h3">Appearance</h2>
      <div className="chips">
        <Chip active={app.theme === 'night'} onClick={() => app.update({ theme: 'night' })}>Lamplight (dark)</Chip>
        <Chip active={app.theme === 'paper'} onClick={() => app.update({ theme: 'paper' })}>Parchment (light)</Chip>
      </div>

      <h2 className="h3">Saved lines</h2>
      {app.saved.length === 0 ? <p className="muted">Nothing saved yet. Use "Save" on any suggestion.</p> : (
        <ul className="saved">
          {app.saved.map((s) => (
            <li key={s.id}><span className="tag">{s.from}</span><p>{s.text}</p><div className="row tight"><CopyButton text={s.text} /><button type="button" className="mini" onClick={() => app.unsave(s.id)}>Remove</button></div></li>
          ))}
        </ul>
      )}

      <h2 className="h3">Your data</h2>
      <p className="muted">Everything lives in this browser. Nothing is stored on a server.</p>
      {confirm ? (
        <div className="row"><button type="button" className="btn danger" onClick={() => { app.reset(); navigate('/'); }}>Yes, erase everything</button><button type="button" className="btn ghost" onClick={() => setConfirm(false)}>Cancel</button></div>
      ) : <button type="button" className="btn ghost" onClick={() => setConfirm(true)}>Erase my data</button>}
    </section>
  );
}
