/**
 * Dados da clínica. Tudo que aparece no site e nas mensagens de WhatsApp
 * sai daqui — para trocar telefone, endereço ou textos, edite só este arquivo.
 *
 * Fontes: Instagram @dra_stephaniedeoliveira e perfil público da Dra. no Ident.
 */

function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const raw = explicit || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return raw.replace(/\/$/, "");
}

export const site = {
  name: "Dra. Stephanie de Oliveira",
  shortName: "Dra. Stephanie",
  brandLine: "Odontologia especializada",
  cro: "CRO-SP 117.006",
  croNumber: "117.006",
  city: "Sorocaba",
  state: "SP",
  tagline: "Odontologia que valoriza pessoas.",

  /** Telefone/WhatsApp (somente dígitos, com DDI). */
  whatsapp: "5515992874141",
  phoneDisplay: "(15) 99287-4141",

  instagram: "dra_stephaniedeoliveira",
  instagramUrl: "https://www.instagram.com/dra_stephaniedeoliveira/",

  /**
   * Endereço: página pública de auto-agendamento linkada na bio do Instagram dela (Capim).
   * (O Ident e o Doctoralia listam outros endereços — confirmar com a Dra. se mudou.)
   */
  address: "Rua Aníbal Costa Dias, 34 — Vila Lucy" as string,
  neighborhood: "Vila Lucy",
  street: "Rua Aníbal Costa Dias, 34",
  cep: "18043-020",
  mapsQuery: "Rua Aníbal Costa Dias, 34, Vila Lucy, Sorocaba - SP, 18043-020" as string,

  /** E-mail para receber aviso de novos agendamentos (opcional). */
  notifyEmail: process.env.NOTIFY_EMAIL ?? "",

  /** URL pública do site (SEO, links nos e-mails): NEXT_PUBLIC_SITE_URL > domínio da Vercel > local. */
  url: siteUrl(),

  /** Foto de perfil (medalhões) e retrato em alta resolução (molduras grandes). Ver lib/photo.ts */
  photoPath: "/images/dra-stephanie.jpg",
  portraitPath: "/images/dra-stephanie-retrato.jpg",
} as const;

export const formation = [
  {
    year: "2015",
    title: "Graduação em Odontologia",
    place: "UNIP – Universidade Paulista, Sorocaba",
  },
  {
    year: "2018",
    title: "Especialização em Endodontia",
    place: "Facop",
  },
  {
    year: "2022",
    title: "Especialização em Prótese Dentária",
    place: "Facop",
  },
] as const;

/** Convênios listados no perfil público do Ident — confirmar com a Dra. */
export const insurers = [
  "Amil Dental",
  "Bradesco Dental",
  "Interodonto",
  "Odontoprev",
] as const;

export const specialties = [
  {
    slug: "endodontia",
    service: "canal",
    title: "Endodontia",
    subtitle: "Tratamento de canal",
    icon: "root",
    text: "Tratamento do interior do dente — a polpa e os canais — para aliviar a dor, eliminar a infecção e manter o seu dente natural na boca. Feito com técnica precisa e atenção ao seu conforto.",
    points: ["Dor de dente e sensibilidade", "Retratamento de canal", "Urgências endodônticas"],
  },
  {
    slug: "protese",
    service: "protese",
    title: "Prótese dentária",
    subtitle: "Função, estética e conforto",
    icon: "crown",
    text: "Reabilitação de dentes ausentes ou muito comprometidos, devolvendo mastigação, fala e sorriso com planejamento individual e materiais adequados a cada caso.",
    points: ["Coroas e facetas", "Próteses fixas e removíveis", "Próteses sobre implante"],
  },
  {
    slug: "implantes",
    service: "implante",
    title: "Implantes dentários",
    subtitle: "Reposição de dentes",
    icon: "implant",
    text: "Alternativa para repor dentes perdidos com planejamento criterioso. A avaliação define se o implante é indicado para você e qual o melhor caminho de tratamento.",
    points: ["Avaliação e planejamento", "Reabilitação com prótese", "Acompanhamento"],
  },
  {
    slug: "clareamento",
    service: "clareamento",
    title: "Clareamento dental",
    subtitle: "Sorriso mais claro",
    icon: "sparkle",
    text: "Clareamento com acompanhamento profissional, respeitando a saúde dos dentes e da gengiva. Antes de começar, avaliamos se ele é indicado para o seu caso.",
    points: ["Avaliação prévia", "Acompanhamento profissional", "Orientações de manutenção"],
  },
  {
    slug: "alinhadores",
    service: "alinhadores",
    title: "Alinhadores ortodônticos",
    subtitle: "Alinhamento discreto",
    icon: "aligner",
    text: "Tratamento ortodôntico com alinhadores transparentes e removíveis, planejado de forma digital para corrigir a posição dos dentes de maneira discreta.",
    points: ["Planejamento individual", "Discreto e removível", "Acompanhamento periódico"],
  },
  {
    slug: "clinica-geral",
    service: "avaliacao",
    title: "Clínica geral",
    subtitle: "Prevenção e cuidado contínuo",
    icon: "shield",
    text: "Avaliação completa da saúde bucal, limpeza, restaurações e orientações de prevenção — a base para um sorriso saudável por muito tempo.",
    points: ["Avaliação e diagnóstico", "Limpeza e profilaxia", "Restaurações"],
  },
] as const;

