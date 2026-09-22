import { Page } from "@/components/Page";

export default function PageComponent() {
  return (
    <Page
      title="Models"
      subtitle="Approved models available through the Model Gateway."
      status="interface_only"
      emptyTitle="No models registered"
      emptyDescription="The model registry contract is implemented. No models are registered in this environment."
      emptyNote="All model calls must pass through the Model Gateway."
    />
  );
}
