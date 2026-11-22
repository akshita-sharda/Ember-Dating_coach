import { Tilt } from '../components/ui.jsx';
import { navigate } from '../router.js';
import { useApp } from '../state.jsx';
import Decode from '../tools/Decode.jsx';
import Glowup from '../tools/Glowup.jsx';
import Practice from '../tools/Practice.jsx';
import Rizz from '../tools/Rizz.jsx';

const TOOLS = {
  rizz: { name: 'Reply helper', blurb: 'Paste a message you got and see three ways to reply.', C: Rizz },
  decode: { name: 'Chat decoder', blurb: 'Paste a conversation and see where it really stands.', C: Decode },
  practice: { name: 'Practice chats', blurb: 'Chat with a realistic character and get coaching after each message.', C: Practice },
  glowup: { name: 'Profile polish', blurb: 'Paste your dating bio and get honest fixes and rewrites.', C: Glowup },
};

export default function Tools({ tool }) {
  const app = useApp();
  const t = TOOLS[tool];
  if (t) {
    return (
      <section>
        <button type="button" className="back" onClick={() => navigate('/tools')}>← All tools</button>
        <t.C style={app.style} onSave={(item) => app.save(item)} />
      </section>
    );
  }
  return (
    <section>
      <p className="eyebrow">Tools</p>
      <h1 className="h2">Quick help, any time.</h1>
      <p className="sub">Learning is on your path. These are for real situations right now.</p>
      <div className="grid2">
        {Object.entries(TOOLS).map(([k, v]) => (
          <Tilt as="button" key={k} className="card link" onClick={() => navigate(`/tools/${k}`)}><h3>{v.name}</h3><p>{v.blurb}</p></Tilt>
        ))}
      </div>
    </section>
  );
}
