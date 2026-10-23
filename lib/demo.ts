/**
 * Modo demonstração. Enquanto o site for uma proposta (ainda não entregue à
 * Dra.), ele fica LIGADO: mostra a faixa "demonstração", não é indexado pelo
 * Google, não envia e-mails e avisa que os agendamentos são de teste.
 *
 * Para entregar o site: defina NEXT_PUBLIC_DEMO_MODE=false na Vercel e refaça o deploy.
 */
export const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
