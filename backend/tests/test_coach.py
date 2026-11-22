import unittest

from app.core import coaches, coaching, curriculum, kb
from app.core.engine import Engine


class CoachTests(unittest.TestCase):
    def setUp(self):
        self.e = Engine(None)

    def test_content_integrity(self):
        self.assertEqual(set(coaches.COACHES), {"sunny", "sage", "rio"})
        ids = [l["id"] for l in curriculum.LESSONS]
        self.assertEqual(len(ids), len(set(ids)))
        for l in curriculum.LESSONS:
            self.assertTrue(l["cards"] and l["do"] and l["dont"] and l["practice"]["keywords"])
            self.assertTrue(coaching._model_answer(l))

    def test_kb_matches_and_falls_back(self):
        self.assertEqual(kb.match("I get so nervous before dates")["id"], "nerves")
        self.assertEqual(kb.match("how do I ask her out")["id"], "ask-out")
        self.assertEqual(kb.match("zzz qqq")["id"], "general")

    def test_offline_coach_voices_differ_but_advice_same(self):
        outs = {c: self.e.run("coach", {"message": "what do I talk about on a first date", "coach": c})
                for c in coaches.COACHES}
        replies = {o["reply"] for o in outs.values()}
        self.assertEqual(len(replies), 3)
        self.assertEqual(len({tuple(o["tips"]) for o in outs.values()}), 1)
        for o in outs.values():
            self.assertFalse(o["crisis"])
            self.assertTrue(o["followups"])

    def test_coach_crisis_short_circuits(self):
        out = self.e.run("coach", {"message": "i want to kill myself", "coach": "rio"})
        self.assertTrue(out["crisis"])

    def test_more_crisis_phrasings(self):
        for t in ["i don't want to be alive anymore", "i do not want to live", "i wanna die"]:
            self.assertTrue(self.e.run("coach", {"message": t, "coach": "sunny"})["crisis"], t)
        self.assertFalse(self.e.run("coach", {"message": "I want a date to be alive and fun", "coach": "sunny"})["crisis"])

    def test_lesson_scoring_rewards_good_answer(self):
        good = self.e.run("lesson", {"lesson_id": "openers", "coach": "sage",
                                      "answer": "Weekend trekker? What's the best trail you've done, and favourite snack?"})
        bad = self.e.run("lesson", {"lesson_id": "openers", "coach": "sage", "answer": "hey"})
        self.assertGreater(good["score"], bad["score"] + 20)
        self.assertTrue(good["better_version"])
        self.assertTrue(bad["improve"])

    def test_lesson_pressure_penalised(self):
        o = self.e.run("lesson", {"lesson_id": "avoid", "answer": "you have to make time for me this week"})
        self.assertLess(o["score"], 55)

    def test_clean_coach_requires_reply(self):
        with self.assertRaises(ValueError):
            coaching.clean_coach({"tips": ["x"]})
        out = coaching.clean_coach({"reply": " hi ", "tips": ["a", "", "b", "c", "d"]})
        self.assertEqual(out["tips"], ["a", "b", "c"])

    def test_profile_block(self):
        b = coaching.profile_block({"age": "25-34", "goal": "relationship", "struggles": ["nerves", "bogus"]})
        self.assertIn("25-34", b); self.assertIn("nerves", b); self.assertNotIn("bogus", b)

    def test_ai_path_with_fake_provider(self):
        class P:
            name = "fake"
            def generate_json(self, system, messages):
                assert "Sage" in system and "ABOUT THE USER" in system
                return '{"reply":"Breathe first.","tips":["one"],"try_saying":[],"followups":[]}'
        out = Engine(P()).run("coach", {"message": "help", "coach": "sage", "profile": {"age": "18-24"}})
        self.assertEqual(out["engine"], "fake"); self.assertEqual(out["reply"], "Breathe first.")


if __name__ == "__main__":
    unittest.main()
