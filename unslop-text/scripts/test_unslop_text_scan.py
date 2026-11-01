#!/usr/bin/env python3
"""Tests for unslop_text_scan.py. Standard library only:

    python scripts/test_unslop_text_scan.py

Each rule added on 2026-11-01 gets a line it must flag and a line it must leave alone, so
a pattern that stops matching, or starts matching ordinary prose, turns a test red. The
must-flag half is what proves a test can fail: comment out a rule's pattern and its test
fails. Not run in the library's CI (no Python step there); run it after any rule change.
"""
import importlib.util, os, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("scan", os.path.join(HERE, "unslop_text_scan.py"))
scan = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scan)


def run(text):
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, "t.md")
        with open(p, "w", encoding="utf-8") as fh:
            fh.write(text)
        findings, _ = scan.scan(p, "low")
    return findings


def rules(text):
    return {f["rule"] for f in run(text)}


# rule id -> (lines it must flag, lines it must leave alone)
CASES = {
    "not-just-x-y": (
        ["This doesn't mean every quote is equal. It means the cheapest one is not always best."],
        ["This means the lease ends in March."]),
    "staged-runup": (
        ["Here's what you need to know about the new lease.",
         "Let's break this down.",
         "Without further ado, the figures.",
         "The thing is, nobody read the notice.",
         "Is it worth it? Honestly? It depends on the block."],
        ["The thing is broken and needs replacing.",
         "I honestly think the budget is too low."]),
    "closer-line": (
        ["Arrears fell by a third. Let that sink in.",
         "That's the real win.",
         "The message was clear: pay on time."],
        ["The message from the board arrived on Tuesday."]),
    "inflated-significance": (
        ["The new boiler marks a pivotal moment for the building.",
         "Despite these challenges, the estate continues to thrive.",
         "The future looks bright for the residents' association.",
         "The roof works set the stage for a wider refurbishment."],
        ["The new boiler was fitted on 3 March and cost 4,200 pounds."]),
    "knowledge-gap": (
        ["While specific details are limited, the firm was likely founded in the 1990s.",
         "The landlord keeps a low profile."],
        ["The founding date is not in the land registry title."]),
    "deep-saying": (
        ["The real question is whether the lift can be repaired.",
         "At its core, this is a funding problem."],
        ["The question is whether the lift can be repaired."]),
    "strawman-defence": (
        ["To be clear, this isn't about cost.",
         "Don't get me wrong, the old system worked."],
        ["The notice was clear and on time."]),
    "ing-rider": (
        ["The block was re-roofed in 2019, reflecting the board's commitment to maintenance.",
         "The fund grew by ten per cent, highlighting the importance of planning."],
        ["The block was re-roofed in 2019 after the surveyor's report."]),
    "copula-avoidance": (
        ["The courtyard serves as a meeting point.",
         "The building boasts three lifts."],
        ["The courtyard is a meeting point.",
         "She serves on the committee."]),
    "borrowed-authority": (
        ["Experts agree that cladding remediation takes years.",
         "Studies show that tenants prefer email."],
        ["The 2024 survey of our tenants found that most prefer email."]),
    "title-case-heading": (
        ["## Service Charge And Reserve Fund Overview"],
        ["## Service charge and reserve fund overview",
         "## The plan for next year"]),
    "hype-marketing": (
        ["The flat is nestled in the heart of the village.",
         "A stunning two-bedroom apartment."],
        ["The flat is in the centre of the village."]),
}


class NewRules(unittest.TestCase):
    def test_each_rule_flags_its_tell(self):
        for rid, (bad, _) in CASES.items():
            for line in bad:
                with self.subTest(rule=rid, line=line):
                    self.assertIn(rid, rules(line + "\n"))

    def test_each_rule_leaves_plain_prose_alone(self):
        for rid, (_, good) in CASES.items():
            for line in good:
                with self.subTest(rule=rid, line=line):
                    self.assertNotIn(rid, rules(line + "\n"))

    def test_every_new_rule_has_a_case(self):
        new = {"staged-runup", "closer-line", "inflated-significance", "knowledge-gap",
               "deep-saying", "strawman-defence", "ing-rider", "copula-avoidance",
               "borrowed-authority", "title-case-heading"}
        ids = {r["id"] for r in scan.RULES}
        self.assertTrue(new <= ids, new - ids)
        self.assertTrue(new <= set(CASES), new - set(CASES))

    def test_rule_ids_are_unique(self):
        ids = [r["id"] for r in scan.RULES]
        self.assertEqual(len(ids), len(set(ids)))


class Behaviour(unittest.TestCase):
    def test_curly_apostrophe_is_matched_like_a_straight_one(self):
        self.assertIn("staged-runup", rules("Here’s what you need to know.\n"))

    def test_quoted_and_code_spans_are_still_skipped(self):
        self.assertEqual(rules('He wrote "let that sink in" on the board.\n'), set())
        self.assertEqual(rules("The phrase `at its core` is a cliche.\n"), set())
        self.assertEqual(rules("> Experts agree that it works.\n"), set())

    def test_unslop_ignore_still_wins(self):
        self.assertEqual(rules("This letter serves as notice. unslop-ignore\n"), set())

    def test_clean_prose_has_no_findings(self):
        self.assertEqual(run("The lift failed on Monday. An engineer is booked for Thursday.\n"), [])

    def test_cluster_needs_two_different_rules_in_one_paragraph(self):
        text = ("Experts agree the roof matters. At its core, it is about water.\n"
                "\n"
                "The gutters were cleared in May.\n"
                "\n"
                "Studies show that people like gardens. Studies show that people like lifts.\n")
        cl = scan.clusters(run(text))
        self.assertEqual(len(cl), 1, cl)
        self.assertEqual(cl[0]["line"], 1)
        self.assertEqual(cl[0]["rules"], ["borrowed-authority", "deep-saying"])

    def test_cluster_spans_lines_but_not_blank_lines(self):
        text = "Experts agree the roof matters.\nAt its core, it is about water.\n"
        self.assertEqual(scan.clusters(run(text))[0]["line"], 1)
        split = "Experts agree the roof matters.\n\nAt its core, it is about water.\n"
        self.assertEqual(scan.clusters(run(split)), [])


if __name__ == "__main__":
    unittest.main(verbosity=1)
