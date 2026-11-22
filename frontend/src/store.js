// Everything the user keeps lives in their own browser (localStorage). The server stores nothing.
import { useCallback, useState } from 'react';

export const DEFAULT_STYLE = { vibe: 'chill', emoji: 'some', length: 'short', slang: 1, language: 'english' };

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota: the app still works, it just won't remember */
  }
}

export function useStored(key, initial) {
  const [value, setValue] = useState(() => read(key, initial));
  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const val = typeof next === 'function' ? next(prev) : next;
        write(key, val);
        return val;
      });
    },
    [key],
  );
  return [value, set];
}
