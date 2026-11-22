import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { CrisisCard, Dots, Meter, Notice, ShareButton, TypeText } from '../components/ui.jsx';

const MOOD = { hyped: '🤩', intrigued: '😏', neutral: '😐', bored: '😴' };

export default function Practice({ style }) {
  const [personas, setPersonas] = useState([]);
  const [persona, setPersona] = useState(null);
  const [msgs, setMsgs] = useState([]); // { id, role: 'me'|'them', text, coach?, fresh? }
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [crisis, setCrisis] = useState(null);
  const [mood, setMood] = useState('neutral');
  const nextId = useRef(1);
  const chatRef = useRef(null);

  useEffect(() => {
    api.personas().then((d) => setPersonas(d.personas)).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, busy]);

  const scores = useMemo(() => msgs.filter((m) => m.role === 'me' && typeof m.coach?.rizz === 'number').map((m) => m.coach.rizz), [msgs]);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const best = useMemo(() => {
    const mine = msgs.filter((m) => m.role === 'me' && typeof m.coach?.rizz === 'number');
    return mine.length ? mine.reduce((a, b) => (b.coach.rizz > a.coach.rizz ? b : a)) : null;
  }, [msgs]);

  const call = async (body) => {
    setBusy(true);
    setError(null);
    try {
      const d = await api.practice({ ...body, style });
      if (d.crisis) {
        setCrisis(d.message);
        return null;
      }
      setNotice(d.notice || null);
      return d;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const start = async (p) => {
    setPersona(p);
    setMsgs([]);
    setCrisis(null);
    setMood('neutral');
    const d = await call({ persona_id: p.id, message: '', history: [] });
    if (d) setMsgs([{ id: nextId.current++, role: 'them', text: d.reply, fresh: true }]);
    else setPersona(null);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy || !persona) return;
    const mine = { id: nextId.current++, role: 'me', text };
    const history = msgs.slice(-24).map((m) => ({ role: m.role, text: m.text }));
    setMsgs((prev) => [...prev.map((m) => ({ ...m, fresh: false })), mine]);
    setInput('');
    const d = await call({ persona_id: persona.id, message: text, history });
    if (!d) return;
    setMood(d.mood);
    setMsgs((prev) => [
      ...prev.map((m) => (m.id === mine.id ? { ...m, coach: d.coach } : m)),
      { id: nextId.current++, role: 'them', text: d.reply, fresh: true },
    ]);
  };

  if (!persona) {
    return (
      <section className="page" aria-labelledby="prac-h">
        <h2 id="prac-h" className="page-title">
          Practice chats <span className="scribble">no stakes, just reps</span>
        </h2>
        <p className="muted">Pick someone to chat with. After every message you get a quick coaching note and a score.</p>
        {error && <Notice kind="error">{error}</Notice>}
        <div className="personas">
          {personas.map((p, i) => (
            <button key={p.id} type="button" className="persona" style={{ '--c': ['#ffb067', '#7fb8a4', '#f19cc1', '#6c8cff'][i % 4] }} onClick={() => start(p)} disabled={busy}>
              <span className="persona-emoji" aria-hidden="true">{p.emoji}</span>
              <b>{p.name}</b>
              <span>{p.tagline}</span>
              <small>{['easy', 'medium', 'hard'][p.difficulty - 1]}</small>
            </button>
          ))}
        </div>
        {busy && <Dots />}
      </section>
    );
  }

  return (
    <section className="page" aria-labelledby="prac-h">
      <div className="chat-head">
        <h2 id="prac-h" className="page-title">
          {persona.emoji} {persona.name} <span className="mood" title={`mood: ${mood}`}>{MOOD[mood]}</span>
        </h2>
        <button type="button" className="mini" onClick={() => setPersona(null)}>Switch person</button>
      </div>
      {avg !== null && <Meter value={avg} label="your average score" />}
      {notice && <Notice kind="info">{notice}</Notice>}

      {crisis ? (
        <CrisisCard message={crisis} />
      ) : (
        <>
          <div className="chat" ref={chatRef} aria-live="polite">
            {msgs.map((m) => (
              <div key={m.id} className={`msg ${m.role}`}>
                <div className="bubble">{m.fresh && m.role === 'them' ? <TypeText text={m.text} /> : m.text}</div>
                {m.coach && (m.coach.note || m.coach.tags.length > 0) && (
                  <div className="coach-note">
                    <span className="tape" aria-hidden="true" />
                    {typeof m.coach.rizz === 'number' && <b className="coach-score">{m.coach.rizz}</b>}
                    <span>{m.coach.note}</span>
                    {m.coach.tags.map((t) => <i key={t} className="tag">{t}</i>)}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="msg them"><div className="bubble"><Dots /></div></div>}
          </div>
          {error && <Notice kind="error">{error}</Notice>}
          <form className="sendrow" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input className="paper-input one" aria-label="Your message" maxLength={500} value={input} onChange={(e) => setInput(e.target.value)} placeholder={`text ${persona.name}…`} />
            <button type="submit" className="btn" disabled={!input.trim() || busy}>Send</button>
          </form>
          {avg !== null && (
            <div className="row">
              <ShareButton
                filename="love-guru-practice.png"
                build={() => ({
                  kicker: `Practice vs ${persona.name}`,
                  headline: best ? `Best line: “${best.text}”` : 'My practice round',
                  big: avg,
                  bigLabel: 'average score',
                  bullets: [`${scores.length} message${scores.length === 1 ? '' : 's'} sent`, `${persona.name} is feeling ${mood}`],
                  accent: '#7fb8a4',
                })}
              />
              <button type="button" className="btn ghost" onClick={() => start(persona)} disabled={busy}>Start over</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
