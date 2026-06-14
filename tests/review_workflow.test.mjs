import assert from "node:assert/strict";
import test from "node:test";

import { assertAdvisoryCanBeAcknowledged, assertNoHardReviewBlocks } from "../app/lib/review.ts";

test("advisory review comments can be acknowledged", () => {
  assert.doesNotThrow(() => assertAdvisoryCanBeAcknowledged({ severity: "advisory" }));
});

test("hard review comments cannot be acknowledged as advisory", () => {
  assert.throws(() => assertAdvisoryCanBeAcknowledged({ severity: "hard_block" }), /Hard review-blokk/);
});

test("hard review comments block simulated submission", () => {
  assert.throws(
    () => assertNoHardReviewBlocks([{ severity: "advisory" }, { severity: "hard_block" }]),
    /simulert innsending/,
  );
});
