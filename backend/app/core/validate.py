"""Turn whatever the model returned into a clean, bounded, predictable shape (stdlib only).

Raises ValueError when the output is unusable so the engine can retry or fall back.
"""
from __future__ import annotations

import json
import re

LABELS = ("locked in", "warm", "mixed", "cooling", "ghost mode")
MOODS = ("hyped", "intrigued", "neutral", "bored")


def parse_json(text: str) -> dict:
    t = (text or "").strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t, flags=re.I).strip()
    try:
        obj = json.loads(t)
    except ValueError:
        start, end = t.find("{"), t.rfind("}")
        if start == -1 or end <= start:
            raise ValueError("no JSON object found") from None
        try:
            obj = json.loads(t[start:end + 1])
        except ValueError:
            raise ValueError("invalid JSON") from None
    if not isinstance(obj, dict):
        raise ValueError("JSON root must be an object")
    return obj


def _s(v, limit: int, default: str = "") -> str:
    if v is None:
        return default
    return re.sub(r"\s+", " ", str(v)).strip()[:limit] or default


def _i(v, default: int | None = None) -> int | None:
    try:
        return max(0, min(100, int(float(v))))
    except (TypeError, ValueError):
        return default


def _list(v, n: int, limit: int) -> list[str]:
    out = []
    for item in (v if isinstance(v, list) else []):
        text = _s(item.get("text") if isinstance(item, dict) else item, limit)
        if text:
            out.append(text)
        if len(out) == n:
            break
    return out


def label_for(interest: int) -> str:
    return ("locked in" if interest >= 80 else "warm" if interest >= 60 else
            "mixed" if interest >= 40 else "cooling" if interest >= 20 else "ghost mode")


def clean_rizz(raw: dict) -> dict:
    replies = []
    for r in (raw.get("replies") or []):
        if len(replies) == 3:
            break
        if isinstance(r, str):
            r = {"text": r}
        if not isinstance(r, dict):
            continue
        text = _s(r.get("text"), 400)
        if text:
            replies.append({"text": text, "vibe": _s(r.get("vibe"), 30, "reply"),
                            "why": _s(r.get("why"), 220), "rizz": _i(r.get("rizz"))})
    if not replies:
        raise ValueError("no replies")
    energy = raw.get("their_energy") if isinstance(raw.get("their_energy"), dict) else {}
    return {
        "replies": replies,
        "their_energy": {"label": _s(energy.get("label"), 40, "unclear"), "score": _i(energy.get("score"), 50)},
        "avoid": _s(raw.get("avoid"), 240) or None,
    }


def clean_decode(raw: dict) -> dict:
    verdict = _s(raw.get("verdict"), 220)
    if not verdict:
        raise ValueError("no verdict")
    interest = _i(raw.get("interest"), 50)
    label = _s(raw.get("label"), 20).lower()
    nm = raw.get("next_move") if isinstance(raw.get("next_move"), dict) else {"text": raw.get("next_move")}
    return {
        "verdict": verdict,
        "interest": interest,
        "label": label if label in LABELS else label_for(interest),
        "green_flags": _list(raw.get("green_flags"), 4, 160),
        "red_flags": _list(raw.get("red_flags"), 4, 160),
        "their_vibe": _s(raw.get("their_vibe"), 220),
        "next_move": {"text": _s(nm.get("text"), 300), "why": _s(nm.get("why"), 200)},
        "dont": _s(raw.get("dont"), 200) or None,
    }


def clean_practice(raw: dict) -> dict:
    reply = _s(raw.get("reply"), 500)
    if not reply:
        raise ValueError("no reply")
    coach = raw.get("coach") if isinstance(raw.get("coach"), dict) else {}
    mood = _s(raw.get("mood"), 12).lower()
    return {
        "reply": reply,
        "mood": mood if mood in MOODS else "neutral",
        "coach": {"note": _s(coach.get("note"), 260), "rizz": _i(coach.get("rizz")),
                  "tags": _list(coach.get("tags"), 3, 24)},
    }


def clean_glowup(raw: dict) -> dict:
    rewrites = []
    for r in (raw.get("rewrites") or []):
        if len(rewrites) == 2:
            break
        if isinstance(r, str):
            r = {"text": r}
        if isinstance(r, dict) and _s(r.get("text"), 500):
            rewrites.append({"text": _s(r.get("text"), 500), "vibe": _s(r.get("vibe"), 30, "rewrite")})
    if not rewrites:
        raise ValueError("no rewrites")
    return {
        "score": _i(raw.get("score")),
        "verdict": _s(raw.get("verdict"), 220),
        "fixes": _list(raw.get("fixes"), 4, 200),
        "rewrites": rewrites,
        "hooks": _list(raw.get("hooks"), 3, 120),
    }


CLEANERS = {"rizz": clean_rizz, "decode": clean_decode, "practice": clean_practice, "glowup": clean_glowup}
# "coach" and "lesson" cleaners are registered by core/coaching.py (avoids a circular import)
