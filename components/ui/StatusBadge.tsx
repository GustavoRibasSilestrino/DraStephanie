const STYLE: Record<string, { label: string; cls: string; dot: string }> = {
  pending: { label: "Aguardando confirmação", cls: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  confirmed: { label: "Confirmado", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500" },
  completed: { label: "Concluído", cls: "bg-navy-900/5 text-navy-900 ring-navy-900/15", dot: "bg-navy-600" },
  cancelled: { label: "Cancelado", cls: "bg-rose-50 text-rose-800 ring-rose-200", dot: "bg-rose-500" },
  no_show: { label: "Faltou", cls: "bg-stone-100 text-stone-700 ring-stone-300", dot: "bg-stone-500" },
};

export function statusLabel(status: string) {
  return STYLE[status]?.label ?? status;
}

export default function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const s = STYLE[status] ?? STYLE.pending;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.78rem] font-medium ring-1 ring-inset ${s.cls} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
