import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Butterfly } from "@/components/ui/Icons";

export default function NotFound() {
  return (
    <main className="pattern-geo relative grid min-h-dvh place-items-center overflow-hidden bg-navy-950 px-5 text-center text-ivory-50">
      <div aria-hidden className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-[110px]" />
      <div className="relative">
        <Butterfly className="mx-auto h-14 w-14 text-gold-400" />
        <p className="mt-6 font-display text-[5.04rem] font-normal leading-none text-gold-gradient sm:text-[6.48rem]">404</p>
        <h1 className="mt-2 font-display text-[1.44rem] italic">Página não encontrada</h1>
        <p className="mx-auto mt-3 max-w-md text-ivory-200/75">
          O endereço pode ter mudado ou não existir mais. Vamos voltar ao início?
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href="/">Ir para o início</Button>
          <Link href="/agendar" className="text-gold-200 underline underline-offset-4 hover:text-gold-300">
            Agendar consulta
          </Link>
        </div>
      </div>
    </main>
  );
}
