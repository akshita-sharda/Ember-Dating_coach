import { Notice } from '../components/ui.jsx';
import { useCatalog } from '../data.js';
import { navigate } from '../router.js';
import { useApp } from '../state.jsx';

export default function Learn() {
  const { progress } = useApp();
  const { lessons, error, retry } = useCatalog();
  const levels = [...new Set((lessons || []).map((l) => l.level))];
  return (
    <section>
      <p className="eyebrow">Learning path</p>
      <h1 className="h2">Short lessons. Real skills.</h1>
      <p className="sub">Each lesson takes a few minutes and ends with a practice moment and feedback from your coach.</p>
      {error && <Notice kind="error">{error} <button type="button" className="mini" onClick={retry}>Retry</button></Notice>}
      {levels.map((lv) => (
        <div key={lv} className="level">
          <h2 className="h3">{lv}</h2>
          <ol className="path">
            {lessons.filter((l) => l.level === lv).map((l) => {
              const p = progress[l.id];
              return (
                <li key={l.id}>
                  <button type="button" className={`lesson-row${p ? ' done' : ''}`} onClick={() => navigate(`/learn/${l.id}`)}>
                    <span className="node">{p ? '✓' : l.n}</span>
                    <span className="lr-body"><b>{l.title}</b><span>{l.blurb}</span></span>
                    <span className="lr-meta">{p ? `Score ${p.score}` : `${l.minutes} min`}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </section>
  );
}
