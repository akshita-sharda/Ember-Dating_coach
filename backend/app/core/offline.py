"""The offline engine: no AI, no network. Rule-based but still useful, and the safety net for the AI path."""
from __future__ import annotations

import re

from . import personas
from .heuristics import analyze, clamp, clean, keywords, profile_score, rizz_breakdown
from .validate import clean_decode, clean_glowup, clean_practice, clean_rizz, label_for

# heat -> language -> templates. {t} = a topic word from their message (or "that").
REPLIES = {
    1: {
        "english": ["ok {t} is actually cool. how'd you get into it?",
                    "love that you brought up {t}. what's the best part?",
                    "no because {t} sounds fun. tell me more?"],
        "hinglish": ["arre {t} toh mast hai. kaise start kiya tumne?",
                     "sahi hai yaar, {t} ke baare mein aur batao",
                     "ok {t} sunke maza aaya. best part kya hai?"],
    },
    2: {
        "english": ["wait {t}?? ok you just got more interesting. story time",
                    "not you being low-key charming about {t}. what happens next?",
                    "i have follow-up questions about {t} and i'm not sorry"],
        "hinglish": ["wait {t}?? ab toh poori story chahiye",
                     "hmm {t} wala scene interesting hai... aage kya hua?",
                     "tumhare paas {t} pe aur kya kya stories hain? kehna padega"],
    },
    3: {
        "english": ["ok {t} AND a good sense of humor? that's a dangerous combo. coffee this week?",
                    "you're making me curious about {t}. tell me in person? i'm free thursday",
                    "i like this energy. {t} story over coffee, my treat?"],
        "hinglish": ["{t} aur upar se itna funny? khatarnak combo. coffee this week?",
                     "yaar {t} ki story sunni hai, but in person. thursday free ho?",
                     "tumhari vibe mast hai. {t} wali baat coffee pe karte hain?"],
    },
}
WHY = ["Shows you actually read what they said.", "Keeps it light and curious.", "Moves things forward without pressure."]
VIBES_BY_HEAT = {1: ["friendly", "curious", "easy"], 2: ["teasing", "curious", "playful"], 3: ["bold", "direct", "confident"]}

EXITS = [
    "totally get it, thanks for being upfront. take care!",
    "no worries at all, appreciate you telling me. all the best!",
    "got it, wishing you well :)",
]

CONVO_ME = {"me", "you", "i", "myself"}


def boundary_response(task: str) -> dict:
    """Used whenever the other person set a boundary. Deliberately never persuasive."""
    if task == "decode":
        return clean_decode({
            "verdict": "They've clearly set a boundary. This one's over, and that's okay.", "interest": 3,
            "their_vibe": "Clear and direct, not mixed signals.",
            "green_flags": [], "red_flags": ["They asked for space or said they're not interested."],
            "next_move": {"text": EXITS[0], "why": "A short, kind exit protects you both. Then stop messaging."},
            "dont": "Don't ask why, argue, or try one last message.",
        })
    return {
        "replies": [{"text": t, "vibe": "graceful exit", "why": "Respects their no and keeps your dignity.", "rizz": 90}
                    for t in EXITS],
        "their_energy": {"label": "not interested", "score": 3},
        "avoid": "Don't push, bargain, or try to change their mind. A no is a complete answer.",
    }


def _topic(text: str) -> str:
    kws = keywords(text, 1)
    return kws[0] if kws else "that"


def rizz(payload: dict) -> dict:
    msg, heat, style = payload["message"], payload["heat"], payload["style"]
    a = analyze(msg)
    t = _topic(msg)
    texts = [s.format(t=t) for s in REPLIES[heat][style["language"]]]
    energy = clamp(35 + 14 * min(a["questions"], 2) + min(a["words"], 24) + 4 * min(a["emoji"] + a["exclaims"], 3))
    label = ("really into it" if energy >= 75 else "warm" if energy >= 55 else "neutral" if energy >= 35 else "low-key")
    avoid = ("Don't send a wall of text back." if a["words"] <= 5
             else "Skip 'haha nice' on its own. Give them something to answer.")
    return clean_rizz({
        "their_energy": {"label": label, "score": energy},
        "replies": [{"text": txt, "vibe": VIBES_BY_HEAT[heat][i], "why": WHY[i], "rizz": None}
                    for i, txt in enumerate(texts)],
        "avoid": avoid,
    })


def parse_convo(text: str) -> list[tuple[str, str]]:
    out, unlabeled_turn = [], 0
    for line in (text or "").splitlines():
        line = line.strip()
        if not line:
            continue
        m = re.match(r"^([^:]{1,24}):\s*(.+)$", line)
        if m:
            who = "me" if m.group(1).strip().lower() in CONVO_ME else "them"
            out.append((who, m.group(2).strip()))
        else:
            out.append(("them" if unlabeled_turn % 2 == 0 else "me", line))
            unlabeled_turn += 1
    return out


