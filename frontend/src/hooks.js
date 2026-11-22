import { useCallback, useRef, useState } from 'react';

/** Wrap an async API call: { run, loading, result, error, reset }. Ignores stale responses. */
export function useTool(fn) {
  const [state, setState] = useState({ loading: false, result: null, error: null });
  const ticket = useRef(0);

  const run = useCallback(
    async (...args) => {
      const mine = ++ticket.current;
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const result = await fn(...args);
        if (mine === ticket.current) setState({ loading: false, result, error: null });
        return result;
      } catch (e) {
        if (mine === ticket.current) setState({ loading: false, result: null, error: e.message || 'Something went wrong.' });
        return null;
      }
    },
    [fn],
  );

  const reset = useCallback(() => {
    ticket.current++;
    setState({ loading: false, result: null, error: null });
  }, []);

  return { ...state, run, reset };
}

/** Pointer-based dragging, no library. Works with mouse, touch and pen. */
export function useDraggable() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const start = useRef(null);

  const bind = {
    onPointerDown(e) {
      e.currentTarget.setPointerCapture(e.pointerId);
      start.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
      setDragging(true);
    },
    onPointerMove(e) {
      const s = start.current;
      if (s) setPos({ x: s.ox + e.clientX - s.sx, y: s.oy + e.clientY - s.sy });
    },
    onPointerUp() {
      start.current = null;
      setDragging(false);
    },
    onPointerCancel() {
      start.current = null;
      setDragging(false);
    },
  };
  return { pos, dragging, bind };
}
