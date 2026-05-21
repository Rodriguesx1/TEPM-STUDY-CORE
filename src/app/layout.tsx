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
    default: "TEPM Study | Estudos terapeuticos com IA",
    template: "%s | TEPM Study",
  },
  description: "Plataforma privada de estudos terapeuticos com IA, memoria inteligente, PDFs, videos, trilhas, revisoes e mentora RAG.",
  keywords: [
    "estudos terapeuticos",
    "IA terapeutica",
    "memoria inteligente",
    "PDF com IA",
    "mentora IA",
    "organizacao de estudos",
    "trilhas de estudo",
  ],
  openGraph: {
    title: "TEPM Study",
    description: "Organize estudos terapeuticos, revise melhor e converse com uma mentora IA baseada nos seus materiais.",
    url: "/",
    siteName: "TEPM Study",
    locale: "pt_BR",
    type: "website",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  manifest: "/manifest.webmanifest",
  twitter: {
    card: "summary_large_image",
    title: "TEPM Study",
    description: "Memoria inteligente e IA mentora para estudos terapeuticos.",
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
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
