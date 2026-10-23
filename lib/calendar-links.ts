import { toInstant, longDate } from "./datetime";
import { site } from "./site";

interface Appt {
  code: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceName: string;
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function details(a: Appt) {
  return `${a.serviceName} com ${site.name} (${site.cro}).\nCódigo do agendamento: ${a.code}\nWhatsApp: ${site.phoneDisplay}\nPara remarcar ou cancelar, use "Meu agendamento" no site.`;
}

const location = () => (site.address ? `${site.address}, ${site.city} - ${site.state}` : `${site.city} - ${site.state}`);

/** Link para adicionar ao Google Agenda. */
export function googleCalendarUrl(a: Appt): string {
  const start = stamp(toInstant(a.date, a.startTime));
  const end = stamp(toInstant(a.date, a.endTime));
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `Consulta — ${site.shortName}`,
    dates: `${start}/${end}`,
    details: details(a),
    location: location(),
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** Conteúdo de um arquivo .ics (Apple Calendar, Outlook, etc.), com lembrete de 1 dia e 2 horas. */
export function icsFile(a: Appt): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${site.name}//Agendamento//PT`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${a.code}@${new URL(site.url).hostname}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(toInstant(a.date, a.startTime))}`,
    `DTEND:${stamp(toInstant(a.date, a.endTime))}`,
    `SUMMARY:${esc(`Consulta — ${site.shortName}`)}`,
    `DESCRIPTION:${esc(details(a))}`,
    `LOCATION:${esc(location())}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`Amanhã: consulta com ${site.shortName} às ${a.startTime}`)}`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`Hoje às ${a.startTime}: consulta com ${site.shortName}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function describe(a: Appt) {
  return `${longDate(a.date)} às ${a.startTime}`;
}
