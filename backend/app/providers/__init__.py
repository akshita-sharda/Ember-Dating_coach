from __future__ import annotations

from ..config import Settings
from .base import Provider, ProviderError
from .gemini import GeminiProvider
from .ollama import OllamaProvider

__all__ = ["Provider", "ProviderError", "GeminiProvider", "OllamaProvider", "build_provider"]


def build_provider(settings: Settings) -> Provider | None:
    """Return the configured AI provider, or None to run on the offline engine."""
    choice = settings.resolved_provider()
    if choice == "gemini" and settings.gemini_api_key:
        return GeminiProvider(settings.gemini_api_key, settings.gemini_model,
                              settings.gemini_base, settings.timeout)
    if choice == "ollama" and settings.ollama_model:
        return OllamaProvider(settings.ollama_model, settings.ollama_host, max(settings.timeout, 60.0))
    return None
