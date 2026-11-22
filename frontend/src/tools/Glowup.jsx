import { useState } from 'react';
import { api } from '../api.js';
import { useTool } from '../hooks.js';
import { Chip, CopyButton, Dots, Meter, Notice, ResultShell, SaveButton, ShareButton } from '../components/ui.jsx';

const PLATFORMS = ['Hinge', 'Bumble', 'Tinder', 'Instagram'];

export default function Glowup({ style, onSave }) {
  const [bio, setBio] = useState('');
  const [platform, setPlatform] = useState('Hinge');
  const { run, loading, result, error } = useTool(api.glowup);

  const submit = () => {
    if (bio.trim() && !loading) run({ bio: bio.trim(), platform, style });
  };

  return (
    <section className="page" aria-labelledby="glow-h">
      <h2 id="glow-h" className="page-title">
        Profile polish <span className="scribble">make your bio sound like you</span>
      </h2>

      <label className="label" htmlFor="glow-in">Paste your bio</label>
      <textarea
        id="glow-in"
        className="paper-input"
        rows={4}
        maxLength={1200}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === 'Enter' && submit()}
        placeholder="e.g. foodie, wanderlust, partner in crime wanted"
      />
      <div className="label">Where is it going?</div>
      <div className="row">
        {PLATFORMS.map((p) => (
          <Chip key={p} active={platform === p} onClick={() => setPlatform(p)}>{p}</Chip>
        ))}
      </div>

      <button type="button" className="btn" onClick={submit} disabled={!bio.trim() || loading}>
        {loading ? <Dots /> : 'Polish my bio'}
      </button>
      {error && <Notice kind="error">{error}</Notice>}

      {result && (
        <ResultShell r={result}>
          {() => (
          <>
          <Meter value={result.score} label="bio score" />
          {result.verdict && <p className="verdict">{result.verdict}</p>}
          {result.fixes.length > 0 && (
            <>
              <h4 className="label">Fix these</h4>
              <ul className="fixes">{result.fixes.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </>
          )}
          <ol className="notes">
            {result.rewrites.map((r, i) => (
              <li key={i} className="note alt" style={{ '--tilt': `${[1.2, -1][i % 2]}deg` }}>
                <span className="tape" aria-hidden="true" />
                <div className="note-top"><span className="tag">{r.vibe}</span></div>
                <p className="note-text">{r.text}</p>
                <div className="row tight">
                  <CopyButton text={r.text} />
                  <SaveButton text={r.text} from="Bio" onSave={onSave} />
                </div>
              </li>
            ))}
          </ol>
          {result.hooks.length > 0 && (
            <>
              <h4 className="label">Hooks to add</h4>
              <div className="row tight">{result.hooks.map((h) => <span key={h} className="tag big">{h}</span>)}</div>
            </>
          )}
          <div className="row">
            <ShareButton
              filename="love-guru-profile.png"
              build={() => ({
                kicker: `${platform} bio check`,
                headline: result.verdict || 'My bio glow-up',
                big: result.score ?? '',
                bigLabel: 'bio score',
                bullets: result.fixes.slice(0, 3),
                accent: '#7fb8a4',
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
