import { useEffect, useState } from 'react';
import { api } from './api.js';

let lessonCache = null;
let coachCache = null;

/** Lessons + coaches come from the API (single source of truth); cached for the session. */
export function useCatalog() {
  const [state, setState] = useState({ lessons: lessonCache, coaches: coachCache, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (lessonCache && coachCache) return undefined;
    let live = true;
    Promise.all([api.lessons(), api.coaches()])
      .then(([l, c]) => {
        lessonCache = l.lessons;
        coachCache = c.coaches;
        if (live) setState({ lessons: lessonCache, coaches: coachCache, error: null });
      })
      .catch((e) => live && setState({ lessons: null, coaches: null, error: e.message }));
    return () => {
      live = false;
    };
  }, [tick]);
  return { ...state, retry: () => setTick((n) => n + 1) };
}

export const AGES = [
  ['18-24', '18 to 24'],
  ['25-34', '25 to 34'],
  ['35-44', '35 to 44'],
  ['45+', '45 and over'],
];
export const GOALS = [
  ['relationship', 'A serious relationship'],
  ['casual', 'Something casual'],
  ['friends', 'Dates and new friends'],
  ['figuring-out', 'Still figuring it out'],
];
export const STRUGGLES = [
  ['starting', 'Starting conversations'],
  ['keeping', 'Keeping them going'],
  ['what-to-avoid', 'Knowing what not to say'],
  ['nerves', 'Nerves and overthinking'],
  ['reading-signals', 'Reading signals'],
  ['asking-out', 'Asking someone out'],
];

/** Which lesson to suggest first, based on what the user says they struggle with. */
const STRUGGLE_TO_LESSON = {
  starting: 'openers',
  keeping: 'keep-going',
  'what-to-avoid': 'avoid',
  nerves: 'mindset',
  'reading-signals': 'signals',
  'asking-out': 'ask-out',
};
export function nextLesson(lessons, progress, struggles) {
  if (!lessons) return null;
  const todo = lessons.filter((l) => !progress[l.id]);
  if (!todo.length) return null;
  const wanted = struggles.map((s) => STRUGGLE_TO_LESSON[s]).filter(Boolean);
  return todo.find((l) => wanted.includes(l.id)) || todo[0];
}
