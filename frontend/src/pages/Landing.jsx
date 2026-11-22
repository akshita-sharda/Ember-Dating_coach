import Figurine from '../gfx/Figurine.jsx';
import HeroTrio from '../gfx/Hero3D.jsx';
import { Tilt } from '../components/ui.jsx';
import { navigate } from '../router.js';
import { useApp } from '../state.jsx';

const TOPICS = [
  ['01', 'What to talk about', 'First-date topics and questions that go beyond "so, what do you do?"'],
  ['02', 'What to avoid', 'The common slip-ups, and what to do instead. No more guessing.'],
  ['03', 'Reading signals', 'Interest or politeness? Learn to look at patterns, not single texts.'],
  ['04', 'Calming nerves', 'Simple habits that turn overthinking into curiosity.'],
];
const COACHES = [
  ['sunny', 'Sunny', 'The warm older sibling', 'Patient and encouraging. Celebrates every small win.', 'delight'],
  ['sage', 'Sage', 'The calm mentor', 'Thoughtful and clear. Explains the why behind advice.', 'think'],
  ['rio', 'Rio', 'The straight-talking friend', 'Direct and funny. Says what friends usually will not.', 'encourage'],
];

export default function Landing() {
  const { onboarded } = useApp();
  const go = () => navigate(onboarded ? '/home' : '/start');
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">AI dating coach · 18+</p>
          <h1>Learn to <em className="paint">talk</em> to people you like.</h1>
          <p className="lead">
            Short lessons, honest advice and a coach who reacts to you, out loud if you want. For anyone dating, at any
            age, whoever you are looking for.
          </p>
          <div className="row">
            <button type="button" className="btn big" onClick={go}>{onboarded ? 'Back to my dashboard' : 'Start free'}</button>
            <a className="btn ghost big" href="#coaches" onClick={(e) => { e.preventDefault(); document.getElementById('coaches')?.scrollIntoView({ behavior: 'smooth' }); }}>Meet the coaches</a>
          </div>
          <p className="fineprint">Private by design: your answers stay in your browser.</p>
        </div>
        <div className="hero-stage"><HeroTrio /></div>
      </section>

      <div className="stripe">
        <div><b>9</b><span>guided lessons</span></div>
        <div><b>3</b><span>coach voices</span></div>
        <div><b>0</b><span>chats stored on a server</span></div>
        <div><b>Voice</b><span>optional, when you tap it</span></div>
      </div>

      <section className="block" aria-labelledby="learn-h">
        <h2 id="learn-h" className="h2">Friends mean well. A coach teaches.</h2>
        <p className="sub">Most advice you get is guesswork. Here you learn a skill, practise it, and get feedback you can trust.</p>
        <div className="grid4">
          {TOPICS.map(([n, h, p]) => (
            <Tilt key={n} className="card"><span className="num">{n}</span><h3>{h}</h3><p>{p}</p></Tilt>
          ))}
        </div>
      </section>

      <span className="divider" aria-hidden="true" />
      <section className="block" id="coaches" aria-labelledby="coach-h">
        <h2 id="coach-h" className="h2">Pick the coach that fits you.</h2>
        <p className="sub">Same honest advice, different voice. Switch any time.</p>
        <div className="grid3">
          {COACHES.map(([id, n, role, p, mood]) => (
            <Tilt key={id} className="card coach-card" max={5}>
              <div className="cc-fig"><Figurine id={id} name={n} mood={mood} /></div>
              <h3>{n}</h3><b className="role">{role}</b><p>{p}</p>
            </Tilt>
          ))}
        </div>
      </section>

      <p className="painted-quote">“Friends mean well, but a good coach tells you the <b>honest thing</b>, kindly.”</p>
      <span className="divider" aria-hidden="true" />
      <section className="block" aria-labelledby="how-h">
        <h2 id="how-h" className="h2">How it works</h2>
        <ol className="steps3">
          <li><b>Tell us about you</b><span>A minute of questions so your coach knows where you get stuck.</span></li>
          <li><b>Learn in small steps</b><span>Short lessons, each ending with a practice moment and feedback.</span></li>
          <li><b>Ask anything</b><span>Type or talk. Your coach answers, and you can see how it lands.</span></li>
        </ol>
        <div className="center"><button type="button" className="btn big" onClick={go}>{onboarded ? 'Open dashboard' : 'Meet your coach'}</button></div>
      </section>
    </>
  );
}
