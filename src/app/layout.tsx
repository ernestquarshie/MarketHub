import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

const siteUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MarketHub — shop retail and source wholesale from verified sellers",
    template: "%s · MarketHub",
  },
  description:
    "MarketHub is a marketplace for retail and bulk buying: tiered wholesale prices, requests for quote, mobile money, cards and pickup-station delivery across Ghana, Nigeria and worldwide.",
  applicationName: "MarketHub",
  openGraph: { type: "website", siteName: "MarketHub" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
