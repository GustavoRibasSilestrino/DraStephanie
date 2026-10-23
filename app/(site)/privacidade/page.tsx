import type { Metadata } from "next";
import Link from "next/link";
import { DEMO } from "@/lib/demo";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: `Como a ${site.name} trata os dados pessoais coletados no agendamento online (LGPD).`,
};

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-12 font-display text-[1.37rem] font-medium text-navy-900">{children}</h2>
);

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
      <p className="text-[0.76rem] uppercase tracking-[0.3em] text-gold-600">Transparência</p>
      <h1 className="mt-3 font-display text-[2.16rem] font-normal leading-[1.18] text-navy-900 sm:text-[2.74rem]">
        Política de privacidade
      </h1>
      <p className="mt-4 text-muted">Última atualização: {new Date().getFullYear()}</p>

      {DEMO && (
        <p className="mt-6 rounded-2xl border border-gold-400/40 bg-gold-400/10 px-5 py-4 text-[0.95rem] text-navy-900">
          <strong className="font-medium">Este é um ambiente de demonstração.</strong> Os agendamentos feitos aqui são
          de teste e este texto é um modelo, que deve ser revisado antes da publicação oficial do site.
        </p>
      )}

      <div className="mt-8 space-y-4 text-[1.04rem] leading-[1.85] text-navy-900/85">
        <p>
          Esta política explica como a <strong>{site.name}</strong> ({site.cro}), cirurgiã-dentista em {site.city}-
          {site.state}, trata os dados pessoais informados no agendamento online, em conformidade com a Lei Geral de
          Proteção de Dados (Lei nº 13.709/2018 — LGPD).
        </p>

        <H>1. Quem é o controlador dos dados</H>
        <p>
          O controlador é {site.name}, que decide como e para quê os dados são usados. Contato para assuntos de
          privacidade: WhatsApp {site.phoneDisplay}.
        </p>

        <H>2. Quais dados coletamos</H>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Nome completo e número de WhatsApp (obrigatórios para o agendamento);</li>
          <li>E-mail (opcional);</li>
          <li>Forma de atendimento (particular ou convênio) e o nome do convênio, quando houver;</li>
          <li>Observações que você escrever sobre o motivo da consulta (opcional). Evite informar dados de saúde detalhados — eles serão tratados na consulta.</li>
        </ul>

        <H>3. Para que usamos os dados</H>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Reservar, confirmar, remarcar e cancelar a sua consulta;</li>
          <li>Entrar em contato com você sobre o agendamento (por WhatsApp, telefone ou e-mail);</li>
          <li>Organizar a agenda e o atendimento da clínica.</li>
        </ul>
        <p>
          Não usamos seus dados para publicidade de terceiros e não vendemos informações. Só enviaremos mensagens
          sobre a sua consulta ou, se você pedir, sobre o seu tratamento.
        </p>

        <H>4. Base legal</H>
        <p>
          Tratamos os dados com base no seu consentimento (marcado no agendamento) e na necessidade de executar os
          procedimentos preliminares relacionados ao atendimento solicitado por você.
        </p>

        <H>5. Com quem compartilhamos</H>
        <p>
          Apenas com prestadores que permitem o funcionamento do site e da agenda (hospedagem e banco de dados), que
          tratam os dados sob nossas instruções. Também podemos compartilhar informações com o convênio odontológico
          indicado por você, quando necessário para o atendimento, ou por obrigação legal.
        </p>

        <H>6. Por quanto tempo guardamos</H>
        <p>
          Mantemos os dados pelo tempo necessário para o atendimento e para cumprir obrigações legais e
          regulatórias da profissão. Depois disso, eles são eliminados ou anonimizados.
        </p>

        <H>7. Seus direitos</H>
        <p>
          Você pode solicitar a confirmação do tratamento, o acesso, a correção, a anonimização ou a exclusão dos seus
          dados, a portabilidade e a revogação do consentimento, nos termos do art. 18 da LGPD. Basta nos chamar pelo
          WhatsApp {site.phoneDisplay}.
        </p>

        <H>8. Cookies e segurança</H>
        <p>
          O agendamento não usa cookies de rastreamento ou publicidade. Adotamos medidas técnicas para proteger os
          dados, como conexão segura (HTTPS), controle de acesso ao painel da clínica e limitação de tentativas
          abusivas.
        </p>

        <p className="pt-6">
          <Link href="/agendar" className="font-medium text-gold-700 underline underline-offset-4 hover:text-gold-600">
            Voltar ao agendamento
          </Link>
        </p>
      </div>
    </article>
  );
}
