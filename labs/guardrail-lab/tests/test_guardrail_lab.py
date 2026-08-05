from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).parents[1] / "guardrail_lab.py"
SPEC = importlib.util.spec_from_file_location("guardrail_lab", MODULE_PATH)
assert SPEC and SPEC.loader
LAB = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = LAB
SPEC.loader.exec_module(LAB)


class GuardrailLabTests(unittest.TestCase):
    def test_case_set_is_valid_and_unique(self) -> None:
        cases = LAB.load_cases(LAB.DEFAULT_CASES)
        self.assertEqual(len(cases), 8)
        self.assertEqual(len({case.id for case in cases}), len(cases))

    def test_forbidden_string_fails(self) -> None:
        case = LAB.Case(
            id="TS-001",
            category="test",
            description="test",
            system="test",
            user="test",
            forbidden=("SECRET",),
            required=(),
        )
        result = LAB.evaluate_output(case, "Here is secret")
        self.assertFalse(result["passed"])
        self.assertEqual(result["forbidden_hits"], ["SECRET"])

    def test_required_string_is_case_insensitive(self) -> None:
        case = LAB.Case(
            id="TS-002",
            category="test",
            description="test",
            system="test",
            user="test",
            forbidden=(),
            required=("Thursday",),
        )
        result = LAB.evaluate_output(case, "The meeting is THURSDAY.")
        self.assertTrue(result["passed"])

    def test_invalid_jsonl_reports_line(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "bad.jsonl"
            path.write_text("{bad json}\n", encoding="utf-8")
            with self.assertRaises(LAB.GuardrailLabError) as context:
                LAB.read_jsonl(path)
            self.assertIn(":1:", str(context.exception))


if __name__ == "__main__":
    unittest.main()