export const habits = [
  "Escove os dentes 3 vezes ao dia",
  "Use fio dental diariamente",
  "Tenha uma boa alimentação",
  "Visite o dentista regularmente",
  "Evite o tabaco e o excesso de açúcar",
] as const;

export const faq = [
  {
    q: "Como faço para agendar minha consulta?",
    a: "Pelo próprio site, em poucos cliques: escolha o tratamento, o dia e o horário disponível, preencha seus dados e pronto. Você recebe a confirmação na hora e pode adicionar o compromisso à sua agenda. Se preferir, também atendemos pelo WhatsApp.",
  },
  {
    q: "Preciso estar com dor para marcar uma avaliação?",
    a: "Não. A avaliação serve justamente para cuidar do seu sorriso com prevenção e planejamento, antes que os problemas apareçam. Se você está com dor, escolha “Urgência / dor de dente” para ser atendido o quanto antes.",
  },
  {
    q: "O atendimento é com hora marcada?",
    a: "Sim. O atendimento é somente com horário agendado, o que garante que você seja atendido com calma e sem espera.",
  },
  {
    q: "Posso remarcar ou cancelar?",
    a: "Pode. Use o código recebido na confirmação em “Meu agendamento” para remarcar ou cancelar online com antecedência. Assim o horário volta a ficar livre para outra pessoa.",
  },
  {
    q: "A Dra. atende por convênio?",
    a: "Há atendimento particular e por alguns convênios odontológicos. Informe o seu convênio no momento do agendamento ou fale conosco pelo WhatsApp para confirmar a cobertura.",
  },
  {
    q: "O tratamento de canal dói?",
    a: "Com anestesia e técnica adequadas, o tratamento de canal é feito com conforto — e costuma aliviar a dor causada pela infecção. Cada caso é diferente, por isso a avaliação é o primeiro passo.",
  },
  {
    q: "Como sei se sou candidato a implante, clareamento ou alinhadores?",
    a: "Isso depende de uma avaliação clínica, com exames quando necessário. Na primeira consulta analisamos a sua saúde bucal e explicamos as opções, prazos e cuidados de cada tratamento.",
  },
  {
    q: "Onde fica o consultório?",
    a: "Rua Aníbal Costa Dias, 34, Vila Lucy, Sorocaba – SP (CEP 18043-020). Você pode abrir a rota direto no mapa na seção de contato.",
  },
  {
    q: "Quais os dias e horários de atendimento?",
    a: "De segunda a sexta, das 8h às 12h e das 13h30 às 17h30. Aos fins de semana não há atendimento.",
  },
] as const;

/** Horário de atendimento por dia da semana (0 = domingo). Só para exibição no site. */
export const businessHours: Record<number, readonly (readonly [string, string])[]> = {
  0: [],
  1: [["08:00", "12:00"], ["13:30", "17:30"]],
  2: [["08:00", "12:00"], ["13:30", "17:30"]],
  3: [["08:00", "12:00"], ["13:30", "17:30"]],
  4: [["08:00", "12:00"], ["13:30", "17:30"]],
  5: [["08:00", "12:00"], ["13:30", "17:30"]],
  6: [],
};

export const WHATSAPP_BASE = `https://wa.me/${site.whatsapp}`;

export function whatsappLink(message?: string) {
  return message
    ? `${WHATSAPP_BASE}?text=${encodeURIComponent(message)}`
    : WHATSAPP_BASE;
}
