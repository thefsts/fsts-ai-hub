import { Page } from "@/components/Page";
import { Card, Stat } from "@fsts/ui";

/**
 * Usage and Cost — the cost dashboard foundation.
 *
 * All values render as "No data" until the Cost Optimization Engine is
 * connected to a running environment. No fabricated numbers are shown.
 */
export default function UsageAndCostPage() {
  return (
    <Page
      title="Usage and Cost"
      subtitle="AI usage, cost attribution, budgets, forecasts, and cost-guard alerts."
      status="interface_only"
      emptyTitle="No cost data available"
      emptyDescription="The Cost Optimization Engine, cost contracts, and routing logic are implemented and tested. No usage or cost data exists in this environment yet."
      emptyNote="Cost figures are never estimated or fabricated. Every value below reads 'No data' until real records exist."
    >
      <div className="grid" style={{ marginBottom: "var(--fsts-space-6)" }}>
        <Stat label="Spend this period" value={null} unit="USD" />
        <Stat label="Budget utilization" value={null} unit="%" />
        <Stat label="Forecast (period end)" value={null} unit="USD" />
        <Stat label="Cost anomalies" value={null} />
      </div>
      <div className="grid" style={{ marginBottom: "var(--fsts-space-6)" }}>
        <Card title="Cost attribution">
          <p style={{ color: "var(--fsts-color-text-muted)", margin: 0 }}>
            Client-owned and FSTS-owned costs are attributed separately. No
            allocations are recorded yet.
          </p>
        </Card>
        <Card title="Budgets and enforcement">
          <p style={{ color: "var(--fsts-color-text-muted)", margin: 0 }}>
            Budgets are enforced server-side and fail closed. No budgets are
            configured yet.
          </p>
        </Card>
        <Card title="Cost Guard alerts">
          <p style={{ color: "var(--fsts-color-text-muted)", margin: 0 }}>
            No cost-guard alerts have been raised.
          </p>
        </Card>
      </div>
    </Page>
  );
}
