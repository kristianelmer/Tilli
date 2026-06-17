import assert from "node:assert/strict";
import test from "node:test";

import { buildFilingReleaseGates } from "../app/lib/filing-release-gate.ts";

const readyBilling = {
  company_id: "company-id",
  pricing_plan: "founder",
  monthly_nok: 29,
  filing_package_nok: 299,
  founder_cohort_number: 1,
  subscription_active: true,
  filing_package_paid: true,
  supported_case: true,
  refund_eligible: false,
  refund_completed: false,
  no_charge_reason: null,
};

const readyPermissions = [
  { obligation: "aksjonaerregisteroppgaven", confirmed_at: "2026-01-01T00:00:00.000Z", production_enabled: true },
  { obligation: "skattemelding", confirmed_at: "2026-01-01T00:00:00.000Z", production_enabled: true },
  { obligation: "aarsregnskap", confirmed_at: "2026-01-01T00:00:00.000Z", production_enabled: true },
];

test("keeps all production filing gates disabled without authority, billing, step-up, and human review", () => {
  const gates = buildFilingReleaseGates({
    authorityPermissions: [],
    billingAccount: null,
    filingReadyByObligation: {},
    stepUpContext: { actorId: "owner", mfaVerifiedAt: null },
    humanReviewApprovedByObligation: {},
    now: new Date("2026-06-17T10:00:00.000Z"),
  });

  assert.equal(gates.length, 3);
  assert.ok(gates.every((gate) => gate.status === "production_disabled"));
  assert.ok(gates.every((gate) => gate.disabledReasons.includes("missing_authority_confirmation")));
  assert.ok(gates.every((gate) => gate.disabledReasons.includes("billing_account_missing")));
  assert.ok(gates.every((gate) => gate.disabledReasons.includes("human_release_review_missing")));
  assert.match(gates[0].publicCopyRestriction, /forhåndsvisning\/simulering/);
});

test("marks production ready only when every release gate passes", () => {
  const gates = buildFilingReleaseGates({
    authorityPermissions: readyPermissions,
    billingAccount: readyBilling,
    filingReadyByObligation: {
      aksjonaerregisteroppgaven: true,
      skattemelding: true,
      aarsregnskap: true,
    },
    stepUpContext: {
      actorId: "owner",
      mfaVerifiedAt: "2026-06-17T09:55:00.000Z",
      securityReviewApproved: true,
      productionCredentialsEnabled: true,
    },
    humanReviewApprovedByObligation: {
      aksjonaerregisteroppgaven: true,
      skattemelding: true,
      aarsregnskap: true,
    },
    now: new Date("2026-06-17T10:00:00.000Z"),
  });

  assert.ok(gates.every((gate) => gate.status === "production_ready"));
  assert.ok(gates.every((gate) => gate.disabledReasons.length === 0));
  assert.match(gates[0].publicCopyRestriction, /produksjonsklar/);
});
