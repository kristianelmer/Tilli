from __future__ import annotations

import json
import subprocess
import unittest
from pathlib import Path

from holding_core.validation import run_annual_compliance_validation


ROOT = Path(__file__).resolve().parents[1]
FIXTURE_DIR = ROOT / "tests" / "fixtures" / "annual_validation"


class AnnualComplianceValidationTest(unittest.TestCase):
    def test_annual_compliance_validation_classifies_public_synthetic_cases(self) -> None:
        report = run_annual_compliance_validation(
            [
                FIXTURE_DIR / "simple_holding_pass.json",
                FIXTURE_DIR / "simple_holding_mismatch.json",
                FIXTURE_DIR / "simple_holding_blocked.json",
                FIXTURE_DIR / "unsupported_group_contribution.json",
            ]
        )

        outcomes = {case.case_id: case.outcome for case in report.cases}

        self.assertEqual(report.filing, "årsregnskap + skattemelding for AS")
        self.assertIn("docs/filing/annual-accounts-authority-map.md", report.authority_maps)
        self.assertIn("docs/filing/company-tax-return-authority-map.md", report.authority_maps)
        self.assertEqual(outcomes["simple_holding_pass"], "pass")
        self.assertEqual(outcomes["simple_holding_mismatch"], "mismatch")
        self.assertEqual(outcomes["simple_holding_blocked"], "blocked")
        self.assertEqual(outcomes["unsupported_group_contribution"], "unsupported")
        self.assertTrue(any("production Altinn submission" in limitation for limitation in report.limitations))

    def test_cli_annual_public_data_validation_json(self) -> None:
        result = subprocess.run(
            [
                "python3",
                "-m",
                "holding_cli.main",
                "validate-annual-public-data",
                "--case",
                str(FIXTURE_DIR / "simple_holding_pass.json"),
                "--case",
                str(FIXTURE_DIR / "simple_holding_mismatch.json"),
                "--json",
            ],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

        self.assertEqual(result.returncode, 1)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["filing"], "årsregnskap + skattemelding for AS")
        self.assertEqual([case["outcome"] for case in payload["cases"]], ["pass", "mismatch"])


if __name__ == "__main__":
    unittest.main()
