import { useEffect, useId, useRef } from 'react';

/**
 * Illustrated coach portraits (SVG). Every part that moves is driven by one small animation loop:
 * gaze follows the pointer, eyes blink, brows / eyes / mouth shape themselves to the current `mood`,
 * and the mouth moves while `talking` is true.
 */

export const COACH_COLORS = { sunny: '#f0a35e', sage: '#7fbba5', rio: '#7f98ff' };

const LOOKS = {
  sunny: { skin: '#d79d78', skin2: '#b97d5a', hair: '#2b1a14', hair2: '#4a2e22', cloth: '#c4573f', cloth2: '#f3e3cc', lip: '#a8483f', iris: '#5b3519', blush: '#e0735f', accent: '#f0a35e' },
  sage: { skin: '#f0cfb4', skin2: '#d6a98a', hair: '#4a392e', hair2: '#6f5645', cloth: '#6f9d88', cloth2: '#e7efe9', lip: '#bf6b64', iris: '#4c6a45', blush: '#eba093', accent: '#7fbba5' },
  rio: { skin: '#8a5a3b', skin2: '#68402a', hair: '#0f0d0c', hair2: '#2a211c', cloth: '#26364f', cloth2: '#efe9de', lip: '#6e3a2e', iris: '#2b1a0f', blush: '#b65a49', accent: '#7f98ff' },
};

// target facial pose for each mood. smile -1..1, brow = lift in px (+ up), tilt = inner-brow lift (+ = worried / pleading)
const POSE = {
  idle: { smile: 0.28, open: 1, brow: 0, tilt: 0, browR: 0, cheek: 0.3, head: 0, gx: 0, gy: 0 },
  happy: { smile: 0.62, open: 0.94, brow: 1.5, tilt: 0, browR: 0, cheek: 0.7, head: 0, gx: 0, gy: 0 },
  delight: { smile: 1, open: 0.74, brow: 3.2, tilt: -0.5, browR: 0, cheek: 1, head: -2, gx: 0, gy: 0 },
  encourage: { smile: 0.55, open: 1, brow: 1.2, tilt: 2.2, browR: 0, cheek: 0.55, head: 4, gx: 0, gy: 0 },
  think: { smile: 0.02, open: 0.92, brow: 0, tilt: 0.5, browR: 4, cheek: 0.1, head: 5, gx: 0.45, gy: -0.7 },
  concern: { smile: -0.3, open: 1.06, brow: 0.8, tilt: 5.2, browR: 0, cheek: 0, head: 4, gx: 0, gy: 0.15 },
};

export const MOODS = Object.keys(POSE);

const damp = (c, t, r, dt) => c + (t - c) * (1 - Math.exp(-r * dt));

function Hair({ id, L }) {
  if (id === 'sunny') {
    return {
      back: (
        <path d="M51 100C44 44 80 22 104 24c36 2 56 34 47 82 4 36 0 66 14 108l-44-14H80l-44 14c14-42 10-72 15-114Z" fill={L.hair} />
      ),
      sides: (
        <g fill={L.hair}>
          <path d="M55 104c-14 34-8 66-20 104l34-8c-8-34-4-62-2-92Z" />
          <path d="M145 104c14 34 8 66 20 104l-34-8c8-34 4-62 2-92Z" />
        </g>
      ),
      front: (
        <g>
          <path d="M55 106C47 58 78 31 103 33c30 2 50 28 44 76-4-26-16-44-34-50-8 18-34 38-58 47Z" fill={L.hair} />
          <path d="M70 62c10-14 28-22 44-20-16 2-30 10-40 24Z" fill={L.hair2} opacity=".7" />
        </g>
      ),
    };
  }
  if (id === 'sage') {
    return {
      back: <path d="M50 102C45 44 80 25 102 25c36 0 58 26 48 77 4 22 0 38-8 50-6-24-10-44-16-52H74c-6 8-10 28-16 52-8-12-12-28-8-50Z" fill={L.hair} />,
      sides: null,
      front: (
        <g>
          <g transform="translate(200 0) scale(-1 1)">
            <path d="M55 104C48 60 76 34 104 35c30 1 48 28 42 66-6-22-18-38-38-42-10 18-32 36-53 45Z" fill={L.hair} />
          </g>
          <path d="M122 44c12 4 20 10 24 20-8-8-16-12-26-14Z" fill={L.hair2} opacity=".8" />
        </g>
      ),
    };
  }
  return {
    back: null,
    sides: null,
    front: (
      <g fill={L.hair}>
        <path d="M54 94C48 50 74 28 100 28c28 0 52 22 46 66-3-16-12-26-24-32-14 6-30 6-44 0-12 6-20 18-24 32Z" />
        {[[72, 40, 11], [90, 33, 11], [110, 33, 11], [128, 41, 11], [141, 56, 9], [60, 56, 9]].map(([x, y, r]) => (
          <circle key={x} cx={x} cy={y} r={r} />
        ))}
        <path d="M80 36c8-6 20-8 30-6-10 0-20 2-30 6Z" fill={L.hair2} opacity=".8" />
      </g>
    ),
  };
}

