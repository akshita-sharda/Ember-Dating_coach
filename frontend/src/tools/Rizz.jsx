import { useState } from 'react';
import { api } from '../api.js';
import { useTool } from '../hooks.js';
import { Chip, CopyButton, Dots, Meter, Notice, ResultShell, SaveButton, ScoreBadge } from '../components/ui.jsx';

const HEATS = [
  { v: 1, emoji: '', name: 'Friendly' },
  { v: 2, emoji: '', name: 'Warm & playful' },
  { v: 3, emoji: '', name: 'Bold' },
];

export default function Rizz({ style, onSave }) {
  const [text, setText] = useState('');
  const [heat, setHeat] = useState(2);
  const { run, loading, result, error } = useTool(api.rizz);

  const submit = () => {
    if (text.trim() && !loading) run({ message: text.trim(), heat, style });
  };

  return (
    <section className="page" aria-labelledby="rizz-h">
      <h2 id="rizz-h" className="page-title">
        Reply helper <span className="scribble">they texted. now what?</span>
      </h2>

      <label className="label" htmlFor="rizz-in">Paste what they sent</label>
      <textarea
        id="rizz-in"
        className="paper-input"
        rows={4}
        maxLength={1500}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === 'Enter' && submit()}
        placeholder="e.g. omg i just got back from a trek in manali, it was insane"
      />

      <div className="label">Tone</div>
      <div className="row">
        {HEATS.map((h) => (
          <Chip key={h.v} active={heat === h.v} onClick={() => setHeat(h.v)}>
            {h.emoji} {h.name}
          </Chip>
        ))}
      </div>

      <button type="button" className="btn" onClick={submit} disabled={!text.trim() || loading}>
        {loading ? <Dots /> : 'Suggest replies'}
      </button>
      {error && <Notice kind="error">{error}</Notice>}

      {result && (
        <ResultShell r={result}>
          {() => (
          <>
          <div className="energy">
            <span className="label">Their energy: <b>{result.their_energy.label}</b></span>
            <Meter value={result.their_energy.score} label="vibe" />
          </div>
          <ol className="notes">
            {result.replies.map((r, i) => (
              <li key={i} className="note" style={{ '--tilt': `${[-1.4, 1, -0.6][i % 3]}deg` }}>
                <span className="tape" aria-hidden="true" />
                <div className="note-top">
                  <span className="tag">{r.vibe}</span>
                  <ScoreBadge value={r.rizz} />
                </div>
                <p className="note-text">{r.text}</p>
                {r.why && <p className="note-why">{r.why}</p>}
                <div className="row tight">
                  <CopyButton text={r.text} />
                  <SaveButton text={r.text} from="Reply" onSave={onSave} />
                </div>
              </li>
            ))}
          </ol>
          {result.avoid && <p className="avoid"><b>Skip this:</b> {result.avoid}</p>}
        </>
          )}
        </ResultShell>
      )}
    </section>
  );
}
