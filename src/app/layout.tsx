import type { Metadata } from "next";
import { PwaRegister } from "@/components/pwa/pwa-register";
import "./globals.css";

const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const siteUrl = rawAppUrl && !rawAppUrl.includes("localhost") ? rawAppUrl : "https://tepmstudy.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "TEPM Study",
  alternates: {
    canonical: "/",
  },
  title: {
    default: "TEPM Study | Estudos terapêuticos com IA",
    template: "%s | TEPM Study",
  },
  description: "Plataforma privada de estudos terapêuticos com IA, memória inteligente, PDFs, vídeos, trilhas, revisões e mentora RAG.",
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
    title: "TEPM Study",
    description: "Organize estudos terapêuticos, revise melhor e converse com uma mentora IA baseada nos seus materiais.",
    url: "/",
    siteName: "TEPM Study",
    locale: "pt_BR",
    type: "website",
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
  manifest: "/manifest.webmanifest",
  twitter: {
    card: "summary_large_image",
    title: "TEPM Study",
    description: "Memória inteligente e IA mentora para estudos terapêuticos.",
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
        {children}
      </body>
    </html>
  );
}
