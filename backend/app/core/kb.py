"""Offline coach knowledge base: used when no AI is available. Same honest advice, in the chosen coach's voice."""
from __future__ import annotations

import re

TOPICS = [
    {"id": "nerves", "keys": ["nervous", "nerves", "anxious", "anxiety", "scared", "awkward", "shy", "panic", "overthink"],
     "reply": "Nerves mean you care, and almost everyone feels them. Treat the date as two people seeing if they enjoy each other, not an exam. Breathe out slowly, arrive a little early, and aim to be curious rather than impressive.",
     "tips": ["Breathe out longer than you breathe in", "Pick one thing you're curious about them", "Remember: you're deciding too"],
     "say": []},
    {"id": "start", "keys": ["start", "opener", "first message", "break the ice", "begin", "what to say", "hey"],
     "reply": "Open with one specific detail from their profile or message and ask one easy question. Specific beats clever, and a question they can answer in a line gets replies.",
     "tips": ["Mention something real from their profile", "One question, not five", "Skip a bare 'hey'"],
     "say": ["That photo looks amazing, where was it taken?", "Your bio made me laugh. What's your go-to comfort food?"]},
    {"id": "run-out", "keys": ["run out", "nothing to say", "awkward silence", "keep going", "keep the conversation", "dry", "boring", "lull", "blank"],
     "reply": "Follow their energy: when they brighten about something, ask about that. Share a small personal detail, then hand the conversation back. A pause is fine; smile and ask a follow-up.",
     "tips": ["Ask 'what's the story behind that?'", "Give a little, then ask", "Treat silence as normal"],
     "say": ["What got you into that?", "Okay, tell me more, what's the best part?"]},
    {"id": "topics", "keys": ["talk about", "topics", "conversation topics", "questions to ask", "what do i ask", "first date"],
     "reply": "Good first-date topics are warm and easy: things they enjoy, places they love, what they're looking forward to, funny small stories. Save heavy subjects like exes, money stress and strong politics for when there's trust.",
     "tips": ["Prepare three curious questions", "Tell one short happy story", "Put the phone away"],
     "say": ["What's been the best part of your week?", "What could you talk about for an hour?"]},
    {"id": "avoid", "keys": ["avoid", "shouldn't say", "should not", "red flag", "mistake", "turn off", "never say", "don't say"],
     "reply": "The big ones: pressure, interrogating, trash-talking an ex, one-upping their stories, and pushing past hesitation. Invite lightly, listen more than you fix, and accept a no gracefully.",
     "tips": ["Invite, don't push", "Listen before advising", "Skip ex-bashing"], "say": []},
    {"id": "signals", "keys": ["interested", "likes me", "signal", "mixed signals", "ghost", "slow reply", "left on read", "texting back", "reply"],
     "reply": "Look at the pattern, not one text. Effort is the signal: do they ask questions back, suggest plans, remember details? If you're unsure, a kind direct message beats guessing.",
     "tips": ["Look at several days, not one reply", "Notice effort and plans", "Ask kindly if unsure"],
     "say": ["I'm enjoying chatting with you. Would you like to meet up this week?"]},
    {"id": "ask-out", "keys": ["ask out", "ask her", "ask him", "ask them", "date invite", "meet up", "propose a date", "first date idea"],
     "reply": "Keep it specific, light and easy to decline: a day, a simple public place, a short plan. Coffee or a walk works well. Whatever they answer, respond warmly.",
     "tips": ["Offer a day and a place", "Make a no easy", "Go low-pressure"],
     "say": ["Want to grab coffee on Saturday afternoon?", "There's a nice bookshop cafe near me. Fancy a walk and a chai this weekend?"]},
    {"id": "rejection", "keys": ["rejected", "said no", "turned me down", "not interested", "heartbreak", "hurt", "rejection"],
     "reply": "A no stings, and it's not a verdict on your worth. Reply briefly and kindly, then give it space. Everyone gets declined; the people who handle it with grace stand out.",
     "tips": ["Send one gracious line, then stop", "Take care of yourself afterwards", "Learn, don't self-attack"],
     "say": ["Thanks for being honest. Wishing you well."]},
    {"id": "after", "keys": ["after the date", "follow up", "second date", "text after", "how long to wait"],
     "reply": "Don't play waiting games. Message that evening or the next morning, say something specific you enjoyed, and suggest a next step if you want one. If you don't, a brief kind note is better than silence.",
     "tips": ["Same evening or next morning", "Be specific", "Be clear about the next step"],
     "say": ["I really enjoyed tonight, especially the story about your trip. Would you like to do it again next week?"]},
    {"id": "profile", "keys": ["bio", "profile", "photos", "dating app", "pictures"],
     "reply": "A good profile shows what it's like to spend time with you: a few specific interests, a little humour, and one conversation hook. Use clear, recent photos with at least one smiling and one doing something you love.",
     "tips": ["Be specific, not generic", "Add a conversation hook", "Use clear recent photos"],
     "say": []},
    {"id": "boundaries", "keys": ["boundary", "boundaries", "consent", "uncomfortable", "pressure", "pushy", "creep", "unsafe"],
     "reply": "A no, a slowdown or silence is an answer: accept it with warmth and step back. And your limits count too, so you can say 'I'd like to take it slow' without apologising. If a meeting feels unsafe, meet in public and tell a friend.",
     "tips": ["Accept a no warmly", "State your own limits plainly", "Meet in public first"], "say": ["I'd like to take things slow, if that's okay."]},
]

FALLBACK = {
    "reply": "I can help with starting conversations, keeping them going, what to talk about on a date, what to avoid, reading signals, asking someone out and what to do afterwards. Tell me a bit about your situation and I'll get specific.",
    "tips": ["Say who you're talking to and where you're stuck", "Share the last message if there is one"],
    "say": [],
}


def match(text: str) -> dict:
    t = text.lower()
    best, score = None, 0
    for topic in TOPICS:
        s = sum(1 for k in topic["keys"] if re.search(r"(?<!\w)" + re.escape(k), t))
        if s > score:
            best, score = topic, s
    return best or {"id": "general", **FALLBACK, "keys": []}
