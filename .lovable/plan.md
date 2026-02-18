
## Refatorar aba Financeiro -- nova aba na barra inferior + melhorias inteligentes

### O que muda

**1. Financeiro como 5a aba na barra inferior**
A aba "Financeiro" sera adicionada como ultimo item do BottomNav, com icone de `DollarSign`. A navegacao ficara:
Agenda | Alunos | Progresso | Perfil | Financeiro

**2. Alerta de vencimentos do dia na tela principal**
Na pagina Finance, um banner no topo mostrara quais alunos tem `payment_due_day` igual ao dia de hoje (campo ja existente na tabela `students`). Isso funciona como lembrete visual: "Hoje e dia de recebimento de 3 alunos".

**3. Geracao automatica de cobrancas mensais**
Ao abrir a tela do mes, o sistema verificara quais alunos ativos (com `plan_value` e `payment_due_day`) ainda nao possuem registro de pagamento para aquele mes e criara automaticamente registros com status `pending`. Isso elimina trabalho manual.

**4. Barra de progresso de recebimento**
Substituir os 3 cards de resumo por uma visualizacao mais intuitiva: uma barra de progresso mostrando "Recebido vs Previsto" com porcentagem, acompanhada dos valores abaixo.

**5. Destaque visual para vencimentos proximos**
Na lista de alunos pendentes, mostrar em vermelho quem ja passou do `payment_due_day` (atrasado) e em amarelo quem vence hoje. Marcar automaticamente como `overdue` pagamentos cujo dia de vencimento ja passou no mes atual.

**6. Acao rapida de cobrar via WhatsApp em lote**
Botao "Cobrar pendentes" que abre WhatsApp sequencialmente para todos os alunos com pagamentos pendentes/atrasados do mes.

---

### Secao Tecnica

**Arquivos modificados:**

1. **`src/components/BottomNav.tsx`**
   - Adicionar 5o item: `{ icon: DollarSign, label: 'Financeiro', path: '/finance' }`
   - Importar `DollarSign` do lucide-react

2. **`src/pages/Finance.tsx`** (refatoracao principal)
   - Adicionar logica de "vencimentos de hoje": filtrar `students` onde `payment_due_day === new Date().getDate()`
   - Banner no topo: "Hoje e dia de recebimento de X alunos" com lista compacta e botao de cobrar via WhatsApp
   - Auto-gerar pagamentos pendentes: `useEffect` que, ao carregar o mes, verifica alunos ativos sem registro e cria com `useCreatePayment`
   - Substituir grid de 3 cards por barra de progresso (recebido/previsto)
   - Marcar como `overdue` automaticamente: pagamentos `pending` cujo `payment_due_day` do aluno ja passou no mes visualizado
   - Botao "Cobrar todos pendentes" para abrir WhatsApp em sequencia
   - Ao selecionar aluno no dialog de novo pagamento, preencher automaticamente o valor com `plan_value` do aluno

3. **`src/hooks/usePayments.ts`**
   - Adicionar funcao `useAutoGeneratePayments` que recebe mes e lista de alunos, verifica quais ja tem registro e cria os faltantes
   - Adicionar funcao `useMarkOverdue` que atualiza status baseado no `payment_due_day`

**Nenhuma migracao de banco necessaria** -- o campo `payment_due_day` ja existe na tabela `students`.
