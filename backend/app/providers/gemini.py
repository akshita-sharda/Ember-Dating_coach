"""Google Gemini (AI Studio free tier) via its REST API. Key goes in a header, never the URL."""
from __future__ import annotations

import re

from .base import Provider, ProviderError, get_json, post_json

_SKIP = ("image", "tts", "live", "audio", "embedding", "native", "robotics", "computer", "vision", "thinking")


def pick_model(models: list[dict]) -> str | None:
    """Choose a current, stable Flash(-Lite) model from the ListModels response.

    Google renames/retires models often, so we don't hardcode one. Preference order:
    stable over preview, then Lite (friendlier free-tier limits), then newest version.
    """
    best, best_key = None, None
    for m in models:
        name = str(m.get("name", "")).split("/", 1)[-1]
        low = name.lower()
        if "generateContent" not in (m.get("supportedGenerationMethods") or []):
            continue
        if "flash" not in low or any(s in low for s in _SKIP):
            continue
        ver = re.search(r"gemini-(\d+(?:\.\d+)?)", low)
        key = (
            not any(t in low for t in ("preview", "exp")),
            "lite" in low,
            float(ver.group(1)) if ver else 0.0,
            -len(low),
        )
        if best_key is None or key > best_key:
            best, best_key = name, key
    return best


def extract_text(data: dict) -> str:
    cands = data.get("candidates") or []
    if not cands:
        reason = (data.get("promptFeedback") or {}).get("blockReason", "no candidates")
        raise ProviderError(f"blocked: {reason}", status=502)
    parts = (cands[0].get("content") or {}).get("parts") or []
    text = "".join(p.get("text", "") for p in parts if isinstance(p, dict))
    if not text.strip():
        raise ProviderError(f"empty: {cands[0].get('finishReason', 'unknown')}", status=502)
    return text


class GeminiProvider(Provider):
    name = "gemini"

    def __init__(self, api_key: str, model: str = "",
                 base: str = "https://generativelanguage.googleapis.com/v1beta", timeout: float = 25.0):
        self.api_key, self.model, self.base, self.timeout = api_key, model, base.rstrip("/"), timeout

    def _headers(self) -> dict:
        return {"x-goog-api-key": self.api_key}

    def resolve_model(self) -> str:
        if self.model:
            return self.model
        data = get_json(f"{self.base}/models?pageSize=200", self._headers(), self.timeout)
        chosen = pick_model(data.get("models") or [])
        if not chosen:
            raise ProviderError("no usable Gemini model found; set GEMINI_MODEL", status=404)
        self.model = chosen
        return chosen

    def generate_json(self, system: str, messages: list[dict], max_tokens: int = 900) -> str:
        model = self.resolve_model()
        contents = [
            {"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["content"]}]}
            for m in messages
        ]
        body = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": contents,
            "generationConfig": {
                "temperature": 0.9,
                "maxOutputTokens": max_tokens,
                "responseMimeType": "application/json",
            },
        }
        data = post_json(f"{self.base}/models/{model}:generateContent", body, self._headers(), self.timeout)
        return extract_text(data)
