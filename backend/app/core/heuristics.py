"""Deterministic text signals. Used for the offline coach and to keep AI scores honest."""
from __future__ import annotations

import re
from collections import Counter

STOPWORDS = set(
    """about above after again also always another because been before being between both could
    does doing down during each even every from further have having here hers just like more most
    much only other over really same should since some such than that their them then there these
    they this those through under until very want were what when where which while will with would
    your yours yourself love loves looking people person thing things time good great best make
    made know lol haha yeah okay""".split()
)

CLICHES = [
    "partner in crime", "love to laugh", "fluent in sarcasm", "no drama", "looking for someone who",
    "work hard play hard", "here for a good time", "foodie", "wanderlust", "live laugh love",
    "netflix and chill", "just ask", "simple guy", "simple girl", "swipe right", "how are you",
    "hi there", "you're beautiful", "you are beautiful", "did it hurt when", "adventure seeker",
]
NEEDY = [
    "please reply", "why are you ignoring", "are you there", "text me back", "no one else",
    "you're the only", "you are the only", "why aren't you answering", "why are you not replying",
    "answer me", "seen me",
]
PRESSURE = [
    "send pics", "send nudes", "send me a pic", "come over now", "you owe me", "don't be boring",
    "stop being shy", "prove it", "what are you wearing",
]
EMOJI_RE = re.compile(r"[\U0001F300-\U0001FAFF☀-➿]")


def clean(text: str, limit: int = 2000) -> str:
    return re.sub(r"\s+", " ", text or "").strip()[:limit]


def keywords(text: str, n: int = 3) -> list[str]:
    words = [w for w in re.findall(r"[A-Za-z][A-Za-z'-]{3,}", (text or "").lower()) if w not in STOPWORDS]
    counts = Counter(words)
    return sorted(counts, key=lambda w: (counts[w], len(w)), reverse=True)[:n]


def analyze(text: str) -> dict:
    t = clean(text)
    low = t.lower()
    words = re.findall(r"\S+", t)
    first_person = len(re.findall(r"\b(i|i'm|i've|i'll|me|my|mine)\b", low))
    return {
        "words": len(words),
        "questions": t.count("?"),
        "exclaims": t.count("!"),
        "emoji": len(EMOJI_RE.findall(t)),
        "caps_words": len([w for w in words if len(w) > 2 and w.isupper()]),
        "self_ratio": first_person / max(len(words), 1),
        "cliches": [c for c in CLICHES if c in low],
        "needy": [c for c in NEEDY if c in low],
        "pressure": [c for c in PRESSURE if c in low],
        "keywords": keywords(t),
    }


def clamp(n: float, lo: int = 0, hi: int = 100) -> int:
    return int(max(lo, min(hi, round(n))))


def rizz_breakdown(reply: str, their_message: str = "") -> dict:
    """Score a message you're about to send, 5-98, with the reasons."""
    a = analyze(reply)
    score, notes = 60, []
    if a["words"] < 3:
        score -= 15
        notes.append("too short to give them anything to reply to")
    elif a["words"] <= 35:
        score += 10
    elif a["words"] > 60:
        score -= 12
        notes.append("too long for a text")
    if a["questions"]:
        score += 10
    else:
        notes.append("no hook or question")
    if their_message:
        shared = set(keywords(their_message, 6)) & set(re.findall(r"[a-z']{4,}", reply.lower()))
        if shared:
            score += 10
        else:
            notes.append("doesn't reference anything they said")
    score -= 15 * len(a["cliches"]) + 20 * len(a["needy"]) + 30 * len(a["pressure"])
    if a["exclaims"] > 2:
        score -= 6
    if a["caps_words"] >= 3:
        score -= 5
    if a["emoji"] > 4:
        score -= 4
    return {"score": clamp(score, 5, 98), "notes": notes, "analysis": a}


def profile_score(bio: str) -> int:
    """Deterministic 5-98 bio score: length, hook, specifics, cliches."""
    a = analyze(bio)
    score = 50
    if 20 <= a["words"] <= 90:
        score += 12
    elif a["words"] > 90:
        score -= 5
    else:
        score -= 8
    if a["questions"] or "ask me" in bio.lower():
        score += 8
    cliche_words = {w for c in CLICHES for w in re.findall(r"[a-z]+", c)}
    specifics = [w for w in keywords(bio, 10) if len(w) >= 5 and w not in cliche_words]
    if len(specifics) >= 4:
        score += 15
    score -= 8 * len(a["cliches"])
    if a["self_ratio"] > 0.2:
        score -= 4
    return clamp(score, 5, 98)
