import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  preProductionDirectFilingCopy,
  requiredNonAffiliationCopy,
  validateLaunchCopy,
} from "../app/lib/launch-copy.ts";

test("requires non-affiliation and pre-production gate language in public app copy", () => {
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /requiredNonAffiliationCopy/);
  assert.match(page, /preProductionDirectFilingCopy/);

  const result = validateLaunchCopy(`${requiredNonAffiliationCopy}\n${preProductionDirectFilingCopy}`);

  assert.equal(result.hasRequiredNonAffiliation, true);
  assert.equal(result.hasPreProductionGate, true);
  assert.deepEqual(result.violations, []);
  assert.equal(result.approved, true);
});

test("rejects launch claims that outrun authority evidence", () => {
  const result = validateLaunchCopy(
    `${requiredNonAffiliationCopy}\n${preProductionDirectFilingCopy}\nGodkjent av Skatteetaten og ferdig innsendt.`,
  );

  assert.equal(result.approved, false);
  assert.ok(result.violations.length >= 2);
});
