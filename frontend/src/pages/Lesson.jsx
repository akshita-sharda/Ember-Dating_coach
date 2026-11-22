import { useEffect, useState } from 'react';
import Figurine from '../gfx/Figurine.jsx';
import { scoreMood } from '../emotion.js';
import { CopyButton, Dots, Notice, ResultShell, Ring, TypeText } from '../components/ui.jsx';
import { api } from '../api.js';
import { useCatalog } from '../data.js';
import { useTool } from '../hooks.js';
import { navigate } from '../router.js';
import { useApp } from '../state.jsx';

export default function Lesson({ id }) {
  const app = useApp();
  const { lessons, coaches } = useCatalog();
  const coach = (coaches || []).find((c) => c.id === app.coach);
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0); // 0..cards-1 = cards, cards = do/don't, cards+1 = practice
  const [answer, setAnswer] = useState('');
  const [talking, setTalking] = useState(true);
  const check = useTool(api.lessonCheck);

  useEffect(() => {
    let live = true;
    setLesson(null); setError(null); setStep(0); setAnswer('');
    api.lesson(id).then((d) => live && setLesson(d.lesson)).catch((e) => live && setError(e.message));
    app.touchDay();
    return () => { live = false; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // the coach "talks" while the text types in
  useEffect(() => {
    setTalking(true);
    const t = setTimeout(() => setTalking(false), 3200);
    return () => clearTimeout(t);
  }, [step, lesson]);

  if (error) return <section><Notice kind="error">{error}</Notice><button type="button" className="btn ghost" onClick={() => navigate('/learn')}>Back to the path</button></section>;
  if (!lesson) return <section><Dots /></section>;

  const n = lesson.cards.length;
  const onPractice = step === n + 1;
  const result = check.result;
  const idx = (lessons || []).findIndex((l) => l.id === id);
  const nextL = lessons && idx >= 0 ? lessons[idx + 1] : null;

  const submit = async () => {
    if (!answer.trim() || check.loading) return;
    const d = await check.run({ lesson_id: id, answer: answer.trim(), coach: app.coach, profile: app.profile });
    if (d && !d.crisis) app.completeLesson(id, d.score ?? 0);
  };

  const line = step < n ? lesson.cards[step].p : step === n ? 'Here is a quick cheat sheet to keep in your pocket.' : lesson.practice.scenario;

  return (
    <section className="lesson">
      <button type="button" className="back" onClick={() => navigate('/learn')}>← Learning path</button>
      <p className="eyebrow">{lesson.level} · {lesson.minutes} min</p>
      <h1 className="h2">{lesson.title}</h1>
      <div className="progress" aria-hidden="true"><i style={{ width: `${((step + 1) / (n + 2)) * 100}%` }} /></div>

      <div className="lesson-grid">
        <div className="lesson-coach"><Figurine id={app.coach} name={coach?.name} talking={talking} mood={result ? scoreMood(result.score) : step < n ? 'encourage' : 'think'} /></div>
        <div className="lesson-body">
          {step < n && (
            <div className="bubble-card" key={step}>
              <h3>{lesson.cards[step].h}</h3>
              <p><TypeText text={line} speed={12} /></p>
            </div>
          )}
          {step === n && (
            <div className="bubble-card" key="dd">
              <div className="dd">
                <div><h3>Do</h3><ul className="ticks">{lesson.do.map((x) => <li key={x}>{x}</li>)}</ul></div>
                <div><h3>Avoid</h3><ul className="crosses">{lesson.dont.map((x) => <li key={x}>{x}</li>)}</ul></div>
              </div>
            </div>
          )}
          {onPractice && (
            <div className="bubble-card" key="pr">
              <h3>Your turn</h3>
              <p>{lesson.practice.scenario}</p>
              <textarea className="paper-input" rows={3} maxLength={800} aria-label="Your answer" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Write it the way you would say it…" disabled={check.loading} />
              <div className="row">
                <button type="button" className="btn" onClick={submit} disabled={!answer.trim() || check.loading}>{check.loading ? <Dots /> : `Get ${coach?.name || 'coach'}'s feedback`}</button>
              </div>
              {check.error && <Notice kind="error">{check.error}</Notice>}
              {result && (
                <ResultShell r={result}>
                  {() => (
                    <div className="feedback">
                      <div className="fb-top"><Ring value={result.score} label={result.score} sub="score" /><p className="verdict-line">{result.verdict}</p></div>
                      {result.did_well?.length > 0 && <><h4>What worked</h4><ul className="ticks">{result.did_well.map((x) => <li key={x}>{x}</li>)}</ul></>}
                      {result.improve?.length > 0 && <><h4>Try this</h4><ul className="crosses soft">{result.improve.map((x) => <li key={x}>{x}</li>)}</ul></>}
                      {result.better_version && (
                        <div className="better"><small>A stronger version</small><p>{result.better_version}</p><CopyButton text={result.better_version} /></div>
                      )}
                      <div className="row">
                        {nextL
                          ? <button type="button" className="btn" onClick={() => navigate(`/learn/${nextL.id}`)}>Next: {nextL.title}</button>
                          : <button type="button" className="btn" onClick={() => navigate('/home')}>Finish and see progress</button>}
                        <button type="button" className="btn ghost" onClick={() => { check.reset(); setAnswer(''); }}>Try again</button>
                      </div>
                    </div>
                  )}
                </ResultShell>
              )}
            </div>
          )}
          {!onPractice && (
            <div className="row nav-row">
              <button type="button" className="btn ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</button>
              <button type="button" className="btn" onClick={() => setStep((s) => s + 1)}>{step === n ? 'Practice' : 'Next'}</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
