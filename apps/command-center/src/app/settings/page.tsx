import { Page } from "@/components/Page";

export default function PageComponent() {
  return (
    <Page
      title="Settings"
      subtitle="Hub configuration, environments, and integration settings."
      status="interface_only"
      emptyTitle="No settings available"
      emptyDescription="Configuration loading and validation are implemented. No environment settings are exposed in this shell yet."
      emptyNote="Configuration fails closed on invalid values."
    />
  );
}
