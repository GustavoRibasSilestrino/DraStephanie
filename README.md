# Dra. Stephanie de Oliveira — site + agendamento online

Site institucional com **sistema de agendamento completo** para o consultório da Dra. Stephanie de Oliveira
(cirurgiã-dentista, CRO-SP 117.006, Sorocaba–SP).

- **Site público**: herói animado, biografia, especialidades, "como posso ajudar", processo, FAQ, contato, SEO.
- **Agendamento online** (`/agendar`): escolha do atendimento → dia → horário → dados → confirmação, com comprovante,
  Google Agenda / `.ics` e aviso por WhatsApp.
- **Meu agendamento** (`/meu-agendamento`): o paciente consulta, **remarca** e **cancela** com código + WhatsApp.
- **Painel da Dra.** (`/admin`): dashboard, agenda do dia/mês, pacientes, serviços, horários, regras e bloqueios.
- **Sem duplo agendamento**: a trava é no banco (ver abaixo) — vale mesmo com dois pacientes clicando juntos.

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · motion · SQLite/libSQL ou Postgres.

---

## Rodando localmente

```bash
npm install
cp .env.example .env.local     # defina ADMIN_PASSWORD
npm run dev                    # http://localhost:3000
```

Sem nenhuma configuração de banco, o app usa um arquivo SQLite em `./data/clinic.db` (criado sozinho, com as tabelas
e os serviços padrão).

Dados fictícios para demonstrar o painel:

```bash
npm run db:demo                # cria pacientes e consultas de exemplo em torno de hoje
npm run db:demo -- --clear     # remove os dados de exemplo
```

Testes (o núcleo do agendamento, incluindo disputa simultânea pelo mesmo horário):

```bash
npm test          # contra SQLite
npm run test:pg   # a mesma suíte contra um Postgres (PGlite, em WebAssembly)
```

## Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `ADMIN_PASSWORD` | **Obrigatória.** Senha do painel `/admin`. |
| `AUTH_SECRET` | Opcional. Assina a sessão (se vazio, deriva da senha). |
| `DATABASE_URL` | Postgres (Neon, Supabase, Vercel Postgres…). **É o caminho de produção.** |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | Alternativa: Turso (SQLite na nuvem). |
| `NEXT_PUBLIC_DEMO_MODE` | `true` (padrão) = faixa "proposta/demonstração", `noindex`, sem e-mails. `false` = site oficial. |
| `NEXT_PUBLIC_SITE_URL` | URL pública (SEO, links em e-mails). |
| `RESEND_API_KEY`, `MAIL_FROM`, `NOTIFY_EMAIL` | Opcional: e-mail de confirmação ao paciente e aviso à Dra. |

> A Vercel não tem disco persistente: em produção é **obrigatório** configurar `DATABASE_URL` (ou Turso).
> Sem isso o site abre normalmente, mas o agendamento mostra "indisponível" e o botão do WhatsApp.

## Como o agendamento evita conflitos

Cada consulta ocupa N linhas na tabela `appointment_slots` (um bloco de 15 min por linha) e a chave primária
`(date, slot)` impede que dois agendamentos ocupem o mesmo bloco. Se duas pessoas tentam o mesmo horário, o banco
recusa a segunda e ela vê "esse horário acabou de ser reservado". As regras de grade, antecedência, feriados e
bloqueios são calculadas em `lib/availability.ts`.

## Personalização

| O quê | Onde |
|---|---|
| Telefone, textos, FAQ, especialidades, formação, endereço | `lib/site.ts` |
| Horários, regras, bloqueios, serviços | Painel `/admin` (não precisa mexer em código) |
| Foto de perfil | `public/images/dra-stephanie.jpg` (medalhões nítidos) |
| **Retrato em alta resolução** | `public/images/dra-stephanie-retrato.jpg` — vertical, ≥ 900×1100 px. Se existir, o herói e "Quem sou eu" passam a usá-lo nas molduras grandes. |
| Cores / fontes | `app/globals.css` (tokens do tema) e `app/layout.tsx` (Poppins) |

### Pendências para confirmar com a Dra. antes de publicar
- **Endereço**: usado o da página pública de auto-agendamento (Capim) linkada na bio do Instagram dela —
  "Rua Aníbal Costa Dias, 34, Vila Lucy, Sorocaba–SP, CEP 18043-020". O Ident e o Doctoralia listam outros
  endereços; confirmar com a Dra. se mudou e ajustar em `lib/site.ts`.
- **Convênios** (Amil Dental, Bradesco Dental, Interodonto, Odontoprev) vieram do perfil público do Ident.
- **Título de "Especialista"**: o conselho (CRO-SP) exige registro da especialidade para divulgar o título.
- **Durações dos serviços** são sugestões — ajustar em `/admin/servicos`.
- **Política de privacidade**: texto-modelo (LGPD); revisar antes de publicar.
- Conteúdo odontológico segue as regras de publicidade do CFO: sem preços, sem "antes e depois", sem promessas.

## Modo demonstração → entrega

Enquanto `NEXT_PUBLIC_DEMO_MODE` for `true`, o site se apresenta como proposta (faixa no topo, `noindex`,
`robots.txt` bloqueando tudo, sem e-mails, avisos de "agendamento de teste") e o painel oferece
**Restaurar dados de exemplo** (pacientes e consultas fictícios).

Para entregar à Dra.: defina `NEXT_PUBLIC_DEMO_MODE=false`, troque `ADMIN_PASSWORD`, apague os dados de exemplo
(`/admin` → *Remover exemplos*), configure o domínio e `NEXT_PUBLIC_SITE_URL`, e refaça o deploy.

## Deploy (Vercel)

1. Crie um banco Postgres (ex.: Neon pela aba *Storage* / Marketplace da Vercel) — injeta `DATABASE_URL`.
2. Defina `ADMIN_PASSWORD` (e `NEXT_PUBLIC_SITE_URL`) em *Settings → Environment Variables*.
3. Deploy. As tabelas e os serviços padrão são criados sozinhos no primeiro acesso.
4. (Opcional) `DATABASE_URL=… npm run db:demo` para popular dados de exemplo.

## Estrutura

```
app/(site)/        site público: início, /agendar, /meu-agendamento, /privacidade
app/admin/         login + painel (dashboard, agenda, pacientes, serviços, horários)
app/api/           rotas de API (públicas e /api/admin/* protegidas)
components/        site/ · booking/ · admin/ · ui/
lib/               db (SQLite/Postgres), availability, appointments, settings, auth, …
proxy.ts           portão do /admin (Next 16: antigo "middleware")
tests/             testes do núcleo (node:test)
```
