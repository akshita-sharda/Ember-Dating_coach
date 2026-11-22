// Turns text into a facial expression for the coach portrait: delight | concern | encourage | think | happy.
const HEAVY = /\b(sad|lonely|alone|hurt|hurts|crying|rejected|heartbroken|breakup|broke up|anxious|anxiety|panic|scared|afraid|ashamed|embarrassed|depressed|ghosted|insecure|worthless|nervous|terrified)\b/i;
const SOFT = /\b(sorry|painful|difficult|tough|hard time|take care|be gentle|not alone|normal to feel|worried|upset)\b/i;
const JOY = /\b(great|awesome|amazing|fantastic|congrat\w*|proud|well done|nailed|brilliant|excellent|wonderful|love that|perfect)\b/i;
const THINK = /\b(depends|consider|however|on the other hand|let'?s think|might|could be|hard to say|not sure|it varies)\b/i;
const PUSH = /\b(almost everyone|you care|try|you can|small step|practice|start with|next time|you'?ve got|it'?s okay|totally normal|don'?t worry|give it a go)\b/i;

/** How the coach reacts to what the person just wrote, before the reply arrives. */
export function listeningMood(userText = '') {
  if (HEAVY.test(userText)) return 'concern';
  if (/\?\s*$/.test(userText.trim())) return 'think';
  return 'think';
}

/** The coach's own reply decides the expression while it speaks. */
export function replyMood(text = '') {
  if (HEAVY.test(text) || SOFT.test(text)) return 'concern';
  if (JOY.test(text)) return 'delight';
  if (PUSH.test(text)) return 'encourage';
  if (THINK.test(text)) return 'think';
  return 'happy';
}

/** How the learner did on a lesson check. */
export function scoreMood(score) {
  if (score >= 80) return 'delight';
  if (score >= 55) return 'happy';
  if (score >= 35) return 'encourage';
  return 'concern';
}
