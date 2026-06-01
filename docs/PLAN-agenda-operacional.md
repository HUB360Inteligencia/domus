# Agenda Operacional

## Overview
Transformar o modulo de Atividades em uma Agenda operacional do Domus, reunindo tarefas, compromissos, contratos, recebimentos previstos e lembretes internos em uma experiencia responsiva.

## Project Type
WEB full-stack: React/Vite + Supabase/PostgreSQL + React Query.

## Success Criteria
- O menu e o header usam Agenda como entrada principal.
- `/agenda` mostra calendario mensal, marcacoes por dia, lista do dia e filtros responsivos.
- Contratos ativos geram recebimentos previstos automaticamente sem duplicar transacoes reais.
- Recebimentos previstos podem ser baixados pela Agenda, criando/associando a receita financeira.
- Eventos manuais e lembretes internos ficam isolados em tabelas proprias com RLS.
- Rotas antigas de `/activities` redirecionam para a Agenda.

## Tech Stack
- React + TypeScript para UI.
- Supabase para dados persistentes e RLS.
- date-fns para calculo de datas e calendario.
- Componentes UI existentes do Domus para manter consistencia visual.

## File Structure
- `supabase/migrations/*_agenda_operational_events.sql`
- `src/types/agenda.ts`
- `src/api/agenda.ts`
- `src/hooks/use-agenda.ts`
- `src/components/agenda/*`
- `src/pages/AgendaPage.tsx`
- `src/routes/AppRoutes.tsx`
- `src/components/layout/app-header.tsx`
- `src/components/layout/animated-sidebar.tsx`
- `src/components/dashboard/AgendaTodayWidget.tsx`
- `src/components/notifications/NotificationCenter.tsx`

## Task Breakdown
- [x] Schema: criar `agenda_events` e `agenda_reminders` com RLS e indices -> Verify: migration contem FKs, policies e indices por usuario/data.
- [x] Data: criar API que agrega eventos manuais, atividades, contratos ativos e transacoes -> Verify: hook retorna eventos tipados por fonte.
- [x] Previsoes: criar `contract_expected_payments` e RPC idempotente para contratos ativos -> Verify: previsoes nao entram em `financial_transactions`.
- [x] Baixa: criar RPC `record_expected_contract_payment` -> Verify: nao duplica receita igual ja registrada no mes.
- [x] Lembretes: processar `agenda_reminders` vencidos como notificacoes internas -> Verify: sem email, WhatsApp ou canal externo.
- [x] UI: construir pagina Agenda responsiva com calendario e painel do dia -> Verify: mobile empilha filtros/calendario/lista sem overflow.
- [x] Navigation: renomear Atividades para Agenda e adicionar rota `/agenda` -> Verify: sidebar e badge de data levam para Agenda.
- [x] Dashboard: substituir widget compacto de Atividades por Hoje no Domus -> Verify: mostra hoje, atrasados, 7 dias e baixa de recebimento.
- [x] Notificacoes: conectar sino do header a central real -> Verify: lembretes da Agenda aparecem e abrem `/agenda`.
- [x] Compatibility: redirecionar aliases `/activities/*` -> Verify: novas criacoes abrem `/agenda?new=1`.
- [x] Verification: rodar build/lint quando possivel -> Verify: sem erros bloqueantes novos.

## Phase X: Verification
- [x] `npm run build`
- [x] ESLint focado nos arquivos novos da Agenda
- [x] Revisao manual de acessibilidade basica: botoes com labels, foco visivel e textos sem overflow.
- [x] Conferir que nenhum dado de outro usuario/org fica exposto por RLS.

## Phase X Complete
- Build: Passou em 2026-05-31.
- Lint focado: Passou nos arquivos novos da Agenda.
- Hardening: `contract_expected_payments`, `generate_contract_expected_payments`, `process_due_agenda_reminders` e `record_expected_contract_payment` adicionados.
- Dashboard e notificacoes: `AgendaTodayWidget` e `NotificationCenter` integrados ao layout.
- Lint global: ainda falha por debitos existentes fora do modulo Agenda.
