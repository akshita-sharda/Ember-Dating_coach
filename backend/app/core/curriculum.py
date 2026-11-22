"""The learning path: short lessons, each with teaching cards and one practice moment.

Content is inclusive: it never assumes the user's gender or who they date.
"""
from __future__ import annotations

LESSONS = [
    {
        "id": "mindset", "title": "Start from calm", "minutes": 3, "level": "Foundations",
        "blurb": "Nerves are normal. Here's how to turn them into curiosity.",
        "cards": [
            {"h": "You're not auditioning", "p": "A date is two people checking if they enjoy each other. You're allowed to be choosy too. That one shift lowers the pressure a lot."},
            {"h": "Nerves and excitement feel the same", "p": "Racing heart, fast thoughts: your body can't tell the difference. Tell yourself 'I'm excited' and breathe out slowly, longer than you breathe in."},
            {"h": "Aim for curious, not impressive", "p": "Impressive makes you perform. Curious makes you listen. Listening is what people remember."},
        ],
        "do": ["Arrive a few minutes early and breathe", "Decide one thing you're curious about them"],
        "dont": ["Rehearse a perfect script", "Treat one date as a verdict on you"],
        "practice": {"scenario": "You're 10 minutes from a first date and your mind is racing. Write what you'd say to yourself.",
                     "keywords": ["breathe", "curious", "excited", "enjoy", "pressure", "fine", "okay", "calm", "nerves", "normal"]},
    },
    {
        "id": "openers", "title": "Starting a conversation", "minutes": 4, "level": "Foundations",
        "blurb": "Skip 'hey'. Open with something real and easy to answer.",
        "cards": [
            {"h": "Make it easy to reply to", "p": "A good opener points at something specific (a photo, a prompt, their bio) and asks one light question."},
            {"h": "Specific beats clever", "p": "'Is that the Himalayas? I've always wanted to go. Best part of the trip?' beats any pickup line."},
            {"h": "One question, not five", "p": "Interviews are tiring. Share a tiny bit of yourself, then ask one thing."},
        ],
        "do": ["Mention one real detail from their profile", "Ask something they can answer in a line"],
        "dont": ["Send just 'hey'", "Comment only on looks", "Copy-paste the same opener to everyone"],
        "practice": {"scenario": "Their profile says: 'Weekend trekker, bad at cooking, great at snacks.' Write your first message.",
                     "keywords": ["trek", "hike", "snack", "cook", "weekend", "mountain", "trail", "favourite", "favorite", "best"]},
    },
    {
        "id": "keep-going", "title": "Keeping it flowing", "minutes": 4, "level": "Foundations",
        "blurb": "Never run out of things to say: the follow-up trick.",
        "cards": [
            {"h": "Follow the energy", "p": "When they light up about something, ask about THAT. 'What got you into it?' opens more than any prepared topic."},
            {"h": "Give a little, then ask", "p": "Answer in a sentence or two with something personal, then hand the conversation back. It feels like a rally, not an exam."},
            {"h": "Silence is okay", "p": "A pause isn't failure. Smile, take a sip, and ask a follow-up. Comfort with quiet reads as confidence."},
        ],
        "do": ["Ask 'what's the story behind that?'", "Share your own small story"],
        "dont": ["Jump to a new topic every time", "Answer with one word"],
        "practice": {"scenario": "They said: 'I just started learning pottery, it's way harder than it looks.' Reply in a way that keeps it going.",
                     "keywords": ["pottery", "why", "what", "how", "started", "learn", "hard", "tried", "made", "story"]},
    },
    {
        "id": "first-date", "title": "First-date topics", "minutes": 5, "level": "Dating",
        "blurb": "What to talk about, and what to leave for later.",
        "cards": [
            {"h": "Safe, warm topics", "p": "Things they enjoy, places they love, what they're working on, small funny stories, what a perfect lazy Sunday looks like."},
            {"h": "Questions that go beyond 'what do you do?'", "p": "'What's been the best part of your week?' 'What are you looking forward to?' 'What's something you could talk about for an hour?'"},
            {"h": "Save these for later", "p": "Detailed ex stories, money worries, heavy politics, and long complaints about work. Not forbidden, just better once there's trust."},
        ],
        "do": ["Pick 3 curious questions beforehand", "Tell one short, happy story about yourself"],
        "dont": ["Trash-talk your ex", "Make it an interrogation", "Spend the date on your phone"],
        "practice": {"scenario": "It's the first date. There's a lull. Write two questions you could ask that aren't 'what do you do?'.",
                     "keywords": ["best", "favourite", "favorite", "weekend", "looking forward", "love", "enjoy", "story", "travel", "hour"]},
    },
    {
        "id": "avoid", "title": "What to avoid", "minutes": 4, "level": "Dating",
        "blurb": "The common slip-ups, and what to do instead.",
        "cards": [
            {"h": "Over-sharing or over-selling", "p": "Pouring out your whole history or listing achievements feels heavy. Let the details unfold over time."},
            {"h": "Pressure", "p": "Pushing for a quick date, a photo, a label or a reply is the fastest way to lose interest. Invite, don't push."},
            {"h": "Fixing, lecturing or one-upping", "p": "When they share a problem, listen first. Don't solve it unless they ask. Don't top their story with a bigger one."},
        ],
        "do": ["Invite lightly and accept a no gracefully", "Reflect back what you heard"],
        "dont": ["Double or triple text when they're quiet", "Criticise their choices", "Ignore 'I'm not sure'"],
        "practice": {"scenario": "You asked them out and they said, 'Hmm, this week is busy.' Write a reply that's relaxed and leaves them free.",
                     "keywords": ["no worries", "no pressure", "totally", "whenever", "let me know", "understand", "sure", "free", "later", "okay"]},
    },
    {
        "id": "signals", "title": "Reading signals", "minutes": 4, "level": "Dating",
        "blurb": "Is it interest or politeness? Look at the pattern.",
        "cards": [
            {"h": "Effort is the signal", "p": "Do they ask questions back, suggest plans, remember details? Effort shows interest. One-word replies and cancelled plans without an alternative show less."},
            {"h": "Don't over-read one text", "p": "People are busy. Look for a pattern over several days, not a single slow reply."},
            {"h": "When unsure, ask kindly", "p": "'I'm having fun, are you?' is a perfectly good question. Clarity is attractive."},
        ],
        "do": ["Watch patterns, not single moments", "Ask directly and kindly when unsure"],
        "dont": ["Decode every emoji", "Chase someone who is clearly pulling back"],
        "practice": {"scenario": "You've had three good chats, but they take a day to reply and never suggest meeting. Write a short, kind message that checks where you both stand.",
                     "keywords": ["fun", "enjoy", "meet", "see you", "coffee", "honest", "where", "feel", "totally fine", "no pressure", "you"]},
    },
    {
        "id": "boundaries", "title": "Boundaries and consent", "minutes": 4, "level": "Respect",
        "blurb": "The foundation of every good connection.",
        "cards": [
            {"h": "A no is a full answer", "p": "If someone declines, slows down, or goes quiet, accept it with warmth and step back. No convincing, no guilt."},
            {"h": "Check in, simply", "p": "'Would you like to…?' 'Are you comfortable with…?' Asking is attractive, not awkward."},
            {"h": "Your boundaries count too", "p": "You can say 'I'd rather take it slow' or 'that's not for me' without apologising. Real chemistry survives honesty."},
        ],
        "do": ["Say a kind, short goodbye if it's not a fit", "State your own limits plainly"],
        "dont": ["Keep messaging after a no", "Use guilt or pressure"],
        "practice": {"scenario": "You went on one date. They message: 'I had a nice time but I don't feel a romantic spark.' Write a gracious reply.",
                     "keywords": ["thank", "appreciate", "honest", "understand", "respect", "wish", "good luck", "glad", "nice", "take care"]},
    },
    {
        "id": "ask-out", "title": "Asking someone out", "minutes": 4, "level": "Action",
        "blurb": "Be clear, be easy, make it low-stakes.",
        "cards": [
            {"h": "Be specific and light", "p": "'Want to grab coffee Saturday afternoon?' beats 'we should hang out sometime'. A time and a simple place make a yes easy."},
            {"h": "Choose a low-pressure plan", "p": "Coffee, a walk, a bookshop. Public, short, easy to extend if it goes well."},
            {"h": "Handle any answer well", "p": "Yes: great, confirm. 'Not sure': give room. No: thank them warmly and move on. Your grace is memorable."},
        ],
        "do": ["Offer a specific day and place", "Make it easy to say no"],
        "dont": ["Be vague ('sometime?')", "Plan something intense or expensive"],
        "practice": {"scenario": "You've been chatting for a week and want to meet. Write the message that invites them for a coffee.",
                     "keywords": ["coffee", "saturday", "sunday", "friday", "weekend", "tea", "walk", "free", "grab", "up for"]},
    },
    {
        "id": "after", "title": "After the date", "minutes": 3, "level": "Action",
        "blurb": "Follow up without games or overthinking.",
        "cards": [
            {"h": "Say what's true, soon", "p": "A same-day message like 'I had a lovely time' works. No waiting game: games are tiring, honesty is attractive."},
            {"h": "If you want a second date, say so", "p": "Suggest a specific next step while the good feeling is fresh."},
            {"h": "If you don't, be kind and brief", "p": "'It was lovely to meet you, but I don't feel a match. Wishing you well.' A short clear message respects them."},
        ],
        "do": ["Message the same evening or next morning", "Be specific about what you liked"],
        "dont": ["Ghost without a word after a real date", "Send a long essay"],
        "practice": {"scenario": "Great first date tonight. Write the follow-up message you'd send.",
                     "keywords": ["lovely", "great", "fun", "enjoyed", "had a", "again", "see you", "next", "thank", "tonight"]},
    },
]
BY_ID = {l["id"]: l for l in LESSONS}


def get(lid: str) -> dict | None:
    return BY_ID.get(lid)


def public_list() -> list[dict]:
    return [{k: l[k] for k in ("id", "title", "minutes", "level", "blurb")} | {"n": i + 1}
            for i, l in enumerate(LESSONS)]
