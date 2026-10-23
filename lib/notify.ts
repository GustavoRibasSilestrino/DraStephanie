import { DEMO } from "./demo";
import { site } from "./site";
import { longDate } from "./datetime";
import type { AppointmentView } from "./appointments";

/**
 * Avisos por e-mail (opcionais). Só são enviados se RESEND_API_KEY estiver
 * configurada — e nunca em modo demonstração, para não escrever para
 * ninguém por engano.
 */

type Kind = "created" | "cancelled" | "rescheduled";

const SUBJECT: Record<Kind, string> = {
  created: "Consulta agendada",
  cancelled: "Consulta cancelada",
  rescheduled: "Consulta remarcada",
};

async function send(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM ?? `${site.name} <onboarding@resend.dev>`,
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) console.error("[notify] falha ao enviar e-mail", res.status, await res.text());
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function notifyAppointment(kind: Kind, a: AppointmentView) {
  if (DEMO || !process.env.RESEND_API_KEY) return;
  try {
    const when = `${longDate(a.date, true)} às ${a.startTime}`;
    const manage = `${site.url}/meu-agendamento?codigo=${a.code}`;
    const jobs: Promise<void>[] = [];

    if (a.patient.email) {
      jobs.push(
        send(
          a.patient.email,
          `${SUBJECT[kind]} — ${site.name}`,
          `<div style="font-family:Georgia,serif;color:#1b1f4b;max-width:520px">
             <h2 style="margin:0 0 8px">${SUBJECT[kind]}</h2>
             <p>Olá, ${esc(a.patient.name.split(" ")[0])}!</p>
             <p><strong>${esc(a.serviceName)}</strong><br>${esc(when)}</p>
             <p>Código do agendamento: <strong>${a.code}</strong></p>
             <p><a href="${manage}">Ver, remarcar ou cancelar</a></p>
             <p style="color:#666">${esc(site.name)} · ${esc(site.cro)}<br>WhatsApp ${esc(site.phoneDisplay)}</p>
           </div>`,
        ),
      );
    }
    if (site.notifyEmail) {
      jobs.push(
        send(
          site.notifyEmail,
          `${SUBJECT[kind]}: ${a.patient.name} — ${a.startTime} ${a.date}`,
          `<p><strong>${esc(a.patient.name)}</strong> (${esc(a.patient.phone)})</p>
           <p>${esc(a.serviceName)} — ${esc(when)}</p>
           <p>Código ${a.code}${a.notes ? `<br>Obs.: ${esc(a.notes)}` : ""}</p>`,
        ),
      );
    }
    await Promise.all(jobs);
  } catch (err) {
    console.error("[notify]", err);
  }
}
