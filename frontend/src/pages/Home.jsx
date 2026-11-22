import Figurine from '../gfx/Figurine.jsx';
import { Notice, Ring, Tilt } from '../components/ui.jsx';
import { nextLesson, useCatalog } from '../data.js';
import { navigate } from '../router.js';
import { streakOf, useApp } from '../state.jsx';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export default function Home() {
  const app = useApp();
  const { lessons, coaches, error, retry } = useCatalog();
  const coach = (coaches || []).find((c) => c.id === app.coach);
  const done = Object.keys(app.progress).length;
  const total = lessons?.length || 0;
  const scores = Object.values(app.progress).map((p) => p.score);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const streak = streakOf(app.days);
  const next = nextLesson(lessons, app.progress, app.struggles);

  return (
    <section className="dash">
      <div className="dash-top">
        <div className="dash-coach"><Figurine id={app.coach} name={coach?.name} framing="bust" mood="happy" wave /></div>
        <div className="dash-hello">
          <p className="eyebrow">{greeting()}</p>
          <h1 className="h2">{coach ? `${coach.name} is ready when you are.` : 'Welcome back.'}</h1>
          {error && <Notice kind="error">{error} <button type="button" className="mini" onClick={retry}>Retry</button></Notice>}
          {next ? (
            <Tilt className="card next" max={5}>
              <small>Up next{app.struggles.length ? ', picked for you' : ''}</small>
              <h3>{next.title}</h3>
              <p>{next.blurb}</p>
              <div className="row">
                <button type="button" className="btn" onClick={() => navigate(`/learn/${next.id}`)}>Start lesson · {next.minutes} min</button>
                <button type="button" className="btn ghost" onClick={() => navigate('/coach')}>Ask {coach?.name || 'your coach'}</button>
              </div>
            </Tilt>
          ) : lessons ? (
            <Tilt className="card next" max={5}>
              <small>Path complete</small>
              <h3>You've finished every lesson.</h3>
              <p>Keep your skills sharp with practice chats, or ask your coach about a real situation.</p>
              <div className="row">
                <button type="button" className="btn" onClick={() => navigate('/tools/practice')}>Practice chats</button>
                <button type="button" className="btn ghost" onClick={() => navigate('/coach')}>Ask your coach</button>
              </div>
            </Tilt>
          ) : null}
        </div>
      </div>

      <div className="stats">
        <Tilt className="card stat"><Ring value={total ? (done / total) * 100 : 0} label={`${done}/${total || '–'}`} sub="lessons" /><b>Your path</b></Tilt>
        <Tilt className="card stat"><Ring value={avg ?? 0} label={avg ?? '–'} sub="avg" /><b>Practice score</b></Tilt>
        <Tilt className="card stat"><Ring value={Math.min(100, streak * 14)} label={streak} sub={streak === 1 ? 'day' : 'days'} /><b>Streak</b></Tilt>
      </div>

      <h2 className="h3">Your path</h2>
      <ol className="path-mini">
        {(lessons || []).map((l) => (
          <li key={l.id} className={app.progress[l.id] ? 'done' : ''}>
            <button type="button" onClick={() => navigate(`/learn/${l.id}`)}>
              <span className="node">{app.progress[l.id] ? '✓' : l.n}</span>
              <span>{l.title}</span>
              {app.progress[l.id] && <small>{app.progress[l.id].score}</small>}
            </button>
          </li>
        ))}
      </ol>

      <h2 className="h3">Anything else</h2>
      <div className="grid3">
        <Tilt as="button" className="card link" onClick={() => navigate('/coach')}><h3>Ask your coach</h3><p>A real situation or a quick question. Answers in your coach's voice.</p></Tilt>
        <Tilt as="button" className="card link" onClick={() => navigate('/tools')}><h3>Tools</h3><p>Reply helper, chat decoder, practice chats, profile polish.</p></Tilt>
        <Tilt as="button" className="card link" onClick={() => navigate('/me')}><h3>Your profile</h3><p>Switch coach, change preferences, see saved lines.</p></Tilt>
      </div>
    </section>
  );
}
