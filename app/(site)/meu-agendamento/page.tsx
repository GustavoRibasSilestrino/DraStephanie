import type { Metadata } from "next";
import ManageBooking from "@/components/booking/ManageBooking";
import { Butterfly } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Meu agendamento",
  description: "Consulte, remarque ou cancele a sua consulta com a Dra. Stephanie de Oliveira.",
  robots: { index: false, follow: false },
};

export default async function MeuAgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo } = await searchParams;
  return (
    <>
      <section className="pattern-geo relative overflow-hidden bg-navy-900 pb-24 pt-14 text-center text-ivory-50 sm:pb-28 sm:pt-20">
        <div aria-hidden className="absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-gold-500/10 blur-[100px]" />
        <div className="relative mx-auto max-w-3xl px-5">
          <div className="mb-5 flex items-center justify-center gap-3 text-[0.74rem] uppercase tracking-[0.32em] text-gold-300">
            <span className="h-px w-8 bg-current opacity-60" />
            <Butterfly className="h-4 w-4" />
            Área do paciente
            <span className="h-px w-8 bg-current opacity-60" />
          </div>
          <h1 className="font-display text-[2.02rem] font-normal leading-[1.12] text-balance sm:text-[3.02rem]">
            Meu <em className="text-gold-gradient">agendamento</em>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[1.08rem] text-ivory-200/80">
            Consulte os detalhes, remarque ou cancele a sua consulta quando precisar.
          </p>
        </div>
      </section>
      <section className="relative -mt-10 pb-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <ManageBooking initialCode={codigo} />
        </div>
      </section>
    </>
  );
}
