"""Safety checks that run BEFORE any AI call.

crisis   - someone may be at risk: show support info, never coach.
boundary - the other person said no / stop: coach a graceful exit, never a comeback.
pressure - the user's own message pushes or pressures: flag it.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from .heuristics import PRESSURE

CRISIS_RE = re.compile(
    r"\b(kill myself|killing myself|end my life|end it all|suicid\w*|want to die|wanna die|"
    r"self[- ]?harm\w*|hurt myself|cut myself|no reason to live|better off dead|"
    r"(don'?t|do not) want to (be alive|live|be here anymore))\b", re.I)

BOUNDARY_RE = re.compile(
    r"\b(not interested|stop (texting|messaging|calling|talking|contacting)|leave me alone|"
    r"please stop|don'?t (text|message|call|contact) me|i have a (boyfriend|girlfriend|partner)|"
    r"you'?re making me uncomfortable|i('?m| am) uncomfortable|blocked? you)\b", re.I)

CRISIS_MESSAGE = (
    "This sounds heavier than texting advice, so I'm pausing the coaching. If you or someone you're "
    "talking to might hurt themselves, please reach out to a real person now: a trusted friend or family "
    "member, or a helpline. India: Tele-MANAS 14416 (free, 24/7). US: call or text 988. Elsewhere: findahelpline.com. "
    "If anyone is in immediate danger, call your local emergency number (112 in India, 911 in the US)."
)


@dataclass
class Safety:
    level: str = "ok"                       # ok | pressure | boundary | crisis
    flags: list[str] = field(default_factory=list)


def check(*, any_text: str = "", their_text: str = "", my_text: str = "") -> Safety:
    """any_text: anything pasted. their_text: what the other person wrote. my_text: what the user wrote."""
    everything = " ".join([any_text, their_text, my_text])
    if CRISIS_RE.search(everything):
        return Safety("crisis", ["crisis"])
    if BOUNDARY_RE.search(their_text or any_text):
        return Safety("boundary", ["boundary"])
    low = (my_text or "").lower()
    hits = [p for p in PRESSURE if p in low]
    if hits:
        return Safety("pressure", hits)
    return Safety()