export default function Portrait({ id = 'sunny', name, mood = 'idle', talking = false, className = '', label }) {
  const L = LOOKS[id] || LOOKS.sunny;
  const uid = useId().replace(/[^a-z0-9]/gi, '');
  const root = useRef(null);
  const live = useRef({ mood, talking });
  live.current = { mood, talking };
  const r = useRef({});
  const hair = Hair({ id, L });

  useEffect(() => {
    const svg = root.current;
    if (!svg) return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const q = (k) => svg.querySelector(`[data-k="${k}"]`);
    const el = { head: q('head'), face: q('face'), torso: q('torso'), eyeL: q('eyeL'), eyeR: q('eyeR'), irisL: q('irisL'), irisR: q('irisR'), browL: q('browL'), browR: q('browR'), mouth: q('mouth'), mouthIn: q('mouthIn'), lipTop: q('lipTop'), cheekL: q('cheekL'), cheekR: q('cheekR') };
    const s = { gx: 0, gy: 0, tgx: 0, tgy: 0, smile: 0.28, open: 1, brow: 0, tilt: 0, browR: 0, cheek: 0.3, head: 0, mx: 0, blink: 0, nextBlink: 1.5 + Math.random() * 2, bgx: 0, bgy: 0, mo: 0 };
    const phase = Math.random() * 6;
    const onMove = (e) => {
      const b = svg.getBoundingClientRect();
      const cx = b.left + b.width / 2, cy = b.top + b.height * 0.4;
      s.tgx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.45)));
      s.tgy = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.45)));
    };
    if (!reduced) window.addEventListener('pointermove', onMove, { passive: true });

    let raf = 0, last = performance.now(), visible = true;
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; }) : null;
    io?.observe(svg);

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const t = now / 1000;
      const { mood: m, talking: talk } = live.current;
      const P = POSE[m] || POSE.idle;
      s.gx = damp(s.gx, s.tgx * 0.8 + P.gx, 6, dt);
      s.gy = damp(s.gy, s.tgy * 0.8 + P.gy, 6, dt);
      s.smile = damp(s.smile, P.smile, 7, dt);
      s.open = damp(s.open, P.open, 9, dt);
      s.brow = damp(s.brow, P.brow, 8, dt);
      s.tilt = damp(s.tilt, P.tilt, 8, dt);
      s.browR = damp(s.browR, P.browR, 8, dt);
      s.cheek = damp(s.cheek, P.cheek, 6, dt);
      s.head = damp(s.head, P.head, 5, dt);

      s.nextBlink -= dt;
      if (s.nextBlink <= 0) { s.blink = 0.15; s.nextBlink = 2.2 + Math.random() * 3.4; }
      let bl = 0;
      if (s.blink > 0) { s.blink -= dt; bl = Math.sin((1 - s.blink / 0.15) * Math.PI); }
      const eo = Math.max(0.06, s.open * (1 - bl * 0.94));

      // mouth: speech opens it in a syllable-like rhythm
      const target = talk && !reduced ? 0.25 + 0.75 * Math.abs(Math.sin(t * 11.5)) * (0.55 + 0.45 * Math.sin(t * 3.7) ** 2) : 0;
      s.mo = damp(s.mo, target, 28, dt);

      const breathe = reduced ? 0 : Math.sin(t * 1.6 + phase);
      el.torso?.setAttribute('transform', `translate(0 ${(breathe * 0.8).toFixed(2)})`);
      const tilt = s.head + s.gx * 2.2;
      el.head?.setAttribute('transform', `translate(${(s.gx * 3).toFixed(2)} ${(s.gy * 1.6 + breathe * 0.5).toFixed(2)}) rotate(${tilt.toFixed(2)} 100 172)`);
      el.face?.setAttribute('transform', `translate(${(s.gx * 4.2).toFixed(2)} ${(s.gy * 2.4).toFixed(2)})`);

      // eyes
      for (const k of ['eyeL', 'eyeR']) el[k]?.setAttribute('transform', `translate(${k === 'eyeL' ? 80 : 120} 101) scale(1 ${eo.toFixed(3)})`);
      for (const k of ['irisL', 'irisR']) el[k]?.setAttribute('transform', `translate(${(s.gx * 3.6).toFixed(2)} ${(s.gy * 2.2).toFixed(2)})`);

      // brows (left = viewer's left)
      const bl_ = 83 - s.brow, br_ = 83 - s.brow - s.browR;
      el.browL?.setAttribute('transform', `translate(80 ${bl_.toFixed(2)}) rotate(${(s.tilt * -1.6).toFixed(2)})`);
      el.browR?.setAttribute('transform', `translate(120 ${br_.toFixed(2)}) rotate(${(s.tilt * 1.6 - s.browR * 0.5).toFixed(2)})`);

      // mouth
      const sm = s.smile, o = s.mo * 9 + (m === 'delight' ? 1.5 : 0);
      const w = 13 + sm * 4 + s.mo * 1.5, cy = 134, c = -sm * 5.2;
      const uy = sm * 4.2 - 1.2 - s.mo * 0.5;
      const top = `M${-w} ${cy + c} Q0 ${cy + uy} ${w} ${cy + c}`;
      el.lipTop?.setAttribute('d', `M${100 - w} ${cy + c} Q100 ${cy + uy} ${100 + w} ${cy + c}`);
      const ly = uy + o * 1.9 + 2.2 + sm * 1.2;
      el.mouthIn?.setAttribute('d', `M${100 - w} ${cy + c} Q100 ${cy + uy} ${100 + w} ${cy + c} Q100 ${cy + ly} ${100 - w} ${cy + c}Z`);
      el.mouthIn?.setAttribute('opacity', o > 0.6 || sm > 0.85 ? '1' : '0');
      void top;
      el.mouth?.setAttribute('transform', `translate(${(s.gx * 1.4).toFixed(2)} 0)`);
      const ck = Math.max(0, s.cheek);
      el.cheekL?.setAttribute('opacity', (0.12 + ck * 0.34).toFixed(2));
      el.cheekR?.setAttribute('opacity', (0.12 + ck * 0.34).toFixed(2));
    };
    raf = requestAnimationFrame(frame);
    if (reduced) { s.tgx = 0; }
    r.current = {};
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); io?.disconnect(); };
  }, [id]);

  const eye = (side) => (
    <g data-k={side === -1 ? 'eyeL' : 'eyeR'}>
      <path d="M-14 0Q0-11 14 0Q0 10.5-14 0Z" fill="#fbf6ee" />
      <g data-k={side === -1 ? 'irisL' : 'irisR'}>
        <circle r="6.6" fill={L.iris} />
        <circle r="6.6" fill={`url(#${uid}iris)`} />
        <circle r="2.9" fill="#0b0807" />
        <circle cx="-2.2" cy="-2.4" r="1.7" fill="#fff" opacity=".95" />
        <circle cx="2.4" cy="2.2" r=".8" fill="#fff" opacity=".6" />
      </g>
      <path d="M-15 .6Q0-13 15 .6" fill="none" stroke={L.hair} strokeWidth="2.4" strokeLinecap="round" />
      <path d={side === -1 ? 'M-15 .6l-4-3' : 'M15 .6l4-3'} stroke={L.hair} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
  const browPath = <path d="M-13 1.5Q0-5 13-.5" fill="none" stroke={L.hair} strokeWidth={id === 'rio' ? 3.6 : 3} strokeLinecap="round" />;

  return (
    <svg ref={root} className={`portrait-svg ${className}`} viewBox="0 0 200 240" role="img" aria-label={label || `${name || id}, your coach`} preserveAspectRatio="xMidYMax meet">
      <defs>
        <radialGradient id={`${uid}face`} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#fff" stopOpacity=".26" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".2" />
        </radialGradient>
        <radialGradient id={`${uid}iris`} cx="50%" cy="65%" r="60%">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}cloth`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".14" />
          <stop offset="1" stopColor="#000" stopOpacity=".28" />
        </linearGradient>
      </defs>

      {hair.back}
      <g data-k="torso">
        <path d="M14 244C16 200 52 180 100 178s84 22 86 66Z" fill={L.cloth} />
        <path d="M14 244C16 200 52 180 100 178s84 22 86 66Z" fill={`url(#${uid}cloth)`} />
        <path d="M84 152h32v24c0 8-32 8-32 0Z" fill={L.skin2} />
        {id === 'sunny' && (
          <g>
            <path d="M80 178l20 30 20-30c-8 4-32 4-40 0Z" fill={L.skin2} />
            <path d="M76 176l24 40 24-40-6-3-18 28-18-28Z" fill={L.cloth2} />
            <path d="M84 191q16 15 32 0" fill="none" stroke="#e6b865" strokeWidth="1.3" />
            <circle cx="100" cy="206" r="2.2" fill="#e6b865" />
          </g>
        )}
        {id === 'sage' && (
          <g>
            <path d="M72 168c8-8 48-8 56 0l-4 16c-14 6-34 6-48 0Z" fill="#5f8a76" />
            <path d="M72 168c8-8 48-8 56 0" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="1.4" />
            {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${30 + i * 28} 200v40`} stroke="#fff" strokeOpacity=".08" strokeWidth="5" />)}
          </g>
        )}
        {id === 'rio' && (
          <g>
            <path d="M84 176l16 36 16-36c-6 3-26 3-32 0Z" fill={L.cloth2} />
            <path d="M58 188l22-14 20 42-26 28Z" fill="#1c2940" />
            <path d="M142 188l-22-14-20 42 26 28Z" fill="#1c2940" />
            <path d="M62 150c-10 18-6 36 4 48" fill="none" stroke="#10141c" strokeWidth="5" strokeLinecap="round" />
            <path d="M138 150c10 18 6 36-4 48" fill="none" stroke="#10141c" strokeWidth="5" strokeLinecap="round" />
            <rect x="52" y="190" width="14" height="22" rx="6" fill={L.accent} />
            <rect x="134" y="190" width="14" height="22" rx="6" fill={L.accent} />
          </g>
        )}
        <ellipse cx="100" cy="171" rx="25" ry="7" fill="#000" opacity=".16" />
      </g>
      {hair.sides}

      <g data-k="head">
        <ellipse cx="54" cy="106" rx="7" ry="12" fill={L.skin2} />
        <ellipse cx="146" cy="106" rx="7" ry="12" fill={L.skin2} />
        {id === 'rio' && <circle cx="146" cy="119" r="2.6" fill="#f0d080" />}
        <path d="M100 38C132 38 147 66 147 96c0 34-21 64-47 68-26-4-47-34-47-68 0-30 15-58 47-58Z" fill={L.skin} />
        <path d="M100 38C132 38 147 66 147 96c0 34-21 64-47 68-26-4-47-34-47-68 0-30 15-58 47-58Z" fill={`url(#${uid}face)`} />

        <g data-k="face">
          <ellipse data-k="cheekL" cx="71" cy="118" rx="11" ry="6.5" fill={L.blush} opacity=".3" />
          <ellipse data-k="cheekR" cx="129" cy="118" rx="11" ry="6.5" fill={L.blush} opacity=".3" />
          {eye(-1)}
          {eye(1)}
          <g data-k="browL"><g>{browPath}</g></g>
          <g data-k="browR"><g transform="scale(-1 1)">{browPath}</g></g>
          <path d="M99 103q-5 14-3 17c1.6 2.4 7 2.4 9.4 0" fill="none" stroke={L.skin2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <g data-k="mouth">
            <path data-k="mouthIn" d="M87 134Q100 133 113 134Q100 138 87 134Z" fill="#3a1218" opacity="0" />
            <path data-k="lipTop" d="M87 134Q100 133 113 134" fill="none" stroke={L.lip} strokeWidth="3" strokeLinecap="round" />
          </g>
          {id === 'sage' && (
            <g fill="none" stroke="#22292a" strokeWidth="1.9">
              <circle cx="80" cy="101" r="17.5" /><circle cx="120" cy="101" r="17.5" />
              <path d="M97.5 100q2.5-3 5 0" /><path d="M62.5 100L54 97M137.5 100l8.5-3" />
              <path d="M66 92a17 17 0 0 1 10-8" stroke="#fff" strokeOpacity=".5" strokeWidth="1.4" />
            </g>
          )}
          {id === 'rio' && <path d="M70 142c8 22 52 22 60 0-4 14-12 22-30 24-18-2-26-10-30-24Z" fill="#000" opacity=".07" />}
        </g>
        {hair.front}
      </g>
    </svg>
  );
}
