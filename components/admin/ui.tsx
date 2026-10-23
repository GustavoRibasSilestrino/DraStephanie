"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

// ───────────────────────── Toast ─────────────────────────

type ToastKind = "ok" | "error";
interface ToastItem {
  id: number;
  text: string;
  kind: ToastKind;
}
const ToastCtx = createContext<(text: string, kind?: ToastKind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, kind: ToastKind = "ok") => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l, { id, text, kind }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[120] flex flex-col items-center gap-2 px-4 lg:bottom-8"
      >
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className={`pointer-events-auto max-w-md rounded-2xl px-5 py-3 text-[0.92rem] font-medium shadow-[0_20px_50px_-20px_rgba(13,19,54,0.6)] ${
                t.kind === "ok" ? "bg-navy-900 text-ivory-50" : "bg-rose-600 text-white"
              }`}
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

// ───────────────────────── Cartão / cabeçalho ─────────────────────────

export function Card({
  children,
  className = "",
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={`rounded-3xl border border-gold-400/25 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(13,19,54,0.35)] sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-[1.15rem] font-medium text-navy-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[1.7rem] font-normal leading-tight text-navy-900 sm:text-[2rem]">{title}</h1>
        {subtitle && <p className="mt-1 text-[0.95rem] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-gold-400/30 border-t-gold-600 ${className}`}
      role="status"
      aria-label="Carregando"
    />
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-gold-400/40 bg-ivory-100/50 px-6 py-10 text-center">
      <div>
        <p className="font-display text-[1.25rem] italic text-navy-900">{title}</p>
        {text && <p className="mt-1 text-[0.92rem] text-muted">{text}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-[0.95rem] font-medium text-navy-900">{label}</span>
        {hint && <span className="mt-0.5 block text-[0.85rem] text-muted">{hint}</span>}
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="block h-7 w-12 rounded-full bg-navy-900/15 transition-colors duration-300 peer-checked:bg-gold-500 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-500 peer-focus-visible:ring-offset-2" />
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

// ───────────────────────── Drawer / Modal ─────────────────────────

export function Drawer({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-navy-950/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={`absolute inset-y-0 right-0 flex w-full flex-col bg-ivory-50 shadow-2xl ${wide ? "max-w-2xl" : "max-w-lg"}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <header className="flex items-center justify-between gap-4 border-b border-gold-400/25 bg-white px-5 py-4 sm:px-6">
              <h2 className="min-w-0 truncate font-display text-[1.3rem] font-medium text-navy-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-navy-900/15 text-navy-900 transition-colors hover:border-gold-500 hover:bg-gold-400/10"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  text?: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] grid place-items-center p-4" role="alertdialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-navy-950/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={busy ? undefined : onCancel}
          />
          <motion.div
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            <h3 className="font-display text-[1.4rem] font-medium text-navy-900">{title}</h3>
            {text && <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{text}</p>}
            {children}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="h-11 rounded-full px-5 text-[0.95rem] font-medium text-navy-900 transition-colors hover:bg-navy-900/5 disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className={`h-11 rounded-full px-6 text-[0.95rem] font-medium text-white transition-colors disabled:opacity-60 ${
                  danger ? "bg-rose-600 hover:bg-rose-700" : "bg-navy-900 hover:bg-navy-800"
                }`}
              >
                {busy ? "Aguarde…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Botão pequeno do painel. */
export function Btn({
  children,
  onClick,
  variant = "outline",
  disabled,
  type = "button",
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "gold" | "navy" | "outline" | "danger" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  title?: string;
}) {
  const v = {
    gold: "bg-[linear-gradient(135deg,#ecd8a4,#d2ab62_50%,#b48a45)] text-navy-950 shadow-[0_8px_22px_-10px_rgba(195,154,85,0.9)] hover:brightness-105",
    navy: "bg-navy-900 text-ivory-50 hover:bg-navy-800",
    outline: "border border-navy-900/15 bg-white text-navy-900 hover:border-gold-500 hover:bg-gold-400/10",
    danger: "border border-rose-300 bg-white text-rose-700 hover:bg-rose-50",
    ghost: "text-navy-900 hover:bg-navy-900/5",
  }[variant];
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-[0.9rem] font-medium transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${v} ${className}`}
    >
      {children}
    </button>
  );
}
