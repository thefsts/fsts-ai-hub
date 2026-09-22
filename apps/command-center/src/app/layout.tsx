import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "FSTS AI Hub — Command Center",
  description:
    "Centralized AI governance, orchestration, security, routing, audit, and cost console for FSTS systems.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="app-sidebar">
            <div className="app-brand">
              <span className="app-brand__mark" aria-hidden="true" />
              <span className="app-brand__text">FSTS AI Hub</span>
            </div>
            <Nav />
          </aside>
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
