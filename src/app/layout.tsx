import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { LgpdConsentBanner } from "@/components/privacy/lgpd-consent-banner";
import "./globals.css";

const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const siteUrl = rawAppUrl && !rawAppUrl.includes("localhost") ? rawAppUrl : "https://tepmstudy.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "TEPM Study",
  authors: [{ name: "TEPM Study" }],
  alternates: {
    canonical: "https://tepmstudy.vercel.app/",
  },
  title: {
    default: "TEPM Study | Estudos terapêuticos com IA e memória",
    template: "%s | TEPM Study",
  },
  description: "Estudos terapêuticos com IA para organizar PDFs, criar memória inteligente e revisar com fontes em ambiente privado.",
  keywords: [
    "estudos terapêuticos",
    "IA terapêutica",
    "memória inteligente",
    "PDF com IA",
    "mentora IA",
    "organização de estudos",
    "trilhas de estudo",
  ],
  openGraph: {
    title: "TEPM Study | Estudos terapêuticos com IA e memória",
    description: "Estudos terapêuticos com IA para organizar PDFs, criar memória inteligente e revisar com fontes em ambiente privado.",
    url: "https://tepmstudy.vercel.app/",
    siteName: "TEPM Study",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://tepmstudy.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "TEPM Study: estudos terapêuticos com IA e memória inteligente.",
      },
    ],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "icon", url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "https://tepmstudy.vercel.app/manifest.json",
  twitter: {
    card: "summary_large_image",
    title: "TEPM Study | Estudos terapêuticos com IA e memória",
    description: "Estudos terapêuticos com IA para organizar PDFs, criar memória inteligente e revisar com fontes em ambiente privado.",
    images: [
      {
        url: "https://tepmstudy.vercel.app/og-image.png",
        alt: "TEPM Study: estudos terapêuticos com IA e memória inteligente.",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "TEPM Study",
    statusBarStyle: "black-translucent",
  },
  other: {
    language: "pt-BR",
    rating: "general",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#071412",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="nile-ambient">
        <PwaRegister />
        <LgpdConsentBanner />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
