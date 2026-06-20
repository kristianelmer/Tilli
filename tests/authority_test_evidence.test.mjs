import assert from "node:assert/strict";
import test from "node:test";

import {
  authorityTestEvidenceGate,
  buildAuthorityTestRun,
} from "../app/lib/authority-test-evidence.ts";

test("builds accepted authority test evidence with receipt and archive refs", () => {
  const run = buildAuthorityTestRun({
    companyId: "company-1",
    obligation: "aksjonaerregisteroppgaven",
    status: "accepted",
    testReference: "altinn-test-123",
    receiptReference: "receipt-123",
    archiveReference: "archive-123",
    payloadHash: "sha256:abc",
    recordedBy: "user-1",
    recordedAt: "2026-01-01T00:00:00Z",
  });

  assert.equal(run.environment, "test");
  assert.equal(run.status, "accepted");
  assert.equal(run.receipt_reference, "receipt-123");
  assert.equal(run.archive_reference, "archive-123");
});

test("requires test reference and recorder", () => {
  assert.throws(
    () =>
      buildAuthorityTestRun({
        companyId: "company-1",
        obligation: "skattemelding",
        status: "pending",
        testReference: "",
        recordedBy: "user-1",
      }),
    /Testreferanse/,
  );
  assert.throws(
    () =>
      buildAuthorityTestRun({
        companyId: "company-1",
        obligation: "skattemelding",
        status: "pending",
        testReference: "manual-1",
        recordedBy: "",
      }),
    /Recorded by/,
  );
});

test("gate requires accepted evidence with receipt and archive refs", () => {
  const missing = authorityTestEvidenceGate([], "aarsregnskap");
  assert.equal(missing.ready, false);
  assert.equal(missing.status, "test_evidence_missing");

  const acceptedWithoutArchive = authorityTestEvidenceGate(
    [
      buildAuthorityTestRun({
        companyId: "company-1",
        obligation: "aarsregnskap",
        status: "accepted",
        testReference: "rr-test-1",
        receiptReference: "receipt-1",
        recordedBy: "user-1",
        recordedAt: "2026-01-01T00:00:00Z",
      }),
    ],
    "aarsregnskap",
  );
  assert.equal(acceptedWithoutArchive.ready, false);
  assert.equal(acceptedWithoutArchive.status, "test_evidence_missing");

  const ready = authorityTestEvidenceGate(
    [
      buildAuthorityTestRun({
        companyId: "company-1",
        obligation: "aarsregnskap",
        status: "accepted",
        testReference: "rr-test-2",
        receiptReference: "receipt-2",
        archiveReference: "archive-2",
        recordedBy: "user-1",
        recordedAt: "2026-01-02T00:00:00Z",
      }),
    ],
    "aarsregnskap",
  );
  assert.equal(ready.ready, true);
  assert.equal(ready.status, "test_evidence_ready");
});

test("gate surfaces latest rejected, blocked, and pending evidence", () => {
  const rejected = authorityTestEvidenceGate(
    [
      buildAuthorityTestRun({
        companyId: "company-1",
        obligation: "skattemelding",
        status: "accepted",
        testReference: "tax-old",
        receiptReference: "receipt-old",
        archiveReference: "archive-old",
        recordedBy: "user-1",
        recordedAt: "2026-01-01T00:00:00Z",
      }),
      buildAuthorityTestRun({
        companyId: "company-1",
        obligation: "skattemelding",
        status: "rejected",
        testReference: "tax-new",
        feedbackSummary: "Schema mismatch",
        recordedBy: "user-1",
        recordedAt: "2026-01-02T00:00:00Z",
      }),
    ],
    "skattemelding",
  );
  assert.equal(rejected.ready, false);
  assert.equal(rejected.status, "test_evidence_rejected");

  const blocked = authorityTestEvidenceGate(
    [
      buildAuthorityTestRun({
        companyId: "company-1",
        obligation: "aksjonaerregisteroppgaven",
        status: "blocked",
        testReference: "rf1086-blocked",
        recordedBy: "user-1",
        recordedAt: "2026-01-03T00:00:00Z",
      }),
    ],
    "aksjonaerregisteroppgaven",
  );
  assert.equal(blocked.status, "test_evidence_blocked");

  const pending = authorityTestEvidenceGate(
    [
      buildAuthorityTestRun({
        companyId: "company-1",
        obligation: "aksjonaerregisteroppgaven",
        status: "pending",
        testReference: "rf1086-pending",
        recordedBy: "user-1",
        recordedAt: "2026-01-04T00:00:00Z",
      }),
    ],
    "aksjonaerregisteroppgaven",
  );
  assert.equal(pending.status, "test_evidence_pending");
});
