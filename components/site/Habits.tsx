"use client";

import { RevealGroup, RevealItem, Reveal } from "@/components/ui/Motion";
import { Em, SectionHeading } from "@/components/ui/SectionHeading";
import { habits } from "@/lib/site";

export default function Habits() {
  return (
    <section className="relative overflow-hidden bg-ivory-100 py-24 sm:py-28">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Saúde bucal"
          title={
            <>
              5 hábitos para manter o seu <Em>sorriso saudável</Em>
            </>
          }
          subtitle="Pequenas rotinas que fazem uma grande diferença entre uma consulta e outra."
        />

        <RevealGroup className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5" stagger={0.09}>
          {habits.map((h, i) => (
            <RevealItem key={h} className={i === 4 ? "sm:col-span-2 lg:col-span-1" : ""}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-gold-400/25 bg-white p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-500/60 hover:shadow-[0_28px_60px_-30px_rgba(13,19,54,0.4)]">
                <span className="font-display text-[3.17rem] font-normal italic leading-none text-gold-gradient-dark opacity-90 transition-transform duration-500 group-hover:scale-110">
                  {i + 1}
                </span>
                <p className="mt-3 text-[1.02rem] font-medium leading-snug text-navy-900">{h}</p>
                <span aria-hidden className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-gold-400/10 transition-transform duration-700 group-hover:scale-[2.4]" />
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-10 text-center">
          <p className="font-display text-[1.08rem] italic text-navy-900/80 sm:text-[1.22rem]">
            E, claro, uma consulta de rotina faz toda a diferença.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
