"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Motion";
import { Em, SectionHeading } from "@/components/ui/SectionHeading";
import { nowSP, toMinutes, weekday } from "@/lib/datetime";
import { businessHours, site, whatsappLink } from "@/lib/site";

function useOpenNow() {
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const tick = () => {
      const { date, minutes } = nowSP();
      const slots = businessHours[weekday(date)] ?? [];
      setOpen(slots.some(([a, b]) => minutes >= toMinutes(a) && minutes < toMinutes(b)));
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return open;
}

const DAYS = [
  { label: "Segunda a sexta", times: ["08h às 12h", "13h30 às 17h30"] },
  { label: "Sábado e domingo", times: [] },
];

function Pin() {
  return (
    <div className="relative mx-auto mb-6 grid h-24 w-24 place-items-center">
      <span className="absolute inset-0 animate-ping-soft rounded-full bg-gold-400/25" />
      <span className="absolute inset-3 rounded-full border border-gold-400/40" />
      <svg viewBox="0 0 24 24" className="relative h-10 w-10 text-gold-300" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z" />
        <circle cx="12" cy="10" r="2.6" />
      </svg>
    </div>
  );
}

export default function Contact() {
  const open = useOpenNow();

  return (
    <section id="contato" className="relative overflow-hidden bg-ivory-100 py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Contato"
          title={
            <>
              Vamos cuidar do seu <Em>sorriso</Em>?
            </>
          }
          subtitle="Agende online em poucos cliques ou fale diretamente com a gente pelo WhatsApp."
        />

        <RevealGroup className="mt-16 grid gap-5 lg:grid-cols-3 lg:gap-6" stagger={0.12}>
          {/* horários */}
          <RevealItem>
            <div className="h-full rounded-[1.75rem] border border-gold-400/30 bg-white p-8 shadow-[0_30px_70px_-40px_rgba(13,19,54,0.45)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-[1.3rem] font-medium text-navy-900">Horários</h3>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.78rem] font-medium ${
                    open === null
                      ? "bg-navy-900/5 text-transparent"
                      : open
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-navy-900/5 text-muted"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${open ? "animate-pulse bg-emerald-500" : "bg-navy-900/30"}`} />
                  {open === null ? "···" : open ? "Atendendo agora" : "Fora do horário"}
                </span>
              </div>
              <dl className="mt-6 space-y-5">
                {DAYS.map((d) => (
                  <div key={d.label} className="border-b border-gold-400/20 pb-5 last:border-0 last:pb-0">
                    <dt className="text-[0.74rem] uppercase tracking-[0.22em] text-gold-600">{d.label}</dt>
                    <dd className="mt-1.5 font-display text-[1.08rem] font-medium leading-snug text-navy-900">
                      {d.times.length ? d.times.join(" · ") : <span className="text-muted">Sem atendimento</span>}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 rounded-2xl bg-ivory-100 px-4 py-3 text-[0.9rem] text-muted">
                Atendimento <strong className="font-medium text-navy-900">somente com hora marcada</strong>.
              </p>
            </div>
          </RevealItem>

          {/* local */}
          <RevealItem>
            <div className="pattern-geo relative h-full overflow-hidden rounded-[1.75rem] bg-navy-900 p-8 text-center text-ivory-50 shadow-[0_30px_70px_-40px_rgba(13,19,54,0.7)]">
              <div aria-hidden className="absolute -top-20 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-gold-400/15 blur-[80px]" />
              <div className="relative flex h-full flex-col">
                <Pin />
                <h3 className="font-display text-[1.3rem] font-medium">Onde estamos</h3>
                <p className="mt-3 font-display text-[1.66rem] font-medium italic leading-none text-gold-gradient">
                  {site.city} – {site.state}
                </p>
                {site.address ? (
                  <p className="mt-5 text-[0.98rem] leading-relaxed text-ivory-100/90">
                    {site.street}
                    <br />
                    {site.neighborhood} · CEP {site.cep}
                  </p>
                ) : (
                  <p className="mx-auto mt-5 max-w-[16rem] text-[0.98rem] leading-relaxed text-ivory-200/75">
                    O endereço completo e como chegar são enviados na confirmação do seu agendamento.
                  </p>
                )}
                {site.mapsQuery && (
                  <>
                    <div className="mt-6 overflow-hidden rounded-2xl border border-gold-400/30 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]">
                      <iframe
                        title={`Mapa: ${site.street}, ${site.city}`}
                        src={`https://www.google.com/maps?q=${encodeURIComponent(site.mapsQuery)}&output=embed`}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="block h-44 w-full border-0 [filter:grayscale(0.35)_contrast(1.05)]"
                      />
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.95rem]">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(site.mapsQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gold-300 underline underline-offset-4 hover:text-gold-200"
                      >
                        Como chegar
                      </a>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapsQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ivory-200/80 underline underline-offset-4 hover:text-gold-200"
                      >
                        Abrir no mapa
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </RevealItem>

          {/* contato */}
          <RevealItem>
            <div className="h-full rounded-[1.75rem] border border-gold-400/30 bg-white p-8 shadow-[0_30px_70px_-40px_rgba(13,19,54,0.45)]">
              <h3 className="font-display text-[1.3rem] font-medium text-navy-900">Fale com a gente</h3>
              <ul className="mt-6 space-y-3">
                <li>
                  <a
                    href={whatsappLink("Olá! Vim pelo site e gostaria de agendar uma consulta 😊")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 rounded-2xl border border-gold-400/25 p-4 transition-all hover:-translate-y-0.5 hover:border-[#25d366]/60 hover:bg-[#25d366]/5"
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#25d366] text-white">
                      <WhatsAppIcon className="h-6 w-6" />
                    </span>
                    <span className="leading-tight">
                      <span className="block text-[0.74rem] uppercase tracking-[0.2em] text-muted">WhatsApp</span>
                      <span className="font-display text-[1.04rem] font-medium text-navy-900">{site.phoneDisplay}</span>
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href={site.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 rounded-2xl border border-gold-400/25 p-4 transition-all hover:-translate-y-0.5 hover:border-gold-500 hover:bg-gold-400/5"
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-navy-900 text-gold-300">
                      <InstagramIcon className="h-6 w-6" />
                    </span>
                    <span className="leading-tight">
                      <span className="block text-[0.74rem] uppercase tracking-[0.2em] text-muted">Instagram</span>
                      <span className="text-[1.1rem] font-medium text-navy-900">@{site.instagram}</span>
                    </span>
                  </a>
                </li>
              </ul>
              <Button href="/agendar" className="mt-6 w-full">
                Agendar online
              </Button>
            </div>
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="pattern-geo relative overflow-hidden bg-navy-950 py-24 text-center text-ivory-50 sm:py-32">
      <div aria-hidden className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-[120px]"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative mx-auto max-w-4xl px-5 sm:px-8">
        <Reveal>
          <p className="text-[0.78rem] uppercase tracking-[0.4em] text-gold-300">Seu sorriso do seu jeito</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-6 font-display text-[2.16rem] font-normal leading-[1.12] tracking-[-0.03em] text-balance sm:text-[3.31rem]">
            Seu sorriso merece <Em tone="dark">cuidado</Em>.
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-[1.1rem] text-ivory-200/75">
            Dê o primeiro passo: escolha um horário e venha conhecer a odontologia que valoriza pessoas.
          </p>
        </Reveal>
        <Reveal delay={0.3} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button href="/agendar" size="lg">
            Agendar minha consulta
          </Button>
          <Button href={whatsappLink("Olá! Vim pelo site 😊")} variant="outline-light" size="lg">
            <WhatsAppIcon className="h-5 w-5" /> WhatsApp
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
