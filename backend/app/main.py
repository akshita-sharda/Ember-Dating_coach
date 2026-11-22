"""Love Guru API. Thin on purpose: all the logic lives in app/core (which is unit-tested).

Run (from the backend folder):   uvicorn app.main:app --reload
API docs:                        http://127.0.0.1:8000/docs
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .config import load_dotenv, load_settings
from .core import coaches, curriculum, personas
from .core.engine import Engine
from .providers import build_provider
from .ratelimit import RateLimiter

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")
settings = load_settings()
engine = Engine(build_provider(settings))
limiter = RateLimiter(settings.rate_limit, settings.rate_window)

app = FastAPI(
    title="AI Dating Coach API",
    version="3.0.0",
    description="A dating coach that teaches: lessons, coach chat, plus reply, decoder, practice and bio tools.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Adult"],
)


# ---------------------------------------------------------------- request models
class Style(BaseModel):
    vibe: str = Field("chill", max_length=20)
    emoji: str = Field("some", max_length=20)
    length: str = Field("short", max_length=20)
    slang: int = Field(1, ge=0, le=3)
    language: str = Field("english", max_length=20)


class Turn(BaseModel):
    role: Literal["me", "them"]
    text: str = Field(max_length=500)


class RizzReq(BaseModel):
    message: str = Field(min_length=1, max_length=1500)
    heat: int = Field(2, ge=1, le=3)
    style: Style = Field(default_factory=Style)


class DecodeReq(BaseModel):
    conversation: str = Field(min_length=1, max_length=6000)
    style: Style = Field(default_factory=Style)


class PracticeReq(BaseModel):
    persona_id: str = Field("maya", max_length=20)
    message: str = Field("", max_length=500)
    history: list[Turn] = Field(default_factory=list, max_length=24)
    style: Style = Field(default_factory=Style)


class GlowReq(BaseModel):
    bio: str = Field(min_length=1, max_length=1200)
    platform: str = Field("", max_length=30)
    style: Style = Field(default_factory=Style)


class Profile(BaseModel):
    age: str = Field("", max_length=10)
    goal: str = Field("", max_length=20)
    struggles: list[str] = Field(default_factory=list, max_length=6)


class CoachReq(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    coach: str = Field("sunny", max_length=20)
    history: list[Turn] = Field(default_factory=list, max_length=20)
    profile: Profile = Field(default_factory=Profile)


class LessonReq(BaseModel):
    lesson_id: str = Field(max_length=30)
    answer: str = Field(min_length=1, max_length=800)
    coach: str = Field("sunny", max_length=20)
    profile: Profile = Field(default_factory=Profile)


# ---------------------------------------------------------------- guard
def guard(request: Request, x_adult: str | None = Header(default=None)) -> None:
    """Rate limit per client + record the 18+ confirmation sent by the site."""
    if (x_adult or "").lower() not in ("1", "yes", "true"):
        raise HTTPException(status_code=403, detail="Please confirm you're 18+ to use Love Guru.")
    ip = request.client.host if request.client else "unknown"
    if settings.trust_proxy:
        forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        ip = forwarded or ip
    if not limiter.allow(ip):
        raise HTTPException(status_code=429, detail="Slow down a bit. Try again in a minute.")


def need(text: str, what: str) -> None:
    if not text.strip():
        raise HTTPException(status_code=422, detail=f"Please add {what} first.")


# ---------------------------------------------------------------- routes
@app.get("/api/health")
def health():
    return {"status": "ok", "engine": engine.name, "version": app.version}


@app.get("/api/personas")
def list_personas():
    return {"personas": personas.public_list()}


@app.post("/api/rizz", dependencies=[Depends(guard)])
def rizz(req: RizzReq):
    need(req.message, "their message")
    return engine.run("rizz", req.model_dump())


@app.post("/api/decode", dependencies=[Depends(guard)])
def decode(req: DecodeReq):
    need(req.conversation, "the conversation")
    return engine.run("decode", req.model_dump())


@app.post("/api/practice", dependencies=[Depends(guard)])
def practice(req: PracticeReq):
    return engine.run("practice", req.model_dump())


@app.post("/api/glowup", dependencies=[Depends(guard)])
def glowup(req: GlowReq):
    need(req.bio, "your bio")
    return engine.run("glowup", req.model_dump())


@app.get("/api/coaches")
def list_coaches():
    return {"coaches": coaches.public_list()}


@app.get("/api/lessons")
def list_lessons():
    return {"lessons": curriculum.public_list()}


@app.get("/api/lessons/{lesson_id}")
def get_lesson(lesson_id: str):
    lesson = curriculum.get(lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="That lesson doesn't exist.")
    return {"lesson": lesson}


@app.post("/api/coach", dependencies=[Depends(guard)])
def coach_chat(req: CoachReq):
    need(req.message, "your question")
    return engine.run("coach", req.model_dump())


@app.post("/api/lesson-check", dependencies=[Depends(guard)])
def lesson_check(req: LessonReq):
    need(req.answer, "your answer")
    if curriculum.get(req.lesson_id) is None:
        raise HTTPException(status_code=404, detail="That lesson doesn't exist.")
    return engine.run("lesson", req.model_dump())


# ---------------------------------------------------------------- frontend (mounted last)
_front = Path(os.getenv("FRONTEND_DIR") or BACKEND_DIR.parent / "frontend")
if (_front / "dist" / "index.html").is_file():
    _front = _front / "dist"
if (_front / "index.html").is_file():
    app.mount("/", StaticFiles(directory=str(_front), html=True), name="frontend")
else:
    @app.get("/", include_in_schema=False)
    def no_frontend():
        return {"message": "Love Guru API is running. Start the site with `npm run dev` in /frontend "
                           "(or `npm run build` there and restart this server to serve it from here).",
                "docs": "/docs"}
