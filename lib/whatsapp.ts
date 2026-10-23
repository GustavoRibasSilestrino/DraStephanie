import { site } from "./site";
import { longDate } from "./datetime";

interface Appt {
  code: string;
  date: string;
  startTime: string;
  serviceName: string;
  patientName: string;
}

const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? full;

/** Mensagem do paciente para a clínica (botão "Falar no WhatsApp" após agendar). */
export function messageToClinic(a: Appt): string {
  return (
    `Olá, ${site.shortName}! Sou ${a.patientName} e acabei de agendar pelo site:\n` +
    `• ${a.serviceName}\n• ${longDate(a.date)} às ${a.startTime}\n• Código: ${a.code}`
  );
}

/** Link de WhatsApp para a clínica falar com o paciente (usado no painel). */
export function clinicToPatientLink(
  phone: string,
  a: Appt,
  kind: "confirm" | "reminder" | "free",
): string {
  const when = `${longDate(a.date)} às ${a.startTime}`;
  const text =
    kind === "confirm"
      ? `Olá, ${firstName(a.patientName)}! Aqui é da clínica da ${site.name}. Sua consulta (${a.serviceName}) está confirmada para ${when}. Qualquer imprevisto é só avisar por aqui. Até lá! 😊`
      : kind === "reminder"
        ? `Olá, ${firstName(a.patientName)}! Passando para lembrar da sua consulta (${a.serviceName}) ${when}. Podemos confirmar sua presença? 😊`
        : `Olá, ${firstName(a.patientName)}! Aqui é da clínica da ${site.name}. `;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
