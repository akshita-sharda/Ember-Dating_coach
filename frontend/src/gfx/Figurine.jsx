import Portrait, { COACH_COLORS } from './Portrait.jsx';

export { COACH_COLORS };

/**
 * A coach portrait inside its luminous arch frame.
 * mood: idle | happy | delight | encourage | think | concern, talking: bool.
 * (Name kept from the 3D version so every page keeps working.)
 */
export default function Figurine({ id, name, mood = 'idle', talking = false, wave = false, className = '' }) {
  return (
    <div className={`portrait ${className}`} style={{ '--c': COACH_COLORS[id] || '#ccc' }}>
      <span className="portrait-sheen" aria-hidden="true" />
      <Portrait id={id} name={name} mood={wave && mood === 'idle' ? 'happy' : mood} talking={talking} />
    </div>
  );
}
