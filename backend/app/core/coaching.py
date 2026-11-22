"""Coach chat + lesson feedback: prompts, validators and offline handlers (stdlib only)."""
from __future__ import annotations

import random
import re

from . import coaches, curriculum, kb
from .prompts import BASE_RULES, fence
from .validate import _i, _list, _s

AGES = ("18-24", "25-34", "35-44", "45+")
GOALS = ("relationship", "casual", "friends", "figuring-out")
STRUGGLES = ("starting", "keeping", "what-to-avoid", "nerves", "reading-signals", "asking-out")

COACH_SCHEMA = """{"reply":"your answer, 2-5 short sentences, in the coach's voice",
 "tips":["up to 3 short, concrete tips"],
 "try_saying":["up to 2 exact things the user could say or send, may be empty"],
 "followups":["up to 3 short questions the user might ask next"]}"""
LESSON_SCHEMA = """{"score":0-100,"verdict":"one kind, honest line","did_well":["up to 2 specific things"],
 "improve":["up to 2 concrete improvements"],"better_version":"an improved version in the user's own voice"}"""

INCLUSIVE = ("Be inclusive: never assume the user's gender, sexuality or who they date; use neutral words like "
             "'them', 'the person' or 'your date' unless the user says otherwise. The advice must be equally good "
             "for women, men and non-binary people, and for any age. Never stereotype.")


def profile_block(profile: dict | None) -> str:
    p = profile or {}
    bits = []
    if p.get("age") in AGES:
        bits.append(f"age range {p['age']}")
    if p.get("goal") in GOALS:
        bits.append(f"looking for: {p['goal'].replace('-', ' ')}")
    st = [s for s in (p.get("struggles") or []) if s in STRUGGLES]
    if st:
        bits.append("gets stuck on: " + ", ".join(s.replace("-", " ") for s in st))
    return "ABOUT THE USER: " + ("; ".join(bits) if bits else "no details shared yet.")


def coach_system(coach_id: str, profile: dict | None, retry: bool = False) -> str:
    c = coaches.get(coach_id)
    parts = [
        BASE_RULES.replace("You are Love Guru, a texting and dating coach", "You are a dating coach"),
        c["brief"],
        "TASK: You TEACH. The user may not know what to talk about or avoid, and friends' advice is often poor. "
        "Explain simply, give concrete examples and wording, keep it practical. If the question is vague, give your best "
        "short answer and invite detail. Stay on dating, conversation, confidence and respect; for anything else, "
        "kindly steer back. Same honest advice whatever your tone.",
        INCLUSIVE,
        profile_block(profile),
        "JSON SHAPE:\n" + COACH_SCHEMA,
    ]
    if retry:
        parts.append("IMPORTANT: reply with ONLY one valid JSON object in that shape.")
    return "\n\n".join(parts)


def lesson_system(coach_id: str, profile: dict | None, lesson: dict, retry: bool = False) -> str:
    c = coaches.get(coach_id)
    parts = [
        BASE_RULES.replace("You are Love Guru, a texting and dating coach", "You are a dating coach"),
        c["brief"],
        f"TASK: The user is doing a practice exercise for the lesson '{lesson['title']}'. "
        f"Scenario: {lesson['practice']['scenario']}\n"
        "Judge their answer kindly but honestly against the lesson ideas: "
        + "; ".join(lesson["do"]) + ". Avoid: " + "; ".join(lesson["dont"]) + ". "
        "Reward effort, be specific, and write a better version that keeps THEIR voice.",
        INCLUSIVE, profile_block(profile),
        "JSON SHAPE:\n" + LESSON_SCHEMA,
    ]
    if retry:
        parts.append("IMPORTANT: reply with ONLY one valid JSON object in that shape.")
    return "\n\n".join(parts)


def lesson_user_message(lesson: dict, answer: str) -> str:
    return "MY ANSWER:\n" + fence(answer)


# ---------------------------------------------------------------- validators
def clean_coach(raw: dict) -> dict:
    reply = _s(raw.get("reply"), 900)
    if not reply:
        raise ValueError("no reply")
    return {"reply": reply, "tips": _list(raw.get("tips"), 3, 160),
            "try_saying": _list(raw.get("try_saying"), 2, 220),
            "followups": _list(raw.get("followups"), 3, 90)}


