"""Provider interface + a small stdlib HTTP helper (no third-party packages needed)."""
from __future__ import annotations

import json
import socket
import urllib.error
import urllib.request


class ProviderError(Exception):
    """Anything that goes wrong talking to an AI provider."""

    def __init__(self, message: str, status: int | None = None):
        super().__init__(message)
        self.status = status

    @property
    def kind(self) -> str:
        if self.status == 429:
            return "rate_limit"
        if self.status in (400, 401, 403):
            return "auth"
        if self.status == 404:
            return "model"
        if self.status is None:
            return "network"
        return "other"


class Provider:
    """A provider turns (system prompt + chat messages) into a JSON string."""

    name = "base"

    def generate_json(self, system: str, messages: list[dict], max_tokens: int = 900) -> str:
        raise NotImplementedError


def _request(req: urllib.request.Request, timeout: float) -> dict:
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        exc.close()
        # Never include the request (it may carry an API key) in the error text.
        raise ProviderError(f"HTTP {exc.code}", status=exc.code) from None
    except (urllib.error.URLError, socket.timeout, TimeoutError, ConnectionError) as exc:
        raise ProviderError(f"network: {type(exc).__name__}") from None
    except (ValueError, UnicodeDecodeError):
        raise ProviderError("provider returned invalid JSON", status=502) from None


def post_json(url: str, body: dict, headers: dict | None = None, timeout: float = 25.0) -> dict:
    h = {"Content-Type": "application/json", **(headers or {})}
    req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers=h, method="POST")
    return _request(req, timeout)


def get_json(url: str, headers: dict | None = None, timeout: float = 25.0) -> dict:
    return _request(urllib.request.Request(url, headers=headers or {}, method="GET"), timeout)
