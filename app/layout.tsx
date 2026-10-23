import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { DEMO } from "@/lib/demo";
import Providers from "@/components/Providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-poppins",
  display: "swap",
});

const title = `${site.name} | Dentista em ${site.city} — Endodontia, Prótese e Implantes`;
const description = `Cirurgiã-dentista em ${site.city}-${site.state}, especialista em Endodontia e Prótese Dentária. Odontologia humanizada: implantes, clareamento, alinhadores e clínica geral. Agende online. ${site.cro}.`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: `%s | ${site.name}` },
  description,
  applicationName: site.name,
  keywords: [
    "dentista em Sorocaba",
    "endodontia Sorocaba",
    "tratamento de canal Sorocaba",
    "prótese dentária Sorocaba",
    "implante dentário Sorocaba",
    "clareamento dental Sorocaba",
    "alinhadores ortodônticos Sorocaba",
    "Dra. Stephanie de Oliveira",
  ],
  authors: [{ name: site.name }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: site.name,
    title,
    description,
  },
  twitter: { card: "summary_large_image", title, description },
  // Enquanto for proposta/demonstração, nada disso deve aparecer no Google.
  robots: DEMO
    ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
    : { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0d1336",
  width: "device-width",
  initialScale: 1,
};

// Se a pessoa já viu a abertura nesta sessão, o CSS a esconde antes do primeiro desenho.
const splashGuard = `try{if(sessionStorage.getItem("splash-seen"))document.documentElement.setAttribute("data-splash","skip")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={poppins.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: splashGuard }} />
      </head>
      <body className="min-h-dvh overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
