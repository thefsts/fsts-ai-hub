import { Page } from "@/components/Page";

export default function PageComponent() {
  return (
    <Page
      title="Agents"
      subtitle="Versioned, executable AI configurations with enforced allowlists."
      status="interface_only"
      emptyTitle="No agents registered"
      emptyDescription="The agent and agent-version contracts are implemented and tested. No agents are registered yet."
      emptyNote="Changing an agent produces a new immutable version."
    />
  );
}
