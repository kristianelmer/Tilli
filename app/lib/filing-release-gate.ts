import type { AuthorityObligation, AuthorityPermission } from "./authority-permission.ts";
import { authorityObligationLabel, authorityObligations, productionAuthorityGate } from "./authority-permission.ts";
import type { BillingAccount } from "./billing.ts";
import { productionBillingGate } from "./billing.ts";
import { assertStepUpAllowed, SensitiveActionStepUpError, type StepUpContext } from "./security.ts";

export type FilingReleaseGateStatus = "production_ready" | "production_disabled";

export type FilingReleaseGate = {
  obligation: AuthorityObligation;
  label: string;
  status: FilingReleaseGateStatus;
  disabledReasons: string[];
  publicCopyRestriction: string;
};

export function buildFilingReleaseGates(input: {
  authorityPermissions: Pick<AuthorityPermission, "obligation" | "confirmed_at" | "production_enabled">[];
  billingAccount: BillingAccount | null;
  filingReadyByObligation: Partial<Record<AuthorityObligation, boolean>>;
  stepUpContext: StepUpContext;
  humanReviewApprovedByObligation: Partial<Record<AuthorityObligation, boolean>>;
  now?: Date;
}): FilingReleaseGate[] {
  return authorityObligations.map((obligation) => {
    const disabledReasons: string[] = [];
    const authorityGate = productionAuthorityGate(input.authorityPermissions, obligation);
    if (!authorityGate.allowed) {
      disabledReasons.push(authorityGate.status);
    }

    if (!input.billingAccount) {
      disabledReasons.push("billing_account_missing");
    } else {
      const billingGate = productionBillingGate(input.billingAccount, Boolean(input.filingReadyByObligation[obligation]));
      if (!billingGate.allowed) {
        disabledReasons.push(billingGate.status);
      }
    }

    try {
      assertStepUpAllowed("production_filing", input.stepUpContext, input.now);
    } catch (error) {
      disabledReasons.push(error instanceof SensitiveActionStepUpError ? error.code : "production_step_up_failed");
    }

    if (!input.humanReviewApprovedByObligation[obligation]) {
      disabledReasons.push("human_release_review_missing");
    }

    return {
      obligation,
      label: authorityObligationLabel(obligation),
      status: disabledReasons.length ? "production_disabled" : "production_ready",
      disabledReasons,
      publicCopyRestriction: disabledReasons.length
        ? `${authorityObligationLabel(obligation)} kan bare omtales som forhåndsvisning/simulering til produksjonsbevis og reviewer-signoff finnes.`
        : `${authorityObligationLabel(obligation)} kan omtales som produksjonsklar for støttede saker med lagret kvittering.`,
    };
  });
}
