"use client";

import { useMemo, useState } from "react";

import { recordOwnerDividend } from "../../../actions";
import { Banner, SubmitButton } from "../../../components/ui";
import { ownerCopy } from "../../../lib/copy";
import {
  ownerDividendLedgerLines,
  validateOwnerDividend,
} from "../../../lib/owner-dividend";
import { ActionPreview, type LedgerLine } from "./ActionPreview";
import { DocStatusSelect, SelectField, TextField } from "./fields";

export type DividendShareholder = {
  id: string;
  name: string;
  share_count: number;
};

type Props = {
  companyId: string;
  incomeYear: number;
  shareholders: DividendShareholder[];
};

export function OwnerDividendWizard({
  companyId,
  incomeYear,
  shareholders,
}: Props) {
  const a = ownerCopy.actions;
  const c = a.ownerDividend;

  const [shareholderId, setShareholderId] = useState("");
  const [decisionDate, setDecisionDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [distributableEquity, setDistributableEquity] = useState("");
  const [liquidityAfterPayment, setLiquidityAfterPayment] = useState("");
  const [documentStatus, setDocumentStatus] = useState(
    "missing_accepted_warning",
  );

  const selected = shareholders.find(
    (shareholder) => shareholder.id === shareholderId,
  );
  const ready =
    Boolean(selected) &&
    decisionDate.trim() !== "" &&
    paymentDate.trim() !== "" &&
    totalAmount.trim() !== "" &&
    distributableEquity.trim() !== "" &&
    liquidityAfterPayment.trim() !== "";

  const preview = useMemo<{ block: string | null; lines: LedgerLine[] | null }>(() => {
    if (!ready || !selected) return { block: null, lines: null };
    try {
      const payload = validateOwnerDividend({
        decisionDate,
        paymentDate,
        totalAmount: Number(totalAmount),
        distributableEquity: Number(distributableEquity),
        liquidityAfterPayment: Number(liquidityAfterPayment),
        documentStatus: documentStatus as
          | "attached"
          | "missing_accepted_warning"
          | "not_required",
        allocations: [
          {
            shareholderId: selected.id,
            shareholderName: selected.name,
            shareCount: selected.share_count,
            amount: Number(totalAmount),
          },
        ],
      });
      return { block: null, lines: ownerDividendLedgerLines(payload) };
    } catch (error) {
      return {
        block: error instanceof Error ? error.message : "Ugyldig eierutbytte",
        lines: null,
      };
    }
  }, [
    ready,
    selected,
    decisionDate,
    paymentDate,
    totalAmount,
    distributableEquity,
    liquidityAfterPayment,
    documentStatus,
  ]);

  if (shareholders.length === 0) {
    return <Banner variant="info">{c.noShareholders}</Banner>;
  }

  return (
    <form action={recordOwnerDividend} className="wizardForm">
      <input type="hidden" name="returnTo" value="/actions" />
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="incomeYear" value={incomeYear} />
      <input type="hidden" name="allocationAmount" value={totalAmount} />

      <SelectField
        label={c.shareholderLabel}
        name="shareholderId"
        value={shareholderId}
        onChange={setShareholderId}
        required
      >
        <option value="" disabled>
          {c.shareholderPlaceholder}
        </option>
        {shareholders.map((shareholder) => (
          <option key={shareholder.id} value={shareholder.id}>
            {shareholder.name}
          </option>
        ))}
      </SelectField>
      <div className="fieldRow">
        <TextField
          label={c.decisionLabel}
          name="decisionDate"
          value={decisionDate}
          onChange={setDecisionDate}
          placeholder="2025-06-01"
          helper={a.dateHelp}
          required
        />
        <TextField
          label={c.paymentLabel}
          name="paymentDate"
          value={paymentDate}
          onChange={setPaymentDate}
          placeholder="2025-06-15"
          helper={a.dateHelp}
          required
        />
      </div>
      <TextField
        label={c.amountLabel}
        name="totalAmount"
        value={totalAmount}
        onChange={setTotalAmount}
        inputMode="decimal"
        required
      />
      <div className="fieldRow">
        <TextField
          label={c.equityLabel}
          name="distributableEquity"
          value={distributableEquity}
          onChange={setDistributableEquity}
          inputMode="decimal"
          helper={c.equityHelp}
          required
        />
        <TextField
          label={c.liquidityLabel}
          name="liquidityAfterPayment"
          value={liquidityAfterPayment}
          onChange={setLiquidityAfterPayment}
          inputMode="decimal"
          helper={c.liquidityHelp}
          required
        />
      </div>
      <DocStatusSelect value={documentStatus} onChange={setDocumentStatus} />

      <ActionPreview block={preview.block} lines={preview.lines} />

      <SubmitButton disabled={preview.lines === null} pendingLabel={a.pending}>
        {a.confirmCta}
      </SubmitButton>
    </form>
  );
}