def decode(payload: dict) -> dict:
    turns = parse_convo(payload["conversation"])
    them = [m for w, m in turns if w == "them"]
    me = [m for w, m in turns if w == "me"]
    if not them:
        return clean_decode({"verdict": "I can only read their side if they said something. Paste a few of their messages.",
                             "interest": 50, "next_move": {"text": "", "why": ""}})
    tw, mw = sum(len(m.split()) for m in them), max(sum(len(m.split()) for m in me), 1)
    q_rate = sum(m.count("?") for m in them) / len(them)
    short = sum(1 for m in them if len(m.split()) <= 2) / len(them)
    warm = any(re.search(r"haha|lol|lmao|😂|😊|😅|❤|🥺|😭", m, re.I) for m in them)
    interest, green, red = 40, [], []
    ratio = tw / mw
    if ratio >= 0.8:
        interest += 12; green.append("They match or beat your effort in message length.")
    elif ratio < 0.3:
        interest -= 12; red.append("Their replies are much shorter than yours.")
    if q_rate >= 0.4:
        interest += 12; green.append("They ask you questions, which means they want the chat to continue.")
    elif q_rate == 0:
        interest -= 8; red.append("They never ask anything back.")
    if warm:
        interest += 6; green.append("Laughing and expressive reactions show real engagement.")
    if short > 0.5:
        interest -= 15; red.append("Mostly one or two word replies.")
    interest = clamp(interest)
    if interest >= 60:
        move = {"text": "i'm enjoying this chat. want to continue it over coffee this week?",
                "why": "The signals are good, so move it offline before the energy fades."}
    elif interest >= 40:
        move = {"text": "Ask one specific, easy question about something they mentioned.",
                "why": "Mixed signals mean give them a reason to engage, not more pressure."}
    else:
        move = {"text": "Send one low-key message, then give them space.",
                "why": "Low energy means chasing makes it worse. Let them come to you."}
    verdict = {"locked in": "They're into this. Don't overthink it.", "warm": "Warm and leaning your way.",
               "mixed": "Mixed signals. Not a no, not a yes yet.", "cooling": "The energy is dropping.",
               "ghost mode": "This looks pretty one-sided."}[label_for(interest)]
    return clean_decode({
        "verdict": verdict, "interest": interest, "green_flags": green, "red_flags": red,
        "their_vibe": f"Averages {round(tw / len(them))} words per message.", "next_move": move,
        "dont": "Don't double or triple text.",
    })


def practice(payload: dict) -> dict:
    persona = personas.get(payload.get("persona_id", ""))
    msg = clean(payload.get("message", ""), 500)
    if not msg:
        return clean_practice({"reply": persona["opener"], "mood": "neutral",
                               "coach": {"note": f"You're chatting with {persona['name']}. Be specific and curious, "
                                                 "and avoid starting with just 'hey'.", "rizz": None, "tags": []}})
    turns = sum(1 for h in payload.get("history", []) if h.get("role") == "me")
    bd = rizz_breakdown(msg, " ".join(h["text"] for h in payload.get("history", []) if h.get("role") == "them"))
    score = bd["score"]
    effective = score - 8 * (persona["difficulty"] - 1)          # tougher personas are harder to impress
    mood = "hyped" if effective >= 80 else "intrigued" if effective >= 62 else "neutral" if effective >= 42 else "bored"
    if effective < 42:
        reply = "lol ok" if persona["difficulty"] >= 2 else "haha ok... and?"
    else:
        reply = persona["lines"][turns % len(persona["lines"])]
    a = bd["analysis"]
    if a["pressure"] or a["needy"]:
        note = "That reads pushy. Give them room and keep it light."
    elif bd["notes"]:
        note = "Try this: " + bd["notes"][0] + "."
    else:
        note = "Nice. It's specific and gives them something to answer."
    tags = [t for t, ok in (("curious", a["questions"] > 0), ("specific", not bd["notes"]), ("short", a["words"] < 3),
                            ("cliche", bool(a["cliches"]))) if ok][:3]
    return clean_practice({"reply": reply, "mood": mood, "coach": {"note": note, "rizz": None, "tags": tags}})


def glowup(payload: dict) -> dict:
    bio = payload["bio"]
    a = analyze(bio)
    fixes = []
    if a["words"] < 20:
        fixes.append("Too short. Aim for 20-90 words with two or three concrete details.")
    elif a["words"] > 90:
        fixes.append("Too long. People skim, so keep your best three details.")
    if not (a["questions"] or "ask me" in bio.lower()):
        fixes.append("Add a hook like 'ask me about...' so matches know what to say.")
    if a["cliches"]:
        fixes.append("Cut the clichés (" + ", ".join(f"'{c}'" for c in a["cliches"][:3]) + ") for something only you would say.")
    if a["self_ratio"] > 0.2:
        fixes.append("Lots of 'I/me/my'. Mention what you're curious about in other people.")
    cliche_words = {w for c in ("partner in crime", "love to laugh", "looking for someone who", "wanderlust", "foodie")
                    for w in c.split()}
    kws = [w for w in keywords(bio, 8) if w not in cliche_words][:2]
    if len(kws) == 2:
        r1 = f"Currently deep into {kws[0]} and {kws[1]}. Ask me about the last thing I got way too into."
    else:
        r1 = "Ask me about the last thing I got way too into. Mine was a six-month sourdough phase."
    r2 = "Two truths and a lie: " + (f"I know a lot about {kws[0]}, " if len(kws) == 2 else "I can cook one dish really well, ") + \
         "I'm always on time, I've never lost an argument about pizza toppings. Guess the lie."
    return clean_glowup({
        "score": profile_score(bio),
        "verdict": "Solid base. Make it more specific." if profile_score(bio) >= 55 else "Needs more of you in it.",
        "fixes": fixes or ["Looks good. Keep it specific and refresh your photos regularly."],
        "rewrites": [{"text": r1, "vibe": "playful"}, {"text": r2, "vibe": "chaotic"}],
        "hooks": ["Ask me about my worst haircut", "Debate me: best street food", "Tell me your comfort movie"],
    })


HANDLERS = {"rizz": rizz, "decode": decode, "practice": practice, "glowup": glowup}
