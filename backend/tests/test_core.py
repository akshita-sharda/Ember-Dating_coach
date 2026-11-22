import unittest

from app.config import Settings, load_settings
from app.core import heuristics, offline, safety, validate
from app.ratelimit import RateLimiter


class ConfigTests(unittest.TestCase):
    def test_provider_resolution(self):
        self.assertEqual(Settings().resolved_provider(), "offline")
        self.assertEqual(Settings(gemini_api_key="k").resolved_provider(), "gemini")
        self.assertEqual(Settings(ollama_model="llama3.2").resolved_provider(), "ollama")
        self.assertEqual(Settings(gemini_api_key="k", provider="offline").resolved_provider(), "offline")

    def test_load_settings_bad_numbers_fall_back(self):
        s = load_settings({"RATE_LIMIT": "abc", "GEMINI_API_KEY": "k", "GEMINI_BASE": "http://x/"})
        self.assertEqual(s.rate_limit, 20)
        self.assertEqual(s.gemini_base, "http://x")


class RateLimiterTests(unittest.TestCase):
    def test_blocks_then_recovers(self):
        now = [0.0]
        rl = RateLimiter(2, 10, clock=lambda: now[0])
        self.assertTrue(rl.allow("a")); self.assertTrue(rl.allow("a"))
        self.assertFalse(rl.allow("a"))
        self.assertTrue(rl.allow("b"))
        now[0] = 10.0
        self.assertTrue(rl.allow("a"))


class ValidateTests(unittest.TestCase):
    def test_parse_json_variants(self):
        self.assertEqual(validate.parse_json('{"a":1}'), {"a": 1})
        self.assertEqual(validate.parse_json('```json\n{"a":1}\n```'), {"a": 1})
        self.assertEqual(validate.parse_json('Sure! here: {"a": 1} hope that helps'), {"a": 1})
        for bad in ("", "no json", "[1,2]", "{broken"):
            with self.assertRaises(ValueError):
                validate.parse_json(bad)

    def test_clean_rizz_bounds(self):
        raw = {"replies": ["plain", {"text": "x" * 900, "rizz": "150"}, {"text": ""}, {"text": "d"}, {"text": "e"}]}
        out = validate.clean_rizz(raw)
        self.assertEqual(len(out["replies"]), 3)           # blanks skipped, then capped at 3
        self.assertLessEqual(len(out["replies"][1]["text"]), 400)
        self.assertEqual(out["replies"][1]["rizz"], 100)
        with self.assertRaises(ValueError):
            validate.clean_rizz({"replies": []})

    def test_clean_decode_label_fallback(self):
        out = validate.clean_decode({"verdict": "v", "interest": 85, "label": "weird"})
        self.assertEqual(out["label"], "locked in")
        with self.assertRaises(ValueError):
            validate.clean_decode({"interest": 10})

    def test_clean_practice_and_glowup(self):
        self.assertEqual(validate.clean_practice({"reply": "hi", "mood": "??"})["mood"], "neutral")
        with self.assertRaises(ValueError):
            validate.clean_practice({})
        with self.assertRaises(ValueError):
            validate.clean_glowup({"rewrites": []})


class HeuristicTests(unittest.TestCase):
    def test_good_beats_bad(self):
        good = heuristics.rizz_breakdown("that climbing trip in Manali sounds wild, what was the scariest part?",
                                         "I just got back from a climbing trip in Manali")["score"]
        bad = heuristics.rizz_breakdown("hey!!! why are you ignoring me, please reply")["score"]
        self.assertGreater(good, bad + 30)

    def test_pressure_is_crushed(self):
        self.assertLess(heuristics.rizz_breakdown("send nudes")["score"], 30)

    def test_profile_score_prefers_specifics(self):
        weak = heuristics.profile_score("Foodie. Wanderlust. Partner in crime wanted.")
        strong = heuristics.profile_score("Climbing, photography and filter coffee in Manali. "
                                          "Ask me about my beagle Biscuit. Comfort movie?")
        self.assertGreater(strong, weak)


class SafetyTests(unittest.TestCase):
    def test_levels(self):
        self.assertEqual(safety.check(any_text="I want to die").level, "crisis")
        self.assertEqual(safety.check(any_text="stop texting me", their_text="stop texting me").level, "boundary")
        self.assertEqual(safety.check(my_text="send pics").level, "pressure")
        self.assertEqual(safety.check(any_text="wanna get coffee?", their_text="wanna get coffee?").level, "ok")

    def test_crisis_beats_boundary(self):
        self.assertEqual(safety.check(any_text="leave me alone, I want to die", their_text="leave me alone").level, "crisis")


class OfflineTests(unittest.TestCase):
    STYLE = {"vibe": "chill", "emoji": "some", "length": "short", "slang": 1, "language": "english"}

    def test_rizz_all_heats_and_languages(self):
        for heat in (1, 2, 3):
            for lang in ("english", "hinglish"):
                out = offline.rizz({"message": "just got back from a trek in Manali", "heat": heat,
                                    "style": {**self.STYLE, "language": lang}})
                self.assertEqual(len(out["replies"]), 3)
                self.assertTrue(all("manali" in r["text"].lower() for r in out["replies"]))

    def test_decode_interest_ordering(self):
        into = "Me: what did you get up to\nThem: omg so much! went trekking, have you ever been? haha\nMe: not really\nThem: you should come next time!! where do you usually go?"
        cold = "Me: hey how was your day, anything fun planned for the weekend?\nThem: fine\nMe: nice, what about sunday?\nThem: busy\nMe: oh ok\nThem: yeah"
        a = offline.decode({"conversation": into})["interest"]
        b = offline.decode({"conversation": cold})["interest"]
        self.assertGreater(a, b + 25)

    def test_decode_with_no_them_lines(self):
        out = offline.decode({"conversation": "Me: hello\nMe: anyone there"})
        self.assertIn("Paste", out["verdict"])

    def test_practice_start_and_reply(self):
        start = offline.practice({"persona_id": "kabir", "message": "", "history": []})
        self.assertIn("match", start["reply"])
        good = offline.practice({"persona_id": "maya", "message": "I do hike, mostly weekend treks near Dharamshala. What about you?",
                                 "history": [{"role": "them", "text": "do you hike?"}]})
        bad = offline.practice({"persona_id": "kabir", "message": "hi", "history": []})
        self.assertEqual(bad["mood"], "bored")
        self.assertNotEqual(good["mood"], "bored")

    def test_practice_unknown_persona_falls_back(self):
        self.assertTrue(offline.practice({"persona_id": "nope", "message": "", "history": []})["reply"])

    def test_glowup_shapes(self):
        out = offline.glowup({"bio": "Foodie and wanderlust. Partner in crime wanted."})
        self.assertEqual(len(out["rewrites"]), 2)
        self.assertTrue(out["fixes"])

    def test_boundary_responses_never_persuade(self):
        r = offline.boundary_response("rizz")
        self.assertTrue(all(x["vibe"] == "graceful exit" for x in r["replies"]))
        self.assertLess(offline.boundary_response("decode")["interest"], 10)


if __name__ == "__main__":
    unittest.main()
