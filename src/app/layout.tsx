import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chambatina — Llena tu Caja",
  description:
    "Arma tu caja de productos para tu pueblo. Selecciona granos, leche en polvo y más. Envío hasta 30 días.",
  keywords: [
    "Chambatina",
    "caja",
    "productos",
    "envío",
    "pueblo",
    "Nicaragua",
    "granos",
    "leche en polvo",
  ],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📦</text></svg>",
  },
  openGraph: {
    title: "Chambatina — Llena tu Caja",
    description: "Arma tu caja de productos para tu pueblo. Selecciona granos, leche en polvo y más.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
