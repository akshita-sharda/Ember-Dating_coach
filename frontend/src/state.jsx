// App-wide state. Everything is stored in this browser only (localStorage); the server stores nothing.
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { DEFAULT_STYLE, useStored } from './store.js';

const DEFAULTS = {
  adult: false,
  onboarded: false,
  age: '',
  goal: '',
  struggles: [],
  coach: 'sunny',
  theme: 'night',
  themeV: 0,
  style: DEFAULT_STYLE,
  progress: {}, // lessonId -> { score, at }
  saved: [], // { id, text, from }
  chat: [], // coach chat history { role: 'me'|'them', text, extra? }
  days: [], // activity days 'YYYY-MM-DD'
};

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export const today = () => new Date().toISOString().slice(0, 10);

export function Provider({ children }) {
  const [data, setData] = useStored('ember.v3', DEFAULTS);
  const state = useMemo(() => ({ ...DEFAULTS, ...data }), [data]);

  // older saves used 'dark' / 'light'; only 'night' keeps the dark look
  const theme = state.theme === 'paper' && state.themeV >= 4 ? 'paper' : 'night';
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (state.themeV < 4) setData((d) => ({ ...DEFAULTS, ...d, theme: 'night', themeV: 4 })); // v4 look starts in the dark
  }, [state.themeV, setData]);

  const update = useCallback((patch) => setData((d) => ({ ...DEFAULTS, ...d, ...(typeof patch === 'function' ? patch({ ...DEFAULTS, ...d }) : patch) })), [setData]);
  const touchDay = useCallback(() => update((d) => (d.days.includes(today()) ? {} : { days: [...d.days, today()].slice(-120) })), [update]);

  const api = useMemo(
    () => ({
      ...state,
      theme,
      update,
      touchDay,
      profile: { age: state.age, goal: state.goal, struggles: state.struggles },
      completeLesson: (id, score) =>
        update((d) => {
          const prev = d.progress[id];
          return { progress: { ...d.progress, [id]: { score: Math.max(score, prev?.score ?? 0), at: today() } } };
        }),
      save: (item) => update((d) => ({ saved: [{ id: Date.now() + Math.random(), ...item }, ...d.saved].slice(0, 60) })),
      unsave: (id) => update((d) => ({ saved: d.saved.filter((s) => s.id !== id) })),
      reset: () => setData(DEFAULTS),
    }),
    [state, update, touchDay, setData],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function streakOf(days) {
  const set = new Set(days);
  let n = 0;
  const d = new Date();
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
