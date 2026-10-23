"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Search } from "lucide-react";
import { AppointmentCard, AppointmentDrawer } from "./Appointments";
import { Btn, Drawer, EmptyState, PageHeader, Spinner, useToast } from "./ui";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { api } from "@/lib/client-api";
import { useApi } from "@/lib/use-api";
import { brDate } from "@/lib/datetime";
import { formatPhone, initials } from "@/lib/format";
import type { PatientSummary } from "@/lib/admin-data";
import type { AppointmentView } from "@/lib/appointments";

function PatientDrawer({
  patient,
  onClose,
  onSaved,
  onOpenAppointment,
}: {
  patient: PatientSummary | null;
  onClose: () => void;
  onSaved: () => void;
  onOpenAppointment: (a: AppointmentView) => void;
}) {
  const toast = useToast();
  const [p, setP] = useState<PatientSummary | null>(patient);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birth, setBirth] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const history = useApi<{ appointments: AppointmentView[] }>(p ? `/api/admin/patients/${p.id}` : null);

  useEffect(() => {
    if (!patient) return;
    setP(patient);
    setName(patient.name);
    setEmail(patient.email ?? "");
    setBirth(patient.birthDate ?? "");
    setNotes(patient.notes ?? "");
  }, [patient]);

  if (!p) return null;
  const dirty =
    name !== p.name || email !== (p.email ?? "") || birth !== (p.birthDate ?? "") || notes !== (p.notes ?? "");

  const save = async () => {
    setBusy(true);
    const r = await api(`/api/admin/patients/${p.id}`, {
      method: "PATCH",
      body: { name: name.trim(), email: email.trim(), birthDate: birth, notes },
    });
    setBusy(false);
    if (!r.ok) return toast(r.error.message, "error");
    toast("Dados do paciente salvos.");
    setP({ ...p, name: name.trim(), email: email.trim() || null, birthDate: birth || null, notes });
    onSaved();
  };

  return (
    <Drawer open={!!patient} onClose={onClose} title={p.name}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-navy-900 font-display text-[1.4rem] text-gold-300">
            {initials(p.name)}
          </span>
          <div>
            <p className="text-[1.05rem] font-medium text-navy-900">{formatPhone(p.phone)}</p>
            <a
              href={`https://wa.me/${p.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-[0.9rem] font-medium text-[#128c4a] underline-offset-4 hover:underline"
            >
              <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
            </a>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-gold-400/25 bg-white p-5">
          <Field label="Nome" htmlFor="p-name">
            <TextInput id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-mail" optional htmlFor="p-email">
              <TextInput id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Nascimento" optional htmlFor="p-birth">
              <TextInput id="p-birth" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
            </Field>
          </div>
          <Field label="Anotações sobre o paciente" optional htmlFor="p-notes" hint="Só a clínica vê.">
            <TextArea id="p-notes" value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Btn variant="navy" disabled={!dirty || busy || name.trim().length < 2} onClick={save}>
              {busy ? "Salvando…" : "Salvar"}
            </Btn>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-display text-[1.15rem] font-medium text-navy-900">Histórico de consultas</h3>
          {history.loading && !history.data ? (
            <Spinner />
          ) : history.data?.appointments.length ? (
            <div className="space-y-3">
              {history.data.appointments.map((a) => (
                <AppointmentCard key={a.id} a={a} showDate onClick={() => onOpenAppointment(a)} />
              ))}
            </div>
          ) : (
            <p className="text-[0.92rem] text-muted">Nenhuma consulta registrada.</p>
          )}
        </div>
      </div>
    </Drawer>
  );
}

export default function PatientsView({ initialQuery = "" }: { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [open, setOpen] = useState<PatientSummary | null>(null);
  const [appt, setAppt] = useState<AppointmentView | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const list = useApi<{ patients: PatientSummary[] }>(`/api/admin/patients?q=${encodeURIComponent(debounced)}`);

  return (
    <>
      <PageHeader title="Pacientes" subtitle="Todos os pacientes que já agendaram, com histórico de consultas." />

      <div className="relative mb-5 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-900/40" />
        <TextInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome ou telefone"
          aria-label="Buscar paciente"
          className="pl-12"
        />
      </div>

      {list.loading && !list.data ? (
        <div className="grid place-items-center py-20">
          <Spinner className="h-7 w-7" />
        </div>
      ) : list.error ? (
        <EmptyState title="Não foi possível carregar" text={list.error} action={<Btn variant="navy" onClick={list.reload}>Tentar de novo</Btn>} />
      ) : !list.data?.patients.length ? (
        <EmptyState
          title={debounced ? "Nenhum paciente encontrado" : "Ainda não há pacientes"}
          text={debounced ? "Tente outro nome ou parte do telefone." : "Eles aparecem aqui assim que o primeiro agendamento for feito."}
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.data.patients.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setOpen(p)}
                className="flex w-full items-center gap-4 rounded-2xl border border-gold-400/25 bg-white p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-500/60 hover:shadow-[0_18px_40px_-26px_rgba(13,19,54,0.45)]"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-navy-900 font-display text-[1.05rem] text-gold-300">
                  {initials(p.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[1rem] font-medium text-navy-900">{p.name}</span>
                  <span className="block text-[0.86rem] text-muted">{formatPhone(p.phone)}</span>
                  <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.78rem] text-navy-900/70">
                    <span>{p.total} {p.total === 1 ? "consulta" : "consultas"}</span>
                    {p.lastDate && <span>última {brDate(p.lastDate)}</span>}
                    {p.nextDate && <span className="font-medium text-gold-700">próxima {brDate(p.nextDate)}</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <PatientDrawer patient={open} onClose={() => setOpen(null)} onSaved={list.reload} onOpenAppointment={setAppt} />
      <AppointmentDrawer appointment={appt} onClose={() => setAppt(null)} onChanged={(a) => { setAppt(a); list.reload(); }} />
    </>
  );
}
