import { useEffect, useRef, useState } from 'react';
import Figurine from '../gfx/Figurine.jsx';
import { CopyButton, CrisisCard, Dots, Notice, TypeText } from '../components/ui.jsx';
import { api } from '../api.js';
import { useCatalog } from '../data.js';
import { useApp } from '../state.jsx';
import { listeningMood, replyMood } from '../emotion.js';
import { canListen, canSpeak, useVoice } from '../voice.js';

const STARTERS = {
  starting: 'How do I start a conversation without saying just "hey"?',
  keeping: 'What do I do when the conversation goes quiet?',
  'what-to-avoid': 'What should I never say on a first date?',
  nerves: 'I get really nervous before dates. Help?',
  'reading-signals': 'How can I tell if someone is actually interested?',
  'asking-out': 'How do I ask someone out without it being awkward?',
};
const DEFAULT_STARTERS = ['What should I talk about on a first date?', 'How do I start a conversation without saying just "hey"?', 'How do I know if someone is interested?'];

export default function Coach() {
  const app = useApp();
  const { coaches } = useCatalog();
  const coach = (coaches || []).find((c) => c.id === app.coach);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [crisis, setCrisis] = useState(null);
  const [talking, setTalking] = useState(false);
  const [freshIdx, setFreshIdx] = useState(-1);
  const [emotion, setEmotion] = useState('idle');
  const voice = useVoice(app.coach);
  const endRef = useRef(null);
  const timer = useRef(0);
  const chat = app.chat;

  const starters = app.struggles.length ? app.struggles.map((s) => STARTERS[s]).filter(Boolean).slice(0, 3) : DEFAULT_STARTERS;

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [chat.length, busy]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    const history = chat.slice(-10).map((m) => ({ role: m.role, text: m.text.slice(0, 500) }));
    app.update((d) => ({ chat: [...d.chat, { role: 'me', text: msg }].slice(-40) }));
    setEmotion(listeningMood(msg));
    setInput(''); setBusy(true); setError(null); setCrisis(null); app.touchDay();
    try {
      const d = await api.coach({ message: msg, coach: app.coach, history, profile: app.profile });
      if (d.crisis) setCrisis(d.message);
      else {
        app.update((c) => ({ chat: [...c.chat, { role: 'them', text: d.reply, tips: d.tips, say: d.try_saying, follow: d.followups, notice: d.notice }].slice(-40) }));
        setFreshIdx(Date.now());
        setEmotion(replyMood(d.reply));
        setTalking(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setTalking(false), Math.min(7000, 600 + d.reply.length * 22));
        if (voice.enabled) voice.speak(d.reply);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const lastIdx = chat.length - 1;
  const speakingNow = voice.enabled ? voice.speaking : talking;
  const face = busy ? emotion : speakingNow || chat.length ? emotion : 'happy';
  const state = voice.listening ? 'listening' : busy ? 'thinking' : speakingNow ? 'speaking' : emotion === 'idle' ? 'ready' : { delight: 'delighted', concern: 'concerned', encourage: 'encouraging', think: 'thoughtful', happy: 'warm' }[emotion] || 'ready';
  const mic = () => (voice.listening ? voice.stopListening() : voice.listen((t) => send(t)));
  return (
    <section className="coach-page">
      <div className="coach-side">
        <div className="coach-fig"><Figurine id={app.coach} name={coach?.name} talking={speakingNow} mood={voice.listening ? 'encourage' : face} /></div>
        <b>{coach?.name}</b><span className="role">{coach?.role}</span>
        <span className="mono coach-state" aria-live="polite">{state}</span>
        <button type="button" className="voice-toggle" aria-pressed={voice.enabled} disabled={!canSpeak && !canListen} onClick={voice.toggle} title={!canSpeak && !canListen ? 'Voice needs a recent Chrome or Edge' : 'Turn voice chat on or off'}>
          <i aria-hidden="true" />Voice {voice.enabled ? 'on' : 'off'}
        </button>
        {voice.speaking && <button type="button" className="mini" onClick={voice.stopSpeaking}>Stop speaking</button>}
        {chat.length > 0 && <button type="button" className="mini" onClick={() => app.update({ chat: [] })}>Clear chat</button>}
      </div>
      <div className="chat-col">
        <div className="chat big" aria-live="polite">
          {chat.length === 0 && (
            <div className="msg them"><div className="bubble">{coach?.hello || 'Hi! Ask me anything about dating and conversation.'}</div></div>
          )}
          {chat.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <div className="bubble">
                {m.role === 'them' && i === lastIdx && freshIdx > 0 ? <TypeText text={m.text} speed={14} /> : m.text}
              </div>
              {m.role === 'them' && (
                <div className="extras">
                  {m.notice && <Notice kind="info">{m.notice}</Notice>}
                  {m.tips?.length > 0 && <ul className="ticks">{m.tips.map((t) => <li key={t}>{t}</li>)}</ul>}
                  {m.say?.map((s) => (
                    <div key={s} className="say"><span>“{s}”</span><CopyButton text={s} /></div>
                  ))}
                  {i === lastIdx && m.follow?.length > 0 && (
                    <div className="chips tight">{m.follow.map((f) => <button key={f} type="button" className="chip" onClick={() => send(f)} disabled={busy}>{f}</button>)}</div>
                  )}
                </div>
              )}
            </div>
          ))}
          {busy && <div className="msg them"><div className="bubble"><Dots /></div></div>}
          {crisis && <CrisisCard message={crisis} />}
          <div ref={endRef} />
        </div>
        {chat.length === 0 && (
          <div className="chips tight">{starters.map((s) => <button key={s} type="button" className="chip" onClick={() => send(s)} disabled={busy}>{s}</button>)}</div>
        )}
        {error && <Notice kind="error">{error}</Notice>}
        <form className="sendrow" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input className="paper-input one" aria-label="Message your coach" maxLength={1000} value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Ask ${coach?.name || 'your coach'} anything…`} />
          {voice.enabled && canListen && (
            <button type="button" className={`mic${voice.listening ? ' on' : ''}`} aria-pressed={voice.listening} aria-label={voice.listening ? 'Stop listening' : 'Talk to your coach'} onClick={mic} disabled={busy}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
            </button>
          )}
          <button type="submit" className="btn" disabled={!input.trim() || busy}>Send</button>
        </form>
        {voice.enabled && (voice.listening || voice.heard) && <p className="heard" aria-live="polite">{voice.heard || 'Listening…'}</p>}
        {voice.problem && <Notice kind="warn">{voice.problem}</Notice>}
        {voice.enabled && !canListen && <p className="fineprint">Your browser can speak replies but not listen. Use Chrome or Edge to talk, or type.</p>}
      </div>
    </section>
  );
}
