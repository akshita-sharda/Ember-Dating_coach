import { useState } from 'react';
import { api } from '../api.js';
import { useTool } from '../hooks.js';
import { Dots, Meter, Notice, ResultShell, ShareButton } from '../components/ui.jsx';

const SAMPLE = `Me: hey! how was the trek?
Them: omg so good, the views were insane
Me: send pics?
Them: haha later maybe. what did you do this weekend?
Me: nothing much, mostly sleeping lol
Them: lol same`;

const LABEL_COLOR = { 'locked in': '#2fbf71', warm: '#ff8a1f', mixed: '#c99a00', cooling: '#3b82c4', 'ghost mode': '#e04545' };

export default function Decode({ style }) {
  const [text, setText] = useState('');
  const { run, loading, result, error } = useTool(api.decode);

  const submit = () => {
    if (text.trim() && !loading) run({ conversation: text.trim(), style });
  };

  return (
    <section className="page" aria-labelledby="decode-h">
      <h2 id="decode-h" className="page-title">
        Chat decoder <span className="scribble">what are they really saying?</span>
      </h2>

      <label className="label" htmlFor="decode-in">Paste the chat (start lines with “Me:” and “Them:”)</label>
      <textarea
        id="decode-in"
        className="paper-input"
        rows={7}
        maxLength={6000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === 'Enter' && submit()}
        placeholder={'Me: hey!\nThem: hey, how are you?'}
      />
      <div className="row">
        <button type="button" className="btn" onClick={submit} disabled={!text.trim() || loading}>
          {loading ? <Dots /> : 'Read the vibe 🔍'}
        </button>
        <button type="button" className="btn ghost" onClick={() => setText(SAMPLE)}>Try an example</button>
      </div>
      {error && <Notice kind="error">{error}</Notice>}

      {result && (
        <ResultShell r={result}>
          {() => (
          <>
          <article className="receipt" aria-label="Vibe receipt">
            <header>
              <b>EMBER</b>
              <span>CHAT CHECK</span>
            </header>
            <p className="verdict">{result.verdict}</p>
            <div className="stamp-row">
              <Meter value={result.interest} label="interest" />
              <span className="stamp" style={{ color: LABEL_COLOR[result.label] || '#8a8f9c' }}>{result.label}</span>
            </div>
            {result.their_vibe && <p className="muted">{result.their_vibe}</p>}
            <hr />
            <div className="flags">
              <div>
                <h4>Good signs</h4>
                <ul>{result.green_flags.length ? result.green_flags.map((f, i) => <li key={i}>{f}</li>) : <li className="muted">none spotted</li>}</ul>
              </div>
              <div>
                <h4>Watch-outs</h4>
                <ul>{result.red_flags.length ? result.red_flags.map((f, i) => <li key={i}>{f}</li>) : <li className="muted">none spotted</li>}</ul>
              </div>
            </div>
            <hr />
            <h4>Next move</h4>
            <p className="move">{result.next_move.text}</p>
            {result.next_move.why && <p className="muted">{result.next_move.why}</p>}
            {result.dont && <p className="avoid"><b>Don’t:</b> {result.dont}</p>}
          </article>
          <div className="row">
            <ShareButton
              filename="love-guru-chat-check.png"
              build={() => ({
                kicker: 'Vibe check',
                headline: result.verdict,
                big: `${result.interest}%`,
                bigLabel: `interest · ${result.label}`,
                bullets: [...result.green_flags.slice(0, 2).map((f) => `+ ${f}`), ...result.red_flags.slice(0, 1).map((f) => `! ${f}`)],
                accent: LABEL_COLOR[result.label] || '#ffb067',
              })}
            />
          </div>
        </>
          )}
        </ResultShell>
      )}
    </section>
  );
}
