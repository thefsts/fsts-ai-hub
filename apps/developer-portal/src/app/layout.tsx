import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "FSTS AI Hub — Developer Portal",
  description:
    "Integration documentation for product-side adapters and authorized contributors to the FSTS AI Hub.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: "2rem",
          background: "#0b0f14",
          color: "#e6edf5",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <main style={{ maxWidth: 900, margin: "0 auto" }}>{children}</main>
      </body>
    </html>
  );
}
