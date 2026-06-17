export type CancellationStatus = "export_required" | "retention_hold" | "deletion_approved" | "deleted";

export type CancellationEvidence = {
  archiveExportedAt?: string | null;
  archiveIncomeYear?: number | null;
  archiveDownloadPath?: string | null;
  retentionClasses?: string[];
  missingDocumentIds?: string[];
  legalReviewRequired?: boolean;
};

export type CompanyCancellationRow = {
  id: string;
  company_id: string;
  status: CancellationStatus;
  reason: string;
  evidence: CancellationEvidence;
  requested_by: string;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  deleted_by: string | null;
  deleted_at: string | null;
  updated_at: string;
};

export const retentionClasses = [
  "accounting_documents",
  "ledger_and_holding_actions",
  "filing_payloads_feedback_receipts",
  "billing_refund_records",
  "audit_security_logs",
];

export function cancellationStatusLabel(status: CancellationStatus) {
  switch (status) {
    case "export_required":
      return "Arkiv må eksporteres";
    case "retention_hold":
      return "Retention hold";
    case "deletion_approved":
      return "Sletting godkjent";
    case "deleted":
      return "Slettet";
  }
}

export function nextCancellationStatus(input: {
  archiveExportedAt?: string | null;
  legalReviewApproved?: boolean;
  deletedAt?: string | null;
}): CancellationStatus {
  if (input.deletedAt) {
    return "deleted";
  }
  if (input.legalReviewApproved) {
    return "deletion_approved";
  }
  if (input.archiveExportedAt) {
    return "retention_hold";
  }
  return "export_required";
}

export function buildCancellationEvidence(input: {
  companyId: string;
  incomeYear: number;
  archiveExportedAt?: string | null;
  missingDocumentIds?: string[];
}): CancellationEvidence {
  return {
    archiveExportedAt: input.archiveExportedAt ?? null,
    archiveIncomeYear: input.incomeYear,
    archiveDownloadPath: `/archive/${input.companyId}/${input.incomeYear}/download`,
    retentionClasses,
    missingDocumentIds: input.missingDocumentIds ?? [],
    legalReviewRequired: true,
  };
}
