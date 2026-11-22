"""The orchestrator: safety -> (AI with one retry) -> validate -> blend scores -> or fall back offline."""
from __future__ import annotations

from ..providers.base import Provider, ProviderError
from . import coaching, curriculum, offline, personas, prompts, safety
from .heuristics import profile_score, rizz_breakdown
from .safety import CRISIS_MESSAGE
from .validate import CLEANERS, parse_json

TASKS = ("rizz", "decode", "practice", "glowup", "coach", "lesson")
CLEANERS = {**CLEANERS, "coach": coaching.clean_coach, "lesson": coaching.clean_lesson}
HANDLERS = {**offline.HANDLERS, "coach": coaching.offline_coach, "lesson": coaching.offline_lesson}
AI_WEIGHT = 0.6                         # final score = 60% AI judgement + 40% deterministic checks

NOTICES = {
    "rate_limit": "The AI is rate-limited right now, so this answer came from offline mode. Try again in a minute.",
    "auth": "The AI key was rejected, so you're on offline mode. Check GEMINI_API_KEY in your .env.",
    "model": "That AI model isn't available. Remove GEMINI_MODEL from .env to auto-pick one. Using offline mode for now.",
    "network": "Couldn't reach the AI, so this is offline mode.",
    "other": "The AI hiccuped, so this is offline mode.",
    "bad_output": "The AI gave a messy answer twice, so this is offline mode.",
}


def _blend(ai: int | None, heur: int) -> int:
    return heur if ai is None else round(AI_WEIGHT * ai + (1 - AI_WEIGHT) * heur)


class Engine:
    def __init__(self, provider: Provider | None = None):
        self.provider = provider

    @property
    def name(self) -> str:
        return self.provider.name if self.provider else "offline"

    # ------------------------------------------------------------------
    def run(self, task: str, payload: dict) -> dict:
        if task not in TASKS:
            raise ValueError(f"unknown task: {task}")
        payload = dict(payload)
        payload["style"] = prompts.normalize_style(payload.get("style"))
        payload["heat"] = prompts.clamp_heat(payload.get("heat", 2))

        sf = self._safety(task, payload)
        if sf.level == "crisis":
            return {"task": task, "engine": "safety", "crisis": True, "message": CRISIS_MESSAGE,
                    "notice": None, "heads_up": None}
        if sf.level == "boundary" and task in ("rizz", "decode"):
            return self._wrap(task, offline.boundary_response(task), "offline", None, sf)

        result, notice, engine = None, None, "offline"
        if self.provider is not None:
            try:
                result = self._ask_ai(task, payload)
                engine = self.provider.name
            except ProviderError as exc:
                notice = NOTICES.get(exc.kind, NOTICES["other"])
            except ValueError:
                notice = NOTICES["bad_output"]
        if result is None:
            result = HANDLERS[task](payload)
        self._blend_scores(task, payload, result)
        return self._wrap(task, result, engine, notice, sf)

    # ------------------------------------------------------------------
    def _safety(self, task: str, p: dict):
        if task == "rizz":
            return safety.check(any_text=p["message"], their_text=p["message"])
        if task == "decode":
            return safety.check(any_text=p["conversation"],
                                their_text="\n".join(m for w, m in offline.parse_convo(p["conversation"]) if w == "them"))
        if task == "practice":
            hist = p.get("history", [])
            return safety.check(any_text=p.get("message", ""), my_text=p.get("message", ""),
                                their_text=" ".join(h["text"] for h in hist if h.get("role") == "them"))
        if task == "coach":
            hist = p.get("history", [])
            return safety.check(any_text=p.get("message", ""), my_text=p.get("message", ""), their_text="")
        if task == "lesson":
            return safety.check(any_text=p.get("answer", ""), my_text=p.get("answer", ""), their_text="")
        return safety.check(any_text=p["bio"], my_text=p["bio"])

    def _ask_ai(self, task: str, payload: dict) -> dict:
        persona = personas.get(payload.get("persona_id", "")) if task == "practice" else None
        messages = []
        if task == "coach":
            for h in payload.get("history", [])[-10:]:
                messages.append({"role": "user" if h["role"] == "me" else "assistant", "content": h["text"]})
            messages.append({"role": "user", "content": prompts.fence(payload["message"])})
        elif task == "lesson":
            lesson = curriculum.get(payload.get("lesson_id", "")) or curriculum.LESSONS[0]
            messages.append({"role": "user", "content": coaching.lesson_user_message(lesson, payload["answer"])})
        elif task == "practice":
            for h in payload.get("history", [])[-12:]:
                messages.append({"role": "user" if h["role"] == "me" else "assistant", "content": h["text"]})
        if task not in ("coach", "lesson"):
            messages.append({"role": "user", "content": prompts.user_message(task, payload)})
        lesson = curriculum.get(payload.get("lesson_id", "")) or curriculum.LESSONS[0]
        last_error: Exception | None = None
        for attempt in range(2):
            if task == "coach":
                system = coaching.coach_system(payload.get("coach"), payload.get("profile"), attempt == 1)
            elif task == "lesson":
                system = coaching.lesson_system(payload.get("coach"), payload.get("profile"), lesson, attempt == 1)
            else:
                system = prompts.system_for(task, payload["style"], heat=payload["heat"],
                                            persona=persona, retry=attempt == 1)
            raw = self.provider.generate_json(system, messages)          # ProviderError propagates
            try:
                return CLEANERS[task](parse_json(raw))
            except ValueError as exc:
                last_error = exc
        raise ValueError(str(last_error))

    def _blend_scores(self, task: str, payload: dict, result: dict) -> None:
        if task == "rizz":
            for r in result["replies"]:
                r["rizz"] = _blend(r.get("rizz"), rizz_breakdown(r["text"], payload["message"])["score"])
        elif task == "practice" and payload.get("message"):
            ctx = " ".join(h["text"] for h in payload.get("history", []) if h.get("role") == "them")
            heur = rizz_breakdown(payload["message"], ctx)["score"]
            result["coach"]["rizz"] = _blend(result["coach"].get("rizz"), heur)
        elif task == "glowup":
            result["score"] = _blend(result.get("score"), profile_score(payload["bio"]))

    def _wrap(self, task: str, result: dict, engine: str, notice: str | None, sf) -> dict:
        heads_up = None
        if task in ("coach", "lesson"):
            pass
        elif sf.level == "pressure":
            heads_up = "That reads as pushy. Give them room: keep it light and let them set the pace."
        elif sf.level == "boundary":
            heads_up = "They've set a boundary. The best move is a kind, short exit, then stop messaging."
        return {"task": task, "engine": engine, "crisis": False, "notice": notice, "heads_up": heads_up, **result}
