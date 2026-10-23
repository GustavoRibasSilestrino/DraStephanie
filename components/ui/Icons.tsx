import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base: P = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

/** Contorno do dente, reutilizado pelos ícones e pela ilustração do herói. */
export const TOOTH_PATH =
  "M32 14C28 8 18 7 14 14C10 22 16 30 17 38C18 46 19 56 24 56C29 56 28 44 32 44C36 44 35 56 40 56C45 56 46 46 47 38C48 30 54 22 50 14C46 7 36 8 32 14Z";

export const BUTTERFLY_PATHS = [
  "M20 19C17 10 10 5 4 6C3 13 8 19 17 21",
  "M20 19C23 10 30 5 36 6C37 13 32 19 23 21",
  "M19 23C14 22 8 25 8 31C13 33 18 30 19 26",
  "M21 23C26 22 32 25 32 31C27 33 22 30 21 26",
  "M20 16V30",
  "M20 16C19 12 17.5 10.5 16 9.5",
  "M20 16C21 12 22.5 10.5 24 9.5",
] as const;

/** Marca da Dra.: borboleta dourada (inspirada no logotipo dos posts). */
export function Butterfly(props: P) {
  return (
    <svg viewBox="0 0 40 40" {...base} strokeWidth={1.3} {...props}>
      {BUTTERFLY_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function Tooth(props: P) {
  return (
    <svg viewBox="0 0 64 64" {...base} {...props}>
      <path d={TOOTH_PATH} />
    </svg>
  );
}

function Root(props: P) {
  return (
    <svg viewBox="0 0 64 64" {...base} {...props}>
      <path d={TOOTH_PATH} />
      <path d="M26 24C25 33 24.5 42 24.5 51" />
      <path d="M38 24C39 33 39.5 42 39.5 51" />
      <path d="M26 24H38" />
    </svg>
  );
}

function Crown(props: P) {
  return (
    <svg viewBox="0 0 64 64" {...base} {...props}>
      <path d="M11 44L15 20L26 32L32 14L38 32L49 20L53 44Z" />
      <path d="M13 51H51" />
      <circle cx="15" cy="17" r="1.6" />
      <circle cx="32" cy="11" r="1.6" />
      <circle cx="49" cy="17" r="1.6" />
    </svg>
  );
}

function Implant(props: P) {
  return (
    <svg viewBox="0 0 64 64" {...base} {...props}>
      <path d="M20 14C20 7 44 7 44 14C44 20 42 25 40 27H24C22 25 20 20 20 14Z" />
      <path d="M24 33H40" />
      <path d="M25 39H39" />
      <path d="M26.5 45H37.5" />
      <path d="M28 51H36" />
      <path d="M24 33L29.5 57" />
      <path d="M40 33L34.5 57" />
      <path d="M29.5 57H34.5" />
    </svg>
  );
}

function Sparkle(props: P) {
  return (
    <svg viewBox="0 0 64 64" {...base} {...props}>
      <path d="M30 10C32 24 36 28 50 30C36 32 32 36 30 50C28 36 24 32 10 30C24 28 28 24 30 10Z" />
      <path d="M51 8V18M46 13H56" />
      <path d="M50 44V52M46 48H54" />
    </svg>
  );
}

function Aligner(props: P) {
  return (
    <svg viewBox="0 0 64 64" {...base} {...props}>
      <path d="M8 24C20 40 44 40 56 24" />
      <path d="M13 20C24 33 40 33 51 20" />
      <path d="M19 30V37M25.5 33V40M32 34V41M38.5 33V40M45 30V37" />
    </svg>
  );
}

function Shield(props: P) {
  return (
    <svg viewBox="0 0 64 64" {...base} {...props}>
      <path d="M32 8L50 15V30C50 42 42 50 32 56C22 50 14 42 14 30V15Z" />
      <path d="M24 31L30 37L41 24" />
    </svg>
  );
}

function Search(props: P) {
  return (
    <svg viewBox="0 0 64 64" {...base} {...props}>
      <circle cx="28" cy="28" r="16" />
      <path d="M40 40L54 54" />
      <path d="M21 25C22 22 25 20 28 20" />
    </svg>
  );
}

function Alert(props: P) {
  return (
    <svg viewBox="0 0 64 64" {...base} {...props}>
      <circle cx="32" cy="32" r="22" />
      <path d="M32 20V44M20 32H44" />
    </svg>
  );
}

function Return(props: P) {
  return (
    <svg viewBox="0 0 64 64" {...base} {...props}>
      <path d="M52 32A20 20 0 1 1 46 17.5" />
      <path d="M47 8V19H58" />
    </svg>
  );
}

const MAP: Record<string, (p: P) => React.ReactElement> = {
  tooth: Tooth,
  root: Root,
  crown: Crown,
  implant: Implant,
  sparkle: Sparkle,
  aligner: Aligner,
  shield: Shield,
  search: Search,
  alert: Alert,
  return: Return,
};

export function ServiceIcon({ name, ...props }: { name: string } & P) {
  const Cmp = MAP[name] ?? Tooth;
  return <Cmp {...props} />;
}

export const SERVICE_ICON_NAMES = Object.keys(MAP);

/** Ícone oficial do WhatsApp (traço sólido). */
export function WhatsAppIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.21-8.23 8.21Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

export function InstagramIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" {...base} strokeWidth={1.7} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
