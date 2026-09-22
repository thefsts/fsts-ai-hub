import { Page } from "@/components/Page";

export default function PageComponent() {
  return (
    <Page
      title="Memory and Knowledge"
      subtitle="Tenant- and agent-scoped memory, knowledge sources, and RAG collections."
      status="interface_only"
      emptyTitle="No memory scopes configured"
      emptyDescription="The memory-scope isolation contracts are implemented and tested. No scopes are configured yet."
      emptyNote="Cross-tenant, cross-system, and cross-agent access is denied by default."
    />
  );
}
