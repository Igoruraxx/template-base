
## Melhorias na Aba Alunos, Agenda e Financeiro

Este plano cobre diversas funcionalidades novas distribuidas entre as abas de Alunos, Agenda e Financeiro.

---

### 1. Aba Alunos - Novas Funcionalidades

**1a. Inativar Aluno**
- Adicionar opcao "Inativar" no dropdown menu do card do aluno
- Ao inativar: muda status para "inactive", remove pagamentos pendentes/atrasados do aluno (deleta registros com status != paid), e exibe confirmacao
- Alunos inativos nao aparecem mais em listagens de cobranca

**1b. Excluir Sessoes Futuras**
- Nova opcao "Excluir sessoes futuras" no dropdown do aluno
- Deleta todas as sessoes do aluno com scheduled_date >= hoje
- Confirmacao antes de executar

**1c. Escolha de Plano com Dias/Horarios Flexiveis**
- No formulario do aluno, ao selecionar sessions_per_week (1-6x), abre dinamicamente campos para cada dia
- Cada dia e um par: seletor de dia da semana (seg-sab) + horario
- Permite dias e horarios diferentes (ex: seg 8h, qua 10h, sex 7h)
- Salvar como JSON na coluna `notes` ou em nova coluna `schedule_config` (jsonb) na tabela students

**1d. Tag "Lembrar"**
- Novo campo booleano `needs_reminder` na tabela students
- Quando marcado, exibe icone de sino no card do aluno e nas sessoes agendadas na agenda
- Na agenda, ao clicar no icone, abre WhatsApp com mensagem pre-criada: "Ola {nome}, lembrando do seu treino de {dia_semana}, dia {dia_mes} as {hora}. Te espero!"

**1e. Tag Consultoria Aprimorada**
- Alunos com `is_consulting = true` nao aparecem na agenda normal
- Sistema calcula 3 dias antes do vencimento (baseado no mes de referencia do ultimo pagamento ou campo `payment_due_day`)
- Exibe alerta no dashboard e na agenda nesse dia: "Atualizar treino de {nome} - vencimento em 3 dias"

---

### 2. Aba Agenda - Nova Grade Horaria

**2a. Visao por Hora (5h-22h)**
- Novo modo de visualizacao "Horario" alem de Dia/Semana
- Grade visual com slots de 1 hora das 05:00 ate 22:00 (17 slots)
- Sessoes existentes aparecem posicionadas no horario correto
- Slots vazios sao clicaveis para adicionar sessao rapida (pre-preenche data e hora)

**2b. Drag and Drop para Remarcar**
- Usar HTML5 Drag and Drop API (sem dependencia extra)
- Arrastar sessao de um slot para outro no mesmo dia
- Ao soltar, atualiza o horario da sessao via `useUpdateSession`
- Feedback visual durante arraste (sombra, highlight do slot destino)

---

### 3. Financeiro - Melhorias

**3a. Destaque Dourado no Dia de Pagamento**
- Adicionar campo `payment_due_day` (integer 1-31) na tabela students para dia de vencimento
- Na agenda, dias que coincidem com vencimento de algum aluno mostram indicador dourado
- Ao abrir o dia, exibe caixa de aviso: "{Nome} precisa efetuar pagamento hoje"

**3b. Datas Previstas e Rolagem Mes a Mes**
- Adicionar seletor de mes no topo do financeiro (setas esquerda/direita para navegar entre meses)
- Mostrar previsao de recebimentos: lista alunos ativos com seus valores de plano
- Marcar quem ja pagou (baixa) com check verde
- Resumo por mes: total previsto, total recebido, pendente

---

### Secao Tecnica

**Migracao de banco de dados:**
- Adicionar coluna `schedule_config` (jsonb, nullable) na tabela students - para guardar dias/horarios flexiveis
- Adicionar coluna `needs_reminder` (boolean, default false) na tabela students - tag de lembrete
- Adicionar coluna `payment_due_day` (integer, nullable) na tabela students - dia de vencimento

**Arquivos modificados:**
- `src/pages/Students.tsx` - dropdown com inativar, excluir sessoes futuras, tag lembrar; formulario com seletor de dias/horarios
- `src/hooks/useStudents.ts` - novas mutations para inativar (bulk delete payments + update status)
- `src/hooks/useSessions.ts` - nova mutation `useDeleteFutureSessions` para deletar sessoes >= hoje por student_id
- `src/pages/Schedule.tsx` - grade horaria 5h-22h, drag and drop, indicadores de lembrete e pagamento, alerta de consultoria
- `src/pages/Finance.tsx` - navegacao mes a mes, previsao de recebimentos, baixas
- `src/pages/Index.tsx` - alertas de consultoria proximo do vencimento
- `src/lib/whatsapp.ts` - nova funcao de mensagem de lembrete com dia/hora

**Nenhuma dependencia nova necessaria** - Drag and Drop usa API nativa do HTML5.
