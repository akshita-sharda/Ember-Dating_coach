import { Suspense, useEffect } from 'react';
import ThemeCord from './components/ThemeCord.jsx';
import { match, navigate, usePath } from './router.js';
import { Provider, useApp } from './state.jsx';
import Coach from './pages/Coach.jsx';
import Home from './pages/Home.jsx';
import Landing from './pages/Landing.jsx';
import Learn from './pages/Learn.jsx';
import Lesson from './pages/Lesson.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Profile from './pages/Profile.jsx';
import Tools from './pages/Tools.jsx';

const NAV = [['/home', 'Home'], ['/learn', 'Learn'], ['/coach', 'Coach'], ['/tools', 'Tools'], ['/me', 'Profile']];

function Header({ path }) {
  const app = useApp();
  return (
    <header className="top">
      <a className="logo" href="#/" aria-label="Love Guru home"><span className="logo-orb" aria-hidden="true" /><span>Love Guru</span></a>
      {app.onboarded ? (
        <nav aria-label="Main">
          {NAV.map(([to, label]) => (
            <a key={to} href={`#${to}`} className={path === to || (to !== '/home' && path.startsWith(to)) ? 'on' : ''}>{label}</a>
          ))}
        </nav>
      ) : <a className="btn small" href="#/start">Get started</a>}
      <span className="cord-gap" aria-hidden="true" />
    </header>
  );
}

function Redirect({ to }) {
  useEffect(() => { navigate(to); }, [to]);
  return null;
}

/** Pointer position -> CSS variables, so the painted illustrations drift at different depths. */
function useParallax() {
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf = 0;
    const on = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = document.documentElement.style;
        r.setProperty('--px', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        r.setProperty('--py', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
        r.setProperty('--mx', `${e.clientX}px`);
        r.setProperty('--my', `${e.clientY}px`);
      });
    };
    window.addEventListener('pointermove', on, { passive: true });
    return () => { window.removeEventListener('pointermove', on); cancelAnimationFrame(raf); };
  }, []);
}

function Routes() {
  useParallax();
  const app = useApp();
  const path = usePath();
  const flipTheme = () => {
    const root = document.documentElement;
    root.classList.add('theme-anim');
    setTimeout(() => root.classList.remove('theme-anim'), 700);
    app.update({ theme: app.theme === 'night' ? 'paper' : 'night' });
  };
  let page = null;
  let params;
  if (path === '/') page = <Landing />;
  else if (path === '/start') page = <Onboarding />;
  else if (!app.onboarded) page = <Redirect to="/start" />;
  else if (path === '/home') page = <Home />;
  else if (path === '/learn') page = <Learn />;
  else if ((params = match('/learn/:id', path))) page = <Lesson id={params.id} key={params.id} />;
  else if (path === '/coach') page = <Coach />;
  else if (path === '/tools') page = <Tools />;
  else if ((params = match('/tools/:tool', path))) page = <Tools tool={params.tool} key={params.tool} />;
  else if (path === '/me') page = <Profile />;
  else page = (
    <section className="center-text"><h1 className="h2">That page wandered off.</h1><p className="sub"><a href="#/">Go back home</a></p></section>
  );
  return (
    <>
      <div className="ambient" aria-hidden="true"><i /><i /><i /><b /></div>
      <div className="cursor-light" aria-hidden="true" />
      <ThemeCord light={app.theme === 'paper'} onToggle={flipTheme} />
      <Header path={path} />
      <main id="main" className={path === '/' ? 'wide' : ''}><Suspense fallback={null}>{page}</Suspense></main>
      <footer className="foot">Love Guru coaches conversation and confidence. It is not therapy or a substitute for professional advice. 18+ only.</footer>
    </>
  );
}

export default function App() {
  return <Provider><Routes /></Provider>;
}
