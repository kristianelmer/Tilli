import assert from "node:assert/strict";
import test from "node:test";

import {
  assertRestoreIntegrity,
  buildBackupManifest,
  launchCriticalTables,
  productionRestoreLaunchGate,
  restoreCompanyYearArchive,
} from "../app/lib/backup-restore.ts";

function archiveFixture(overrides = {}) {
  return {
    archiveType: "talli_company_year_archive",
    company: { id: "source-company", org_number: "314259521", name: "Demo Holding AS" },
    incomeYear: 2025,
    ledgerEntries: [{ id: "ledger-id", entry_type: "opening_balance" }],
    taxSettlements: [{ id: "tax-action-id", ledgerEntryId: "ledger-id" }],
    documents: [
      {
        id: "document-id",
        status: "stored",
        retentionYears: 5,
        storageKey: "source-company/2025/document-id.pdf",
      },
      {
        id: "missing-document-id",
        status: "missing_accepted_warning",
        retentionYears: 5,
        storageKey: null,
      },
    ],
    filingPreviews: [{ id: "preview-id", filing: "aksjonærregisteroppgaven" }],
    rf1086Submissions: [{ id: "submission-id", receiptId: "sim-rf1086" }],
    reviewComments: [{ id: "review-id", severity: "advisory" }],
    billingAccounts: [{ company_id: "source-company", filing_package_paid: true }],
    auditEvents: [{ id: "audit-id", action: "rf1086_simulated_receipt_archived" }],
    ...overrides,
  };
}

test("backup manifest identifies launch-critical tables and object references", () => {
  const manifest = buildBackupManifest(archiveFixture());

  assert.ok(manifest.launchCriticalTables.includes("annual_data"));
  assert.ok(manifest.launchCriticalTables.includes("filing_submissions"));
  assert.ok(manifest.launchCriticalTables.includes("audit_events"));
  assert.deepEqual(manifest.objectReferences, [
    {
      documentId: "document-id",
      storageKey: "source-company/2025/document-id.pdf",
      status: "stored",
      retentionYears: 5,
    },
  ]);
  assert.equal(manifest.counts.auditEvents, 1);
});

test("restore fixture preserves launch-critical accounting state in isolated workspace", () => {
  const restored = restoreCompanyYearArchive(archiveFixture(), { targetCompanyId: "restored-company" });
  const integrity = assertRestoreIntegrity(restored);

  assert.equal(restored.sourceCompanyId, "source-company");
  assert.equal(restored.targetCompanyId, "restored-company");
  assert.equal(restored.restored.company.id, "restored-company");
  assert.equal(restored.restored.ledgerEntries[0].id, "ledger-id");
  assert.equal(restored.restored.filingSubmissions[0].receiptId, "sim-rf1086");
  assert.equal(restored.restored.reviewComments[0].id, "review-id");
  assert.equal(restored.restored.billingAccounts[0].filing_package_paid, true);
  assert.equal(restored.restored.auditEvents[0].action, "rf1086_simulated_receipt_archived");
  assert.equal(integrity.ok, true);
});

test("restore integrity reports missing object warning and missing critical rows", () => {
  const restored = restoreCompanyYearArchive(archiveFixture({ ledgerEntries: [] }), { targetCompanyId: "restored-company" });
  const integrity = assertRestoreIntegrity(restored);

  assert.equal(integrity.ok, false);
  assert.ok(integrity.failures.includes("ledger_entries_missing"));
  assert.deepEqual(integrity.warnings, [
    {
      code: "document_object_missing_or_marked_missing",
      documentId: "missing-document-id",
      message: "Document metadata restored, but object storage content must be rehydrated or accepted as missing.",
    },
  ]);
});

test("production restore launch gate requires recent passing restore test", () => {
  const now = new Date("2026-06-16T12:00:00Z");

  assert.equal(productionRestoreLaunchGate([], now).status, "restore_test_missing");
  assert.equal(
    productionRestoreLaunchGate([{ testedAt: "2026-04-01T00:00:00Z", status: "passed", target: "restore-db" }], now).status,
    "restore_test_stale",
  );
  assert.equal(
    productionRestoreLaunchGate([{ testedAt: "2026-06-10T00:00:00Z", status: "passed", target: "restore-db" }], now).allowed,
    true,
  );
});
