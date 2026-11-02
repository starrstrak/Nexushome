import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { HaProvider } from "@/providers/HaProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexushome",
  description: "Pilotage domotique Home Assistant",
  appleWebApp: { capable: true, title: "Nexushome", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#0f1115",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Reading request headers opts the page into dynamic rendering so Next can apply
  // the per-request CSP nonce set by src/proxy.ts to its own scripts.
  await headers();
  return (
    <html lang="fr">
      <body className="min-h-dvh antialiased">
        <HaProvider>{children}</HaProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
