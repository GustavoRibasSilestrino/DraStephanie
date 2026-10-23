import { DEMO } from "@/lib/demo";

/**
 * Faixa de transparência do modo demonstração: deixa claro que o site é uma
 * proposta e que os agendamentos feitos aqui são de teste.
 */
export default function DemoBanner() {
  if (!DEMO) return null;
  return (
    <div className="no-print relative z-[55] bg-navy-950 text-center text-[0.74rem] tracking-wide text-gold-200 sm:text-[0.8rem]">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2">
        <span aria-hidden className="text-gold-400">✦</span>
        <p>
          <strong className="font-medium text-gold-300">Proposta de site</strong>
          <span className="hidden sm:inline">
            {" "}
            — protótipo de demonstração; os agendamentos feitos aqui são de teste
          </span>
          <span className="sm:hidden"> · demonstração</span>
        </p>
        <span aria-hidden className="text-gold-400">✦</span>
      </div>
    </div>
  );
}
