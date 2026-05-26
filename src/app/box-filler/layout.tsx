import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chambatina — Walmart a tu Familia",
  description: "Walmart a tu Familia — Arma tu caja de productos Walmart para envío a Nicaragua. Selecciona granos, enlatados y más con visualización 3D en tiempo real.",
  keywords: ["Chambatina", "Walmart a tu Familia", "productos Walmart", "envío Nicaragua", "caja de productos"],
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
