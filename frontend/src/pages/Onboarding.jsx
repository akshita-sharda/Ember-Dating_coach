import { useEffect, useState } from 'react';
import Figurine from '../gfx/Figurine.jsx';
import { Chip, Notice } from '../components/ui.jsx';
import { AGES, GOALS, STRUGGLES, useCatalog } from '../data.js';
import { navigate } from '../router.js';
import { useApp } from '../state.jsx';

const STEPS = ['welcome', 'age', 'goal', 'struggles', 'coach'];

export default function Onboarding() {
  const app = useApp();
  const { coaches, error, retry } = useCatalog();
  const [step, setStep] = useState(0);
  const [age, setAge] = useState(app.age);
  const [goal, setGoal] = useState(app.goal);
  const [struggles, setStruggles] = useState(app.struggles);
  const [coach, setCoach] = useState(app.coach);
  const [under, setUnder] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  const toggle = (k) => setStruggles((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const finish = () => {
    app.update({ adult: true, onboarded: true, age, goal, struggles, coach });
    app.touchDay();
    navigate('/home');
  };

  const canNext = step === 1 ? !!age : step === 2 ? !!goal : true;

  return (
    <section className="onboard" aria-live="polite">
      <div className="dots-nav" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((s, i) => <i key={s} className={i <= step ? 'on' : ''} />)}
      </div>

      {step === 0 && (
        <div className="panel center-text">
          <p className="eyebrow">Welcome</p>
          <h1 className="h2">Let's get to know you a little.</h1>
          <p className="sub">Four quick questions so your coach knows where to start. Nothing is shared, it all stays in your browser.</p>
          {under ? (
            <Notice kind="info">Love Guru is for adults only (18+). Come back when you're 18, and take care for now.</Notice>
          ) : (
            <div className="row center">
              <button type="button" className="btn big" onClick={next}>I'm 18 or over</button>
              <button type="button" className="btn ghost big" onClick={() => setUnder(true)}>I'm under 18</button>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="panel">
          <h2 className="h2">How old are you?</h2>
          <p className="sub">Dating looks different at different stages, so your coach adjusts.</p>
          <div className="chips">{AGES.map(([k, l]) => <Chip key={k} active={age === k} onClick={() => setAge(k)}>{l}</Chip>)}</div>
        </div>
      )}
      {step === 2 && (
        <div className="panel">
          <h2 className="h2">What are you looking for?</h2>
          <p className="sub">There's no wrong answer, and this works whoever you're hoping to meet.</p>
          <div className="chips">{GOALS.map(([k, l]) => <Chip key={k} active={goal === k} onClick={() => setGoal(k)}>{l}</Chip>)}</div>
        </div>
      )}
      {step === 3 && (
        <div className="panel">
          <h2 className="h2">Where do you get stuck?</h2>
          <p className="sub">Pick all that apply. We'll start your path there.</p>
          <div className="chips">{STRUGGLES.map(([k, l]) => <Chip key={k} active={struggles.includes(k)} onClick={() => toggle(k)}>{l}</Chip>)}</div>
        </div>
      )}
      {step === 4 && (
        <div className="panel wide">
          <h2 className="h2">Choose your coach.</h2>
          <p className="sub">Same honest advice, different voice. You can switch any time from your profile.</p>
          {error && <Notice kind="error">{error} <button type="button" className="mini" onClick={retry}>Retry</button></Notice>}
          <div className="grid3 pick">
            {(coaches || []).map((c) => (
              <button key={c.id} type="button" className={`coach-pick${coach === c.id ? ' on' : ''}`} style={{ '--c': c.color }} aria-pressed={coach === c.id} onClick={() => setCoach(c.id)}>
                <Figurine id={c.id} name={c.name} framing="bust" mood={coach === c.id ? 'happy' : 'idle'} wave={coach === c.id} />
                <b>{c.name}</b><span className="role">{c.role}</span>
                <small>{coach === c.id ? c.hello : c.tagline}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {step > 0 && (
        <div className="row center nav-row">
          <button type="button" className="btn ghost" onClick={() => setStep((s) => s - 1)}>Back</button>
          {step < STEPS.length - 1
            ? <button type="button" className="btn" disabled={!canNext} onClick={next}>Continue</button>
            : <button type="button" className="btn" disabled={!coaches} onClick={finish}>Start with {(coaches || []).find((c) => c.id === coach)?.name || 'your coach'}</button>}
        </div>
      )}
    </section>
  );
}