def clean_lesson(raw: dict) -> dict:
    verdict = _s(raw.get("verdict"), 240)
    if not verdict:
        raise ValueError("no verdict")
    return {"score": _i(raw.get("score"), 60), "verdict": verdict,
            "did_well": _list(raw.get("did_well"), 2, 180), "improve": _list(raw.get("improve"), 2, 180),
            "better_version": _s(raw.get("better_version"), 500)}


# ---------------------------------------------------------------- offline
def _pick(items: list[str], seed: str) -> str:
    return random.Random(seed).choice(items)


def offline_coach(payload: dict) -> dict:
    msg = payload.get("message", "")
    c = coaches.get(payload.get("coach"))
    topic = kb.match(msg)
    opener = _pick(c["open"], msg + "o")
    closer = _pick(c["close"], msg + "c")
    reply = f"{opener} {topic['reply']} {closer}"
    followups = ["What should I avoid?", "Can you give me an example?", "What if they don't reply?"]
    if topic["id"] == "general":
        followups = ["How do I start a conversation?", "What do I talk about on a first date?", "How do I read signals?"]
    return {"reply": reply, "tips": list(topic["tips"])[:3], "try_saying": list(topic["say"])[:2],
            "followups": followups}


def offline_lesson(payload: dict) -> dict:
    lesson = curriculum.get(payload.get("lesson_id", "")) or curriculum.LESSONS[0]
    ans = payload.get("answer", "").strip()
    low = ans.lower()
    words = len(re.findall(r"\w+", ans))
    hits = [k for k in lesson["practice"]["keywords"] if k in low]
    score = 40 + min(30, len(hits) * 10)
    did, improve = [], []
    if words >= 6:
        score += 10
    else:
        improve.append("Say a bit more: aim for a full sentence or two.")
    if "?" in ans and lesson["id"] in ("openers", "keep-going", "first-date"):
        score += 10
        did.append("You asked a question, which gives them something to answer.")
    if hits:
        did.append("You picked up on the real details of the situation.")
    else:
        improve.append("Use a specific detail from the scenario so it feels personal.")
    if re.search(r"\b(hey+|hi+|hello)\W*$", low) and words <= 2:
        score -= 20
        improve.append("A bare greeting is hard to answer. Add one specific thing.")
    if re.search(r"\b(why won't you|you have to|you must|you owe)\b", low):
        score -= 20
        improve.append("That sounds pressuring. Keep it light and leave them free to choose.")
    score = max(10, min(95, score))
    verdict = ("Nicely done, that's the right instinct." if score >= 75 else
               "Good start. A couple of tweaks will make it land." if score >= 55 else
               "You're getting there. Here's how to sharpen it.")
    c = coaches.get(payload.get("coach"))
    return {"score": score, "verdict": verdict, "did_well": did[:2] or ["You gave it a go, which is the hard part."],
            "improve": improve[:2], "better_version": _model_answer(lesson),
            "voice": _pick(c["close"], ans)}


def _model_answer(lesson: dict) -> str:
    return {
        "mindset": "It's just a conversation. I'm going to breathe, be curious, and enjoy meeting them.",
        "openers": "Weekend trekker and snack expert? I need to know: best trail you've done, and best snack you carried?",
        "keep-going": "Pottery! I've always wanted to try it. What made you start, and what's the hardest part so far?",
        "first-date": "What's the best thing that happened to you this week? And what are you most looking forward to?",
        "avoid": "No worries at all, let me know whenever suits you. Happy to plan around your week.",
        "signals": "I've really enjoyed chatting with you. I'd love to meet up if you're up for it, no pressure either way.",
        "boundaries": "Thank you for telling me honestly, I appreciate it. I had a good time too and wish you all the best.",
        "ask-out": "I've enjoyed chatting this week. Want to grab a coffee on Saturday afternoon?",
        "after": "I had a lovely time tonight, especially the story about your trip. Would you like to do it again next week?",
    }.get(lesson["id"], "")
