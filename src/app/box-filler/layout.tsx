import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chambatina — Llena tu Caja",
  description: "Arma tu caja de productos Walmart para envío a Nicaragua. Selecciona granos, enlatados y más con visualización 3D en tiempo real.",
  keywords: ["Chambatina", "llena tu caja", "productos Walmart", "envío Nicaragua", "caja de productos"],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📦</text></svg>",
  },
};

export default function BoxFillerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
