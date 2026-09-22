import { CapabilityBadge, EmptyState } from "@fsts/ui";

export default function DeveloperPortalHome() {
  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
        FSTS AI Hub — Developer Portal
      </h1>
      <p style={{ color: "#9aa7b8", marginBottom: "1.5rem" }}>
        Integration documentation for product-side adapters and authorized
        contributors.
      </p>
      <div style={{ marginBottom: "1.5rem" }}>
        <CapabilityBadge status="interface_only" />
      </div>
      <EmptyState
        title="Documentation surface not yet populated"
        description="The developer portal shell is implemented. Adapter guides, contract references, and integration walkthroughs will be published here."
        note="No integration is claimed to be live. See docs/integrations for the current interface contracts."
      />
    </div>
  );
}
