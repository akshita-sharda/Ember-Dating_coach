"""Settings, loaded from environment variables (and an optional .env file)."""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping


def load_dotenv(path: str | Path) -> None:
    """Tiny .env reader (stdlib only). Real environment variables win over the file."""
    p = Path(path)
    if not p.is_file():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key, value = key.strip(), value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


@dataclass(frozen=True)
class Settings:
    provider: str = "auto"                 # auto | gemini | ollama | offline
    gemini_api_key: str = ""
    gemini_model: str = ""                 # blank = auto-pick a current Flash model
    gemini_base: str = "https://generativelanguage.googleapis.com/v1beta"
    ollama_host: str = "http://127.0.0.1:11434"
    ollama_model: str = ""
    timeout: float = 25.0
    rate_limit: int = 20                   # requests ...
    rate_window: int = 60                  # ... per this many seconds, per IP
    trust_proxy: bool = False              # honour X-Forwarded-For (only behind your own proxy/host)
    cors_origins: tuple = ("http://localhost:5173", "http://127.0.0.1:5173",
                           "http://localhost:8000", "http://127.0.0.1:8000")

    def resolved_provider(self) -> str:
        choice = self.provider.lower()
        if choice in ("gemini", "ollama", "offline"):
            return choice
        if self.gemini_api_key:
            return "gemini"
        if self.ollama_model:
            return "ollama"
        return "offline"


def _int(value: str | None, default: int) -> int:
    try:
        return int(value) if value not in (None, "") else default
    except ValueError:
        return default


def load_settings(env: Mapping[str, str] | None = None) -> Settings:
    e = os.environ if env is None else env
    d = Settings()
    return Settings(
        provider=e.get("PROVIDER", d.provider),
        gemini_api_key=e.get("GEMINI_API_KEY", ""),
        gemini_model=e.get("GEMINI_MODEL", ""),
        gemini_base=e.get("GEMINI_BASE", d.gemini_base).rstrip("/"),
        ollama_host=e.get("OLLAMA_HOST", d.ollama_host).rstrip("/"),
        ollama_model=e.get("OLLAMA_MODEL", ""),
        timeout=float(_int(e.get("AI_TIMEOUT"), int(d.timeout))),
        rate_limit=_int(e.get("RATE_LIMIT"), d.rate_limit),
        rate_window=_int(e.get("RATE_WINDOW"), d.rate_window),
        trust_proxy=e.get("TRUST_PROXY", "").lower() in ("1", "true", "yes"),
    )
