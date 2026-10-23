"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Btn, ConfirmDialog, Drawer, EmptyState, PageHeader, Spinner, Toggle, useToast } from "./ui";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { SERVICE_ICON_NAMES, ServiceIcon } from "@/components/ui/Icons";
import { api } from "@/lib/client-api";
import { useApi } from "@/lib/use-api";
import { formatDuration } from "@/lib/format";
import type { Service } from "@/lib/appointments";

const DURATIONS = Array.from({ length: 16 }, (_, i) => (i + 1) * 15); // 15 min … 4 h

function ServiceDrawer({
  service,
  open,
  onClose,
  onSaved,
}: {
  service: Service | null; // null = novo
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMin, setDuration] = useState(60);
  const [icon, setIcon] = useState("tooth");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(service?.name ?? "");
    setDescription(service?.description ?? "");
    setDuration(service?.durationMin ?? 60);
    setIcon(service?.icon ?? "tooth");
    setActive(service?.active ?? true);
    setError("");
  }, [open, service]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) return setError("Informe o nome do serviço (mín. 3 letras).");
    setBusy(true);
    setError("");
    const body = { name: name.trim(), description: description.trim(), durationMin, icon, active };
    const r = service
      ? await api(`/api/admin/services/${service.id}`, { method: "PATCH", body })
      : await api("/api/admin/services", { method: "POST", body });
    setBusy(false);
    if (!r.ok) return setError(r.error.message);
    toast(service ? "Serviço atualizado." : "Serviço criado.");
    onSaved();
    onClose();
  };

  const remove = async () => {
    if (!service) return;
    setBusy(true);
    const r = await api(`/api/admin/services/${service.id}`, { method: "DELETE" });
    setBusy(false);
    setConfirmDel(false);
    if (!r.ok) return toast(r.error.message, "error");
    toast("Serviço excluído.");
    onSaved();
    onClose();
  };

  return (
    <>
      <Drawer open={open} onClose={onClose} title={service ? "Editar serviço" : "Novo serviço"}>
        <form onSubmit={save} className="space-y-5" noValidate>
          <Field label="Nome" htmlFor="s-name">
            <TextInput id="s-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Limpeza e revisão" />
          </Field>
          <Field label="Descrição" optional htmlFor="s-desc" hint="Aparece para o paciente na hora de escolher o atendimento.">
            <TextArea id="s-desc" value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} className="min-h-24" />
          </Field>
          <Field label="Duração" htmlFor="s-dur" hint="Define o espaço reservado na agenda.">
            <Select id="s-dur" value={durationMin} onChange={(e) => setDuration(Number(e.target.value))}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {formatDuration(d)}
                </option>
              ))}
            </Select>
          </Field>
          <div>
            <span className="mb-2 block text-[0.9rem] font-medium text-navy-900">Ícone</span>
            <div className="grid grid-cols-5 gap-2">
              {SERVICE_ICON_NAMES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setIcon(n)}
                  aria-pressed={icon === n}
                  aria-label={n}
                  className={`grid aspect-square place-items-center rounded-xl border transition-all ${
                    icon === n ? "border-gold-500 bg-navy-900 text-gold-300" : "border-navy-900/15 bg-white text-navy-900 hover:border-gold-500/60"
                  }`}
                >
                  <ServiceIcon name={n} className="h-7 w-7" />
                </button>
              ))}
            </div>
          </div>
          <Toggle checked={active} onChange={setActive} label="Disponível para agendamento online" hint="Desative para ocultar do site sem excluir." />
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-[0.9rem] text-rose-700">{error}</p>}
          <div className="flex items-center justify-between gap-3 border-t border-gold-400/20 pt-5">
            {service ? (
              <Btn variant="danger" onClick={() => setConfirmDel(true)} disabled={busy}>
                <Trash2 className="h-4 w-4" /> Excluir
              </Btn>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Btn variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Btn>
              <Btn variant="gold" type="submit" disabled={busy} className="px-6">
                {busy ? "Salvando…" : "Salvar"}
              </Btn>
            </div>
          </div>
        </form>
      </Drawer>
      <ConfirmDialog
        open={confirmDel}
        title="Excluir este serviço?"
        text="Ele deixa de aparecer no site. Consultas já marcadas continuam na agenda. Se preferir, apenas desative."
        confirmLabel="Excluir"
        danger
        busy={busy}
        onCancel={() => setConfirmDel(false)}
        onConfirm={remove}
      />
    </>
  );
}

export default function ServicesView() {
  const toast = useToast();
  const { data, loading, error, reload, setData } = useApi<{ services: Service[] }>("/api/admin/services");
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);

  const toggle = async (s: Service, active: boolean) => {
    setData((d) => d && { services: d.services.map((x) => (x.id === s.id ? { ...x, active } : x)) });
    const r = await api(`/api/admin/services/${s.id}`, { method: "PATCH", body: { active } });
    if (!r.ok) {
      toast(r.error.message, "error");
      reload();
    } else toast(active ? "Serviço ativado." : "Serviço ocultado do site.");
  };

  return (
    <>
      <PageHeader
        title="Serviços"
        subtitle="Os atendimentos que o paciente pode escolher ao agendar, e quanto tempo cada um ocupa na agenda."
        actions={
          <Btn variant="gold" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> Novo serviço
          </Btn>
        }
      />

      {loading && !data ? (
        <div className="grid place-items-center py-20"><Spinner className="h-7 w-7" /></div>
      ) : error ? (
        <EmptyState title="Não foi possível carregar" text={error} action={<Btn variant="navy" onClick={reload}>Tentar de novo</Btn>} />
      ) : !data?.services.length ? (
        <EmptyState title="Nenhum serviço cadastrado" text="Crie o primeiro para liberar o agendamento online." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.services.map((s) => (
            <li
              key={s.id}
              className={`flex items-start gap-4 rounded-2xl border bg-white p-4 transition-opacity ${s.active ? "border-gold-400/25" : "border-navy-900/10 opacity-60"}`}
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy-900 text-gold-300">
                <ServiceIcon name={s.icon} className="h-7 w-7" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[1rem] font-medium leading-snug text-navy-900">{s.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[0.86rem] text-muted">{s.description || "Sem descrição"}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-navy-900/5 px-2.5 py-1 text-[0.75rem] text-navy-900/70">{formatDuration(s.durationMin)}</span>
                  <button
                    type="button"
                    onClick={() => { setEditing(s); setOpen(true); }}
                    className="rounded-full px-2.5 py-1 text-[0.8rem] font-medium text-gold-700 underline-offset-4 hover:underline"
                  >
                    Editar
                  </button>
                </div>
              </div>
              <label className="flex shrink-0 cursor-pointer flex-col items-center gap-1 text-[0.68rem] text-muted">
                <span className="relative">
                  <input type="checkbox" checked={s.active} onChange={(e) => toggle(s, e.target.checked)} className="peer sr-only" aria-label={`${s.name}: disponível`} />
                  <span className="block h-6 w-11 rounded-full bg-navy-900/15 transition-colors peer-checked:bg-gold-500" />
                  <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                </span>
                {s.active ? "no site" : "oculto"}
              </label>
            </li>
          ))}
        </ul>
      )}

      <ServiceDrawer service={editing} open={open} onClose={() => setOpen(false)} onSaved={reload} />
    </>
  );
}
