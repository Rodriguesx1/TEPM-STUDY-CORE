import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://tepmstudy.vercel.app"),
  title: {
    default: "TEPM Study Core | Estudos terapeuticos com IA",
    template: "%s | TEPM Study Core",
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
    title: "TEPM Study Core",
    description: "Organize estudos terapeuticos, revise melhor e converse com uma mentora IA baseada nos seus materiais.",
    url: "/",
    siteName: "TEPM Study Core",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TEPM Study Core",
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
      <body>{children}</body>
    </html>
  );
}
