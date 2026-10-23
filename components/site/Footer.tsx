import Link from "next/link";
import { Butterfly, InstagramIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { site, whatsappLink } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="pattern-geo relative overflow-hidden bg-navy-950 text-ivory-100/80">
      <div className="ornament-line" />
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-3">
            <Butterfly className="h-10 w-10 text-gold-400" />
            <div className="leading-none">
              <div className="font-display text-[0.97rem] font-medium uppercase tracking-[0.16em] text-ivory-50">
                Dra. Stephanie Oliveira
              </div>
              <div className="mt-1.5 text-[0.6rem] uppercase tracking-[0.36em] text-gold-400">
                {site.brandLine}
              </div>
            </div>
          </div>
          <p className="mt-6 max-w-sm text-[0.98rem] leading-relaxed text-ivory-200/70">
            Cuidado humanizado e tecnicamente preciso, do diagnóstico ao resultado. Seu sorriso em boas mãos.
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="grid h-11 w-11 place-items-center rounded-full border border-gold-400/30 text-gold-300 transition-all hover:-translate-y-0.5 hover:border-gold-300 hover:bg-gold-400/10"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="grid h-11 w-11 place-items-center rounded-full border border-gold-400/30 text-gold-300 transition-all hover:-translate-y-0.5 hover:border-gold-300 hover:bg-gold-400/10"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="md:col-span-3">
          <h3 className="mb-5 text-[0.72rem] font-medium uppercase tracking-[0.3em] text-gold-400">Navegue</h3>
          <ul className="space-y-3 text-[0.98rem]">
            {[
              ["/#sobre", "Sobre a Dra."],
              ["/#especialidades", "Especialidades"],
              ["/#atendimento", "Como é o atendimento"],
              ["/#duvidas", "Dúvidas frequentes"],
              ["/agendar", "Agendar consulta"],
              ["/meu-agendamento", "Meu agendamento"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="transition-colors hover:text-gold-300">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-4">
          <h3 className="mb-5 text-[0.72rem] font-medium uppercase tracking-[0.3em] text-gold-400">Atendimento</h3>
          <ul className="space-y-3 text-[0.98rem]">
            <li>
              {site.address ? (
                <>
                  {site.street}
                  <span className="block text-ivory-200/60">
                    {site.neighborhood} · {site.city} – {site.state} · CEP {site.cep}
                  </span>
                </>
              ) : (
                <>
                  {site.city} – {site.state}
                </>
              )}
            </li>
            <li>Segunda a sexta · 8h às 12h e 13h30 às 17h30</li>
            <li className="text-ivory-200/60">Fins de semana sem atendimento</li>
            <li>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-200 transition-colors hover:text-gold-300"
              >
                WhatsApp {site.phoneDisplay}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-[0.82rem] text-ivory-200/55 sm:flex-row sm:px-8">
          <p>
            © {new Date().getFullYear()} {site.name} · Cirurgiã-Dentista · {site.cro}
          </p>
          <p className="flex gap-5">
            <Link href="/privacidade" className="transition-colors hover:text-gold-300">
              Política de privacidade
            </Link>
            <Link href="/admin" className="transition-colors hover:text-gold-300">
              Área da Dra.
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
