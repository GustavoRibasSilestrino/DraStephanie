import DemoBanner from "@/components/site/DemoBanner";
import Footer from "@/components/site/Footer";
import Header from "@/components/site/Header";
import WhatsAppFab from "@/components/site/WhatsAppFab";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBanner />
      <Header />
      <main id="conteudo">{children}</main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
