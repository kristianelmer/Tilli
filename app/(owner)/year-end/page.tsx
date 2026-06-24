import { EmptyState, LinkButton } from "../../components/ui";
import { ownerCopy } from "../../lib/copy";
import { loadWorkspaceData } from "../../lib/workspace-data";
import { YearEndInterview } from "./YearEndInterview";

export const dynamic = "force-dynamic";

export default async function YearEndPage() {
  const data = await loadWorkspaceData();
  const {
    companies,
    primaryCompanyId,
    primaryIncomeYear,
    primaryAnnualData,
    actions,
    entries,
  } = data;

  const c = ownerCopy.yearEnd;
  const primaryCompany =
    companies.find((company) => company.id === primaryCompanyId) ?? companies[0];

  if (!primaryCompany) {
    return (
      <div>
        <div className="pageHead">
          <h1 className="pageTitle">{c.title(primaryIncomeYear)}</h1>
          <p className="pageLede">{c.intro}</p>
        </div>
        <EmptyState
          title={c.needsCompanyTitle}
          action={
            <LinkButton variant="primary" href="/onboarding">
              {c.needsCompanyCta}
            </LinkButton>
          }
        >
          {c.needsCompanyBody}
        </EmptyState>
      </div>
    );
  }

  const companyId = primaryCompany.id;
  const year = primaryIncomeYear;
  const yearActions = actions.filter(
    (action) => action.company_id === companyId && action.income_year === year,
  );
  const hasActionType = (...types: string[]) =>
    yearActions.some((action) => types.includes(action.action_type));

  const registered = {
    bought_or_sold_shares: hasActionType("share_purchase", "share_sale"),
    received_dividends: hasActionType("dividend_received"),
    declared_owner_dividends: hasActionType("dividend_to_owner"),
    shareholder_loans: hasActionType("shareholder_loan"),
    paid_costs: entries.some(
      (entry) =>
        entry.company_id === companyId &&
        entry.income_year === year &&
        entry.entry_type === "admin_cost",
    ),
  };

  return (
    <section className="wizard">
      <YearEndInterview
        companyId={companyId}
        incomeYear={year}
        initialAnswers={primaryAnnualData?.answers ?? null}
        initialFte={primaryAnnualData?.annual_full_time_equivalents ?? null}
        registered={registered}
      />
    </section>
  );
}
