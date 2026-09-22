import { Page } from "@/components/Page";

export default function PageComponent() {
  return (
    <Page
      title="Providers"
      subtitle="Approved model providers and their compliance, residency, and health status."
      status="interface_only"
      emptyTitle="No providers registered"
      emptyDescription="The provider registry contract is implemented. No providers are registered in this environment."
      emptyNote="Unapproved providers are never routed to."
    />
  );
}
