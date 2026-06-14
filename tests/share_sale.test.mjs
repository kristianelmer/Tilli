import assert from "node:assert/strict";
import test from "node:test";

import { ShareSaleValidationError, shareSaleLedgerLines, validateShareSale } from "../app/lib/share-sale.ts";

test("builds partial share sale payload and gain ledger lines", () => {
  const payload = validateShareSale({
    positionId: "position-1",
    investmentKey: "portfolio-as",
    investmentName: "Portfolio AS",
    currentShareCount: 100,
    currentCostBasis: 50000,
    saleDate: "2025-08-01",
    soldShareCount: 40,
    proceeds: 30000,
    documentStatus: "attached",
  });

  assert.equal(payload.cost_basis_reduction, 20000);
  assert.equal(payload.gain_or_loss, 10000);
  assert.equal(payload.remaining_share_count, 60);
  assert.equal(payload.remaining_cost_basis, 30000);
  assert.deepEqual(shareSaleLedgerLines(payload), [
    { account: "1920", description: "Sale proceeds received in bank", debit: 30000, credit: 0 },
    { account: "1800", description: "Cost basis reduction: Portfolio AS", debit: 0, credit: 20000 },
    { account: "8070", description: "Share sale gain: Portfolio AS", debit: 0, credit: 10000 },
  ]);
});

test("supports full sale and blocks oversale", () => {
  const fullSale = validateShareSale({
    positionId: "position-1",
    investmentKey: "portfolio-as",
    investmentName: "Portfolio AS",
    currentShareCount: 100,
    currentCostBasis: 50000,
    saleDate: "2025-08-01",
    soldShareCount: 100,
    proceeds: 50000,
    documentStatus: "attached",
  });
  assert.equal(fullSale.remaining_share_count, 0);
  assert.equal(fullSale.remaining_cost_basis, 0);

  assert.throws(
    () =>
      validateShareSale({
        positionId: "position-1",
        investmentKey: "portfolio-as",
        investmentName: "Portfolio AS",
        currentShareCount: 100,
        currentCostBasis: 50000,
        saleDate: "2025-08-01",
        soldShareCount: 101,
        proceeds: 50000,
        documentStatus: "attached",
      }),
    (error) => error instanceof ShareSaleValidationError && error.code === "sale_exceeds_position",
  );
});
