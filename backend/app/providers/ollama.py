"""Ollama: run a local model (e.g. `ollama pull llama3.2`), zero cost, nothing leaves your laptop."""
from __future__ import annotations

from .base import Provider, ProviderError, post_json


class OllamaProvider(Provider):
    name = "ollama"

    def __init__(self, model: str, host: str = "http://127.0.0.1:11434", timeout: float = 60.0):
        self.model, self.host, self.timeout = model, host.rstrip("/"), timeout

    def generate_json(self, system: str, messages: list[dict], max_tokens: int = 900) -> str:
        body = {
            "model": self.model,
            "messages": [{"role": "system", "content": system}, *messages],
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.9, "num_predict": max_tokens},
        }
        data = post_json(f"{self.host}/api/chat", body, timeout=self.timeout)
        text = (data.get("message") or {}).get("content", "")
        if not text.strip():
            raise ProviderError("empty response from Ollama", status=502)
        return text
