import assert from "node:assert/strict";
import test from "node:test";

import { COMPANY_DOCUMENTS_BUCKET, documentStorageKey } from "../app/lib/documents.ts";

test("document storage key scopes object by company, year, and document id", () => {
  assert.equal(COMPANY_DOCUMENTS_BUCKET, "company-documents");
  assert.equal(
    documentStorageKey("company-123", 2025, "doc-456", "Bank utskrift desember.pdf"),
    "company-123/2025/doc-456/Bank-utskrift-desember.pdf",
  );
});

test("document storage key strips unsafe filename characters", () => {
  assert.equal(
    documentStorageKey("company-123", 2025, "doc-456", "../../../secret file?.pdf"),
    "company-123/2025/doc-456/secret-file-.pdf",
  );
});
