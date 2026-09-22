import { Page } from "@/components/Page";

export default function OverviewPage() {
  return (
    <Page
      title="Overview"
      subtitle="Centralized AI governance, orchestration, security, routing, audit, and cost control for FSTS systems."
      status="implemented_not_integrated"
      emptyTitle="No live data connected"
      emptyDescription="The Command Center shell is implemented. Live metrics, registries, and executions will appear here once the Hub services are connected to a running environment."
      emptyNote="No statistics are shown because none are real yet. This console never displays fabricated numbers."
    />
  );
}
