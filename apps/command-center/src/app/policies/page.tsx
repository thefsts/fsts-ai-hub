import { Page } from "@/components/Page";

export default function PageComponent() {
  return (
    <Page
      title="Policies"
      subtitle="Versioned policies evaluated deny-by-default."
      status="interface_only"
      emptyTitle="No policies configured"
      emptyDescription="The policy engine and baseline rules are implemented and tested. No tenant policies are configured yet."
      emptyNote="Baseline security rules are always evaluated first."
    />
  );
}
