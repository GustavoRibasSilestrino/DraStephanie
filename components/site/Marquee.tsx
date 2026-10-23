import { Butterfly } from "@/components/ui/Icons";

const WORDS = [
  "Endodontia",
  "Prótese dentária",
  "Implantes",
  "Clareamento",
  "Alinhadores",
  "Clínica geral",
  "Odontologia humanizada",
];

/** Faixa de palavras que desliza devagar (CSS puro, sem JS). */
export default function Marquee() {
  const row = (
    <ul className="flex shrink-0 items-center gap-10 pr-10 sm:gap-14 sm:pr-14" aria-hidden>
      {WORDS.map((w) => (
        <li key={w} className="flex items-center gap-10 sm:gap-14">
          <span className="font-display text-[1.15rem] italic text-navy-900/80 sm:text-[1.44rem]">{w}</span>
          <Butterfly className="h-5 w-5 text-gold-500" />
        </li>
      ))}
    </ul>
  );
  return (
    <div
      className="relative overflow-hidden border-y border-gold-400/25 bg-ivory-100 py-5 sm:py-6"
      role="presentation"
    >
      <div className="flex w-max animate-marquee">
        {row}
        {row}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-ivory-100 to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ivory-100 to-transparent sm:w-32" />
    </div>
  );
}
