/**
 * DealDNA — Phase 4
 * src/app/layout.tsx — Root layout with ToastProvider
 */
import type { Metadata } from "next";
import { ToastProvider } from "@/components/ToastSystem";

export const metadata: Metadata = {
  title: "DealDNA — Institutional PE Intelligence",
  description: "AI-powered private equity deal analysis and precedent intelligence engine",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "DealDNA",
    description: "Institutional PE Intelligence Engine",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#080c12",
          color: "#e2e8f0",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        }}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
