import type { Metadata } from "next";
import BookingWizard from "@/components/booking/BookingWizard";
import { Butterfly } from "@/components/ui/Icons";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Agendar consulta",
  description: `Agende online a sua consulta com a ${site.name}, dentista em ${site.city}-${site.state}. Escolha o atendimento, o dia e o horário.`,
};

export default async function AgendarPage({
  searchParams,
}: {
  searchParams: Promise<{ servico?: string }>;
}) {
  const { servico } = await searchParams;
  return (
    <>
      <section className="pattern-geo relative overflow-hidden bg-navy-900 pb-24 pt-14 text-center text-ivory-50 sm:pb-28 sm:pt-20">
        <div aria-hidden className="absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-gold-500/10 blur-[100px]" />
        <div className="relative mx-auto max-w-3xl px-5">
          <div className="mb-5 flex items-center justify-center gap-3 text-[0.74rem] uppercase tracking-[0.32em] text-gold-300">
            <span className="h-px w-8 bg-current opacity-60" />
            <Butterfly className="h-4 w-4" />
            Agendamento online
            <span className="h-px w-8 bg-current opacity-60" />
          </div>
          <h1 className="font-display text-[2.02rem] font-normal leading-[1.12] text-balance sm:text-[3.02rem]">
            Agende a sua <em className="text-gold-gradient">consulta</em>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[1.08rem] text-ivory-200/80">
            Em poucos cliques: escolha o atendimento, o melhor horário e confirme. Sem ligações, sem espera.
          </p>
        </div>
      </section>

      <section className="relative -mt-12 pb-24 sm:-mt-14 sm:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="rounded-[2.2rem] bg-ivory-50 px-3 pb-3 pt-8 shadow-[0_-10px_40px_-20px_rgba(13,19,54,0.3)] sm:px-8 sm:pt-12">
            <BookingWizard initialService={servico} />
          </div>
        </div>
      </section>
    </>
  );
}
