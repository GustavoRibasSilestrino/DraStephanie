"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Reveal } from "@/components/ui/Motion";
import { Em, SectionHeading } from "@/components/ui/SectionHeading";
import { faq } from "@/lib/site";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="duvidas" className="relative bg-ivory-50 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Dúvidas frequentes"
          title={
            <>
              Tudo o que você precisa <Em>saber</Em>
            </>
          }
        />

        <div className="mt-14 space-y-3">
          {faq.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={Math.min(i * 0.04, 0.2)} y={18}>
                <div
                  className={`overflow-hidden rounded-2xl border transition-colors duration-500 ${
                    isOpen
                      ? "border-gold-500/50 bg-white shadow-[0_24px_50px_-30px_rgba(13,19,54,0.4)]"
                      : "border-gold-400/25 bg-ivory-100/50 hover:border-gold-500/40"
                  }`}
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-${i}`}
                      className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left sm:px-8 sm:py-6"
                    >
                      <span className="font-display text-[0.97rem] font-medium leading-snug text-navy-900 sm:text-[1.08rem]">
                        {item.q}
                      </span>
                      <span
                        aria-hidden
                        className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-500 ${
                          isOpen ? "rotate-180 border-gold-500 bg-gold-400/15" : "border-navy-900/20"
                        }`}
                      >
                        <span className="absolute h-px w-3.5 bg-navy-900" />
                        <span
                          className={`absolute h-3.5 w-px bg-navy-900 transition-transform duration-500 ${
                            isOpen ? "scale-y-0" : ""
                          }`}
                        />
                      </span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-${i}`}
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <p className="px-6 pb-6 text-[1.02rem] leading-[1.8] text-muted sm:px-8 sm:pb-7">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
