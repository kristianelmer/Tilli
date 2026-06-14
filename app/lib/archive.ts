import type {
  CompanyWorkspaceRow,
  DocumentRow,
  FilingPreviewRow,
  FilingSubmissionRow,
  OpeningBalanceSetupRow,
  OpeningShareholderRow,
} from "./supabase/server";

export type LedgerEntryRow = {
  id: string;
  company_id: string;
  setup_id: string | null;
  income_year: number;
  entry_type: string;
  memo: string;
  lines: unknown[];
  created_by: string;
  created_at: string;
};

export function buildPersistedCompanyArchive(input: {
  company: CompanyWorkspaceRow;
  incomeYear: number;
  setups: OpeningBalanceSetupRow[];
  shareholders: OpeningShareholderRow[];
  ledgerEntries: LedgerEntryRow[];
  documents: DocumentRow[];
  filingPreviews: FilingPreviewRow[];
  filingSubmissions: FilingSubmissionRow[];
}) {
  const receipts = input.filingSubmissions
    .filter((submission) => submission.mode === "simulation" && submission.receipt_id)
    .map((submission) => ({
      filing: submission.filing,
      mode: submission.mode,
      status: submission.status,
      receiptId: submission.receipt_id,
      feedbackDocumentIds: submission.feedback_document_ids,
      calls: submission.calls.map((call) => ({
        endpoint: call.endpoint,
        bodyHash: call.body_hash,
        idempotencyKey: call.idempotency_key,
        status: call.status,
      })),
    }));

  return {
    archiveType: "talli_company_year_archive",
    source: "supabase_persisted_workspace",
    exportedAt: new Date().toISOString(),
    company: input.company,
    incomeYear: input.incomeYear,
    openingBalanceSetups: input.setups,
    shareholders: input.shareholders,
    ledgerEntries: input.ledgerEntries,
    documents: input.documents.map((document) => ({
      id: document.id,
      incomeYear: document.income_year,
      documentType: document.document_type,
      name: document.name,
      linkedTo: document.linked_to,
      status: document.status,
      retentionYears: document.retention_years,
      storageKey: document.storage_key,
      createdAt: document.created_at,
    })),
    filingPreviews: input.filingPreviews.map((preview) => ({
      id: preview.id,
      filing: preview.filing,
      status: preview.status,
      preview: preview.preview,
      hovedskjemaXml: preview.hovedskjema_xml,
      underskjemaXml: preview.underskjema_xml,
      source: preview.source,
      createdAt: preview.created_at,
    })),
    readinessReports: input.filingPreviews.map((preview) => ({
      filing: preview.filing,
      status: preview.status,
      issues: preview.issues,
      source: preview.source,
    })),
    simulatedReceipts: receipts,
    missingDocumentIds: input.documents.filter((document) => document.status.startsWith("missing")).map((document) => document.id),
  };
}
