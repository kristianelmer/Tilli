import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import type { FilingPreviewRow } from "./supabase/server";

export type Rf1086SubmissionResult = {
  filing: string;
  company_id: string;
  income_year: number;
  status:
    | "ready"
    | "authority_confirmed"
    | "preview_confirmed"
    | "submitting"
    | "submitted"
    | "feedback_ready"
    | "receipt_stored"
    | "failed_retryable"
    | "failed_blocked";
  authority_confirmed_by: string | null;
  authority_confirmed_at: string | null;
  preview_confirmed_by: string | null;
  preview_confirmed_at: string | null;
  calls: {
    endpoint: string;
    body_hash: string;
    idempotency_key: string;
    status: "prepared" | "sent" | "accepted" | "failed";
    created_at: string;
  }[];
  receipt_id: string | null;
  feedback_document_ids: string[];
  failure_code: string | null;
  failure_message: string | null;
};

export type Rf1086SubmissionConfirmations = {
  authorityConfirmed: boolean;
  previewConfirmed: boolean;
};

export type Rf1086SubmissionAdapterMode = "simulation" | "production";
export type Rf1086SubmissionAdapterRequest = {
  mode: Rf1086SubmissionAdapterMode;
  preview: FilingPreviewRow;
  userId: string;
  confirmations: Rf1086SubmissionConfirmations;
};

export class Rf1086ProductionAdapterDisabledError extends Error {
  readonly code = "rf1086_production_adapter_disabled";

  constructor() {
    super("RF-1086 produksjonsadapter er deaktivert uten eksplisitt miljøgate.");
    this.name = "Rf1086ProductionAdapterDisabledError";
  }
}

export function assertRf1086SimulationConfirmations(confirmations: Rf1086SubmissionConfirmations) {
  if (!confirmations.authorityConfirmed) {
    throw new Error("Bekreft at du har rett til å sende inn på vegne av selskapet.");
  }
  if (!confirmations.previewConfirmed) {
    throw new Error("Bekreft at endelig forhåndsvisning er kontrollert.");
  }
}

export function rf1086PayloadHash(preview: FilingPreviewRow) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        filing: preview.filing,
        company_id: preview.company_id,
        income_year: preview.income_year,
        hovedskjema_xml: preview.hovedskjema_xml,
        underskjema_xml: preview.underskjema_xml,
      }),
    )
    .digest("hex");
}

export function rf1086SubmissionIdempotencyKey(preview: FilingPreviewRow) {
  return `rf1086:${preview.company_id}:${preview.income_year}:${rf1086PayloadHash(preview).slice(0, 16)}`;
}

export function productionRf1086AdapterEnabled() {
  return process.env.TALLI_ENABLE_RF1086_PRODUCTION_ADAPTER === "true";
}

export function runRf1086SubmissionAdapter(request: Rf1086SubmissionAdapterRequest): Rf1086SubmissionResult {
  if (request.mode === "production" && !productionRf1086AdapterEnabled()) {
    throw new Rf1086ProductionAdapterDisabledError();
  }
  return simulateRf1086SubmissionWithPython(request.preview, request.userId, request.confirmations);
}

export function simulateRf1086SubmissionWithPython(
  preview: FilingPreviewRow,
  userId: string,
  confirmations: Rf1086SubmissionConfirmations,
): Rf1086SubmissionResult {
  assertRf1086SimulationConfirmations(confirmations);
  if (preview.status !== "ready") {
    throw new Error("RF-1086 må være klar før simulert innsending kan arkiveres.");
  }
  if (!preview.hovedskjema_xml) {
    throw new Error("RF-1086 forhåndsvisning mangler hovedskjema XML.");
  }

  const python = process.env.TALLI_PYTHON_BIN || "python3";
  const result = spawnSync(python, ["-m", "holding_cli.main", "simulate-rf1086-submission", "--stdin-json"], {
    input: JSON.stringify({
      preview_id: preview.id,
      company_id: preview.company_id,
      income_year: preview.income_year,
      filing: preview.filing,
      hovedskjema_xml: preview.hovedskjema_xml,
      underskjema_xml: preview.underskjema_xml,
      user_id: userId,
      authority_confirmed: confirmations.authorityConfirmed,
      preview_confirmed: confirmations.previewConfirmed,
    }),
    encoding: "utf8",
    env: process.env,
  });
  if (result.error) {
    throw result.error;
  }
  const stdout = result.stdout.trim();
  if (!stdout) {
    throw new Error(result.stderr.trim() || "RF-1086 submission simulation produced no output.");
  }
  const parsed = JSON.parse(stdout) as Rf1086SubmissionResult;
  if (result.status !== 0 || parsed.status === "failed_blocked") {
    throw new Error(parsed.failure_message || result.stderr.trim() || "RF-1086 submission simulation failed.");
  }
  return parsed;
}
