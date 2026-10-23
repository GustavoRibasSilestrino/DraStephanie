import type { ReactNode } from "react";
import { Reveal } from "./Motion";
import { Butterfly } from "./Icons";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  tone = "light",
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  /** "light" = fundo claro; "dark" = fundo azul-marinho. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const center = align === "center";
  return (
    <div className={`${center ? "mx-auto text-center" : ""} max-w-3xl ${className}`}>
      <Reveal>
        <div
          className={`mb-5 flex items-center gap-3 text-[0.78rem] font-medium uppercase tracking-[0.32em] ${
            center ? "justify-center" : ""
          } ${tone === "dark" ? "text-gold-300" : "text-gold-600"}`}
        >
          <span className="h-px w-8 bg-current opacity-60" />
          <Butterfly className="h-4 w-4" />
          <span>{eyebrow}</span>
          <span className="h-px w-8 bg-current opacity-60" />
        </div>
      </Reveal>
      <Reveal delay={0.08}>
        <h2
          className={`font-display text-[1.95rem] font-normal leading-[1.12] tracking-[-0.03em] text-balance sm:text-[2.5rem] lg:text-[3rem] ${
            tone === "dark" ? "text-ivory-50" : "text-navy-900"
          }`}
        >
          {title}
        </h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.16}>
          <p
            className={`mt-6 text-lg leading-relaxed text-pretty ${
              tone === "dark" ? "text-ivory-200/80" : "text-muted"
            }`}
          >
            {subtitle}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/** Palavra em itálico dourado dentro de um título. */
export function Em({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <em
      className={`font-display italic font-medium ${
        tone === "dark" ? "text-gold-gradient" : "text-gold-gradient-dark"
      }`}
    >
      {children}
    </em>
  );
}
