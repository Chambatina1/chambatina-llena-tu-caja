import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Pedidos Walmart",
  description: "Panel de administración de pedidos Walmart a tu Familia",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
