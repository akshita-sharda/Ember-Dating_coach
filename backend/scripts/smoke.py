"""Hit every endpoint of a RUNNING server and check the shapes. Usage:

    python scripts/smoke.py            # default http://127.0.0.1:8000
    python scripts/smoke.py http://127.0.0.1:8000
"""
import json
import sys
import urllib.error
import urllib.request

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000").rstrip("/")
failures = []


def call(path, body=None, adult=True):
    headers = {"Content-Type": "application/json"}
    if adult:
        headers["X-Adult"] = "yes"
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None,
                                 headers=headers, method="POST" if body is not None else "GET")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def check(name, ok, extra=""):
    print(("PASS " if ok else "FAIL ") + name + (f"  {extra}" if extra else ""))
    if not ok:
        failures.append(name)


s, d = call("/api/health")
check("health", s == 200 and d.get("status") == "ok", f"engine={d.get('engine')}")
s, d = call("/api/personas")
check("personas", s == 200 and len(d["personas"]) >= 3)
s, d = call("/api/rizz", {"message": "just got back from a trek in Manali!", "heat": 2})
check("rizz", s == 200 and len(d["replies"]) == 3 and all(0 <= r["rizz"] <= 100 for r in d["replies"]), d.get("notice") or "")
s, d = call("/api/decode", {"conversation": "Me: hey\nThem: hey! how was your day?\nMe: good, you?\nThem: great, went trekking haha"})
check("decode", s == 200 and 0 <= d["interest"] <= 100 and d["verdict"])
s, d = call("/api/practice", {"persona_id": "zoya", "message": "", "history": []})
check("practice start", s == 200 and d["reply"])
s, d = call("/api/practice", {"persona_id": "zoya", "message": "ok your chai order is a crime, defend yourself", "history": [{"role": "them", "text": d["reply"]}]})
check("practice turn", s == 200 and d["reply"] and d["coach"]["note"])
s, d = call("/api/glowup", {"bio": "Climbing, photography and filter coffee. Ask me about my beagle.", "platform": "Hinge"})
check("glowup", s == 200 and len(d["rewrites"]) == 2)
s, d = call("/api/coaches")
check("coaches", s == 200 and {c["id"] for c in d["coaches"]} == {"sunny", "sage", "rio"})
s, d = call("/api/lessons")
check("lessons list", s == 200 and len(d["lessons"]) >= 8)
s, d = call("/api/lessons/openers")
check("lesson detail", s == 200 and d["lesson"]["cards"])
s, _ = call("/api/lessons/nope")
check("unknown lesson 404", s == 404)
s, d = call("/api/coach", {"message": "what should I talk about on a first date?", "coach": "rio", "profile": {"age": "25-34", "goal": "relationship", "struggles": ["nerves"]}})
check("coach chat", s == 200 and d["reply"] and isinstance(d["tips"], list), d.get("notice") or "")
s, d = call("/api/lesson-check", {"lesson_id": "openers", "answer": "Weekend trekker? Best trail you have done?", "coach": "sage"})
check("lesson check", s == 200 and 0 <= d["score"] <= 100 and d["verdict"])
s, d = call("/api/coach", {"message": "i want to die", "coach": "sunny"})
check("coach crisis handled", s == 200 and d.get("crisis") is True)
s, _ = call("/api/coach", {"message": "hi"}, adult=False)
check("coach needs 18+", s == 403)
s, d = call("/api/rizz", {"message": "i want to die"})
check("crisis is handled, not coached", s == 200 and d.get("crisis") is True)
s, d = call("/api/rizz", {"message": "please stop texting me"})
check("boundary -> graceful exit", s == 200 and all(r["vibe"] == "graceful exit" for r in d["replies"]))
s, _ = call("/api/rizz", {"message": "hi"}, adult=False)
check("18+ gate enforced", s == 403)
s, _ = call("/api/rizz", {"message": "   "})
check("blank input rejected", s == 422)
s, _ = call("/api/rizz", {"message": "x" * 5000})
check("oversized input rejected", s == 422)

print("\nALL PASSED" if not failures else f"\n{len(failures)} FAILED: {failures}")
sys.exit(1 if failures else 0)
