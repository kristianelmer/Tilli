import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCancellationEvidence,
  cancellationStatusLabel,
  nextCancellationStatus,
  retentionClasses,
} from "../app/lib/cancellation.ts";

test("requires archive export before cancellation can move into retention hold", () => {
  assert.equal(nextCancellationStatus({}), "export_required");
  assert.equal(nextCancellationStatus({ archiveExportedAt: "2026-06-17T10:00:00.000Z" }), "retention_hold");
});

test("keeps final deletion behind legal review and explicit deletion state", () => {
  assert.equal(nextCancellationStatus({ archiveExportedAt: "2026-06-17T10:00:00.000Z", legalReviewApproved: true }), "deletion_approved");
  assert.equal(nextCancellationStatus({ deletedAt: "2026-06-17T11:00:00.000Z" }), "deleted");
  assert.equal(cancellationStatusLabel("retention_hold"), "Retention hold");
});

test("builds archive and retention evidence for launch-critical records", () => {
  const evidence = buildCancellationEvidence({
    companyId: "company-id",
    incomeYear: 2025,
    archiveExportedAt: "2026-06-17T10:00:00.000Z",
    missingDocumentIds: ["document-id"],
  });

  assert.equal(evidence.archiveDownloadPath, "/archive/company-id/2025/download");
  assert.equal(evidence.archiveIncomeYear, 2025);
  assert.equal(evidence.legalReviewRequired, true);
  assert.deepEqual(evidence.missingDocumentIds, ["document-id"]);
  assert.ok(retentionClasses.includes("accounting_documents"));
  assert.ok(retentionClasses.includes("filing_payloads_feedback_receipts"));
  assert.ok(retentionClasses.includes("audit_security_logs"));
});
