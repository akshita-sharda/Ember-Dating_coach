// Opt-in voice chat on the browser's own speech APIs (no keys, no servers).
// Nothing listens or speaks until the person turns voice on and taps the mic.
import { useCallback, useEffect, useRef, useState } from 'react';

const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
export const canListen = !!SR;
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

const PITCH = { sunny: [1.12, 1], sage: [0.96, 0.94], rio: [0.82, 1.04] };
const WANT = { sunny: /female|zira|samantha|aria|jenny|susan|hazel|heera|google uk english female/i, rio: /\bmale\b|david|daniel|guy|ryan|mark|ravi|google uk english male/i };

function pickVoice(id) {
  const all = window.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  const wanted = WANT[id];
  return (wanted && all.find((v) => wanted.test(v.name))) || all.find((v) => /^en-(IN|GB|US)/i.test(v.lang)) || all[0] || null;
}

export function cleanForSpeech(text) {
  return String(text).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim();
}

export function useVoice(coachId) {
  const [enabled, setEnabled] = useState(false); // opt-in, never persisted
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [heard, setHeard] = useState('');
  const [problem, setProblem] = useState('');
  const rec = useRef(null);

  const stopSpeaking = useCallback(() => {
    if (canSpeak) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const stopListening = useCallback(() => {
    try { rec.current?.stop(); } catch { /* already stopped */ }
    setListening(false);
  }, []);

  const speak = useCallback((text) => {
    if (!canSpeak || !enabled) return;
    const say = cleanForSpeech(text);
    if (!say) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(say);
    const [pitch, rate] = PITCH[coachId] || [1, 1];
    u.pitch = pitch; u.rate = rate;
    const v = pickVoice(coachId);
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-IN';
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    try { window.speechSynthesis.speak(u); } catch { setSpeaking(false); }
  }, [enabled, coachId]);

  /** Listen once; calls onFinal(text) with what was heard. */
  const listen = useCallback((onFinal) => {
    if (!SR) { setProblem('Speech recognition works in Chrome or Edge. You can still type.'); return; }
    stopSpeaking();
    setProblem(''); setHeard('');
    const r = new SR();
    r.lang = navigator.language || 'en-IN';
    r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
    let finalText = '';
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t; else interim += t;
      }
      setHeard((finalText + interim).trim());
    };
    r.onerror = (e) => {
      setListening(false);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setProblem('Microphone is blocked. Allow it in the address bar, or type instead.');
      else if (e.error !== 'no-speech' && e.error !== 'aborted') setProblem('Could not hear that. Try again or type.');
    };
    r.onend = () => {
      setListening(false);
      const t = finalText.trim();
      setHeard('');
      if (t) onFinal(t);
    };
    rec.current = r;
    try { r.start(); setListening(true); } catch { setListening(false); }
  }, [stopSpeaking]);

  const toggle = useCallback(() => {
    setEnabled((on) => {
      if (on) { stopSpeaking(); try { rec.current?.abort(); } catch { /* ignore */ } setListening(false); }
      return !on;
    });
  }, [stopSpeaking]);

  useEffect(() => () => { if (canSpeak) window.speechSynthesis.cancel(); try { rec.current?.abort(); } catch { /* ignore */ } }, []);
  useEffect(() => { if (canSpeak) window.speechSynthesis.getVoices(); }, []);

  return { enabled, toggle, listening, speaking, heard, problem, listen, stopListening, speak, stopSpeaking };
}
