// A ~30 line hash router: no dependency, works on any static host and with the FastAPI static mount.
import { useEffect, useState } from 'react';

const read = () => {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  return raw.startsWith('/') ? raw : '/' + raw;
};

export function navigate(path) {
  if (read() === path) return;
  window.location.hash = path;
}

export function usePath() {
  const [path, setPath] = useState(read);
  useEffect(() => {
    const on = () => {
      setPath(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return path;
}

/** match('/learn/:id', '/learn/openers') -> { id: 'openers' } | null */
export function match(pattern, path) {
  const a = pattern.split('/').filter(Boolean);
  const b = path.split('?')[0].split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}
