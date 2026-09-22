import type { ReactNode } from "react";
import { CapabilityBadge, EmptyState, type CapabilityStatus } from "@fsts/ui";

export interface PageProps {
  title: string;
  subtitle: string;
  status: CapabilityStatus;
  /** Honest explanation of the current state. */
  emptyTitle: string;
  emptyDescription: string;
  emptyNote?: string;
  children?: ReactNode;
}

/**
 * A standard Command Center page. Every page states its capability status
 * honestly and renders an honest empty state until real data is wired in.
 */
export function Page({
  title,
  subtitle,
  status,
  emptyTitle,
  emptyDescription,
  emptyNote,
  children,
}: PageProps) {
  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">{subtitle}</p>
      <div style={{ marginBottom: "var(--fsts-space-6)" }}>
        <CapabilityBadge status={status} />
      </div>
      {children}
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        note={emptyNote}
      />
    </div>
  );
}
