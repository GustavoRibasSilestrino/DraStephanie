"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  Users,
} from "lucide-react";
import { ToastProvider } from "./ui";
import { Butterfly } from "@/components/ui/Icons";
import { api } from "@/lib/client-api";
import { DEMO } from "@/lib/demo";
import { longDate, today } from "@/lib/datetime";

const NAV = [
  { href: "/admin", label: "Início", icon: LayoutDashboard },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/admin/pacientes", label: "Pacientes", icon: Users },
  { href: "/admin/servicos", label: "Serviços", icon: Stethoscope },
  { href: "/admin/horarios", label: "Horários", icon: Clock },
] as const;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const logout = async () => {
    await api("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-ivory-100 lg:pl-64">
        {/* menu lateral (desktop) */}
        <aside className="pattern-geo fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-navy-900 text-ivory-100 lg:flex">
          <div className="px-6 pb-6 pt-7">
            <Link href="/admin" className="flex items-center gap-3">
              <Butterfly className="h-9 w-9 text-gold-400" />
              <span className="leading-none">
                <span className="block font-display text-[1rem] font-medium uppercase tracking-[0.12em] text-ivory-50">
                  Dra. Stephanie
                </span>
                <span className="mt-1.5 block text-[0.58rem] uppercase tracking-[0.34em] text-gold-400">
                  Painel da clínica
                </span>
              </span>
            </Link>
          </div>
          <div className="mx-6 h-px bg-gradient-to-r from-gold-400/50 to-transparent" />
          <nav className="mt-6 flex-1 space-y-1 px-3" aria-label="Painel">
            {NAV.map((n) => {
              const active = isActive(n.href);
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-[0.95rem] transition-colors ${
                    active ? "text-navy-950" : "text-ivory-100/80 hover:bg-white/5 hover:text-ivory-50"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-nav"
                      className="absolute inset-0 rounded-xl bg-[linear-gradient(135deg,#ecd8a4,#d2ab62_55%,#b48a45)]"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon className="relative h-5 w-5" />
                  <span className="relative font-medium">{n.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="space-y-1 px-3 pb-6">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-[0.92rem] text-ivory-100/70 transition-colors hover:bg-white/5 hover:text-ivory-50"
            >
              <ExternalLink className="h-5 w-5" /> Ver o site
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[0.92rem] text-ivory-100/70 transition-colors hover:bg-white/5 hover:text-ivory-50"
            >
              <LogOut className="h-5 w-5" /> Sair
            </button>
          </div>
        </aside>

        {/* topo (celular) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gold-400/25 bg-ivory-50/90 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Butterfly className="h-8 w-8 text-gold-600" />
            <span className="leading-none">
              <span className="block font-display text-[0.92rem] font-medium uppercase tracking-[0.12em] text-navy-900">
                Dra. Stephanie
              </span>
              <span className="mt-1 block text-[0.52rem] uppercase tracking-[0.32em] text-gold-600">Painel</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/" target="_blank" aria-label="Ver o site" className="grid h-10 w-10 place-items-center rounded-full text-navy-900 hover:bg-navy-900/5">
              <ExternalLink className="h-5 w-5" />
            </Link>
            <button type="button" onClick={logout} aria-label="Sair" className="grid h-10 w-10 place-items-center rounded-full text-navy-900 hover:bg-navy-900/5">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 pb-32 pt-5 sm:px-6 lg:px-10 lg:pb-16 lg:pt-8">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-[0.82rem] text-muted">
            <span className="first-letter:uppercase">{longDate(today(), true)}</span>
            {DEMO && (
              <span className="rounded-full border border-gold-400/50 bg-gold-400/10 px-3 py-0.5 text-[0.74rem] font-medium text-gold-700">
                Modo demonstração
              </span>
            )}
          </div>
          {children}
        </div>

        {/* barra inferior (celular) */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-gold-400/25 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
          aria-label="Painel"
        >
          {NAV.map((n) => {
            const active = isActive(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium transition-colors ${
                  active ? "text-navy-950" : "text-navy-900/50"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="admin-tab"
                    className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-gold-500"
                  />
                )}
                <Icon className={`h-[1.35rem] w-[1.35rem] ${active ? "text-gold-600" : ""}`} />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </ToastProvider>
  );
}
