import { Page } from "@/components/Page";

export default function PageComponent() {
  return (
    <Page
      title="Tools"
      subtitle="Governed tools, MCP servers, and API operations available to agents."
      status="interface_only"
      emptyTitle="No tools registered"
      emptyDescription="The tool registry and authorization contracts are implemented. No tools are registered yet."
      emptyNote="Tool execution is deny-by-default and allowlist-gated."
    />
  );
}
