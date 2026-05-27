import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tienda Chambatina — Equipos, Electrónicos, Muebles y más",
  description: "Tienda Chambatina — Equipos electrónicos, TVs, colchones, muebles, EcoFlow, baterías Humsienk y más. Precios competitivos con margen comercial.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛒</text></svg>",
  },
};

export default function TiendaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
};
