import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "gold" | "navy" | "outline" | "outline-light" | "ghost" | "ghost-light" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  gold: "btn-shine bg-[linear-gradient(135deg,#ecd8a4_0%,#d2ab62_45%,#b48a45_100%)] text-navy-950 shadow-[0_10px_30px_-12px_rgba(195,154,85,0.85)] hover:shadow-[0_16px_40px_-10px_rgba(195,154,85,0.95)] hover:-translate-y-0.5",
  navy: "btn-shine bg-navy-900 text-ivory-50 shadow-[0_12px_30px_-14px_rgba(13,19,54,0.75)] hover:bg-navy-800 hover:-translate-y-0.5",
  outline:
    "border border-navy-900/20 text-navy-900 hover:border-gold-500 hover:bg-gold-400/10",
  "outline-light":
    "border border-gold-400/50 text-gold-200 hover:border-gold-300 hover:bg-gold-400/10",
  ghost: "text-navy-900 hover:bg-navy-900/5",
  "ghost-light": "text-ivory-100 hover:bg-white/10",
  danger:
    "border border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400",
};

const SIZES: Record<Size, string> = {
  sm: "h-10 px-4 text-[0.9rem] gap-2",
  md: "h-12 px-6 text-[0.98rem] gap-2.5",
  lg: "h-14 px-8 text-[1.05rem] gap-3",
};

export function buttonClasses(variant: Variant = "gold", size: Size = "md", extra = "") {
  return [
    "inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-medium tracking-wide",
    "transition-all duration-300 ease-out active:scale-[0.97] active:translate-y-0",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    extra,
  ].join(" ");
}

interface Common {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type LinkProps = Common & {
  href: string;
  external?: boolean;
  onClick?: () => void;
  target?: string;
  rel?: string;
  prefetch?: boolean;
};
type BtnProps = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
  href?: undefined;
};

export function Button(props: LinkProps | BtnProps) {
  const { variant = "gold", size = "md", className = "", children } = props;
  const cls = buttonClasses(variant, size, className);

  if ("href" in props && props.href !== undefined) {
    const { href, external, onClick, target, rel, prefetch } = props;
    if (external || /^(https?:|mailto:|tel:)/.test(href)) {
      return (
        <a
          href={href}
          className={cls}
          target={target ?? "_blank"}
          rel={rel ?? "noopener noreferrer"}
          onClick={onClick}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} onClick={onClick} prefetch={prefetch}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props as BtnProps;
  void _v;
  void _s;
  void _c;
  void _ch;
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
