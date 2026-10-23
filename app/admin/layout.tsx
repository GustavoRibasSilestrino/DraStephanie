import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Painel da clínica", template: "%s | Painel" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
