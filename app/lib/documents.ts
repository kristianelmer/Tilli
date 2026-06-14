export const COMPANY_DOCUMENTS_BUCKET = "company-documents";

export function documentStorageKey(companyId: string, incomeYear: number, documentId: string, fileName: string) {
  const safeName = fileName
    .normalize("NFKD")
    .split(/[\\/]/)
    .pop()!
    .replace(/[^\w.\-]+/g, "-")
    .replace(/^\.+/, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
  return `${companyId}/${incomeYear}/${documentId}/${safeName || "document"}`;
}
