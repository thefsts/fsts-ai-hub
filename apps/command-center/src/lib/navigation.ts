/**
 * FSTS AI Hub — Command Center navigation.
 *
 * The canonical navigation surface. Every entry maps to a real route. Sections
 * that are not yet integrated render honest empty states rather than fabricated
 * data.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

export interface NavItem {
  label: string;
  href: string;
  /** Honest capability classification for this surface. */
  status:
    | "implemented_and_tested"
    | "implemented_not_integrated"
    | "interface_only"
    | "mock_or_simulation"
    | "blocked"
    | "not_started";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/", status: "implemented_not_integrated" },
  { label: "AI Registry", href: "/ai-registry", status: "interface_only" },
  { label: "Agents", href: "/agents", status: "interface_only" },
  { label: "Models", href: "/models", status: "interface_only" },
  { label: "Providers", href: "/providers", status: "interface_only" },
  { label: "Tools", href: "/tools", status: "interface_only" },
  {
    label: "Connected Systems",
    href: "/connected-systems",
    status: "interface_only",
  },
  { label: "Policies", href: "/policies", status: "interface_only" },
  { label: "Approvals", href: "/approvals", status: "interface_only" },
  { label: "Executions", href: "/executions", status: "interface_only" },
  { label: "Memory and Knowledge", href: "/memory", status: "interface_only" },
  { label: "Security", href: "/security", status: "interface_only" },
  { label: "Audit", href: "/audit", status: "interface_only" },
  {
    label: "Usage and Cost",
    href: "/usage-and-cost",
    status: "interface_only",
  },
  { label: "Settings", href: "/settings", status: "interface_only" },
];
