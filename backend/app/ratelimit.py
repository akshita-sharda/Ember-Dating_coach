"""Sliding-window rate limiter (in memory, per key such as an IP address)."""
from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Callable


class RateLimiter:
    def __init__(self, limit: int, window: float, clock: Callable[[], float] = time.monotonic):
        self.limit, self.window, self.clock = limit, window, clock
        self._hits: dict[str, deque] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = self.clock()
        q = self._hits[key]
        while q and now - q[0] >= self.window:
            q.popleft()
        if len(q) >= self.limit:
            return False
        q.append(now)
        if len(self._hits) > 5000:          # keep memory bounded on a public deploy
            self._prune(now)
        return True

    def _prune(self, now: float) -> None:
        for k in [k for k, q in self._hits.items() if not q or now - q[-1] >= self.window]:
            del self._hits[k]
