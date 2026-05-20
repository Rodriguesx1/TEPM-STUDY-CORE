import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TEPM Study Core",
  description: "Plataforma premium privada de estudos terapeuticos com IA.",
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
