
## Sistema de Pagamento SaaS (Stripe + PIX)

Implementar o fluxo de cobranca para personal trainers que atingem 5 alunos ativos, oferecendo Stripe (cartao) e PIX como opcoes de pagamento.

---

### Regra de Negocio

- Cadastro de alunos e ilimitado
- Ate 5 alunos ativos: plano gratuito, acesso completo
- A partir do 6o aluno ativo: exibir modal de upgrade obrigatorio
- Somente apos pagamento (Stripe ou PIX) o trainer pode ter mais de 5 alunos ativos
- O acesso a dados (fotos, bioimpedancia, agenda, visualizacao) e liberado apenas para alunos ativos dentro do limite do plano

---

### Fase 1: Integrar Stripe

1. Habilitar a integracao Stripe no projeto (solicitar chave secreta ao usuario)
2. Criar edge function `create-checkout` que:
   - Recebe o trainer_id
   - Cria um checkout session do Stripe para o plano premium (R$ 9,90/mes recorrente)
   - Retorna a URL de checkout
3. Criar edge function `stripe-webhook` que:
   - Recebe eventos do Stripe (checkout.session.completed, invoice.paid, customer.subscription.deleted)
   - Atualiza `trainer_subscriptions` com plan='premium', status, expires_at
4. Configurar produto e preco no Stripe via API na edge function

---

### Fase 2: Opcao PIX

1. Adicionar no modal de upgrade um botao "Pagar via PIX"
2. Ao clicar, exibir chave PIX fixa (configurada pelo admin) e instrucoes
3. Registrar na tabela `trainer_subscriptions` com status='pending_pix'
4. Admin confirma o pagamento manualmente no painel `/admin/users` (botao "Confirmar PIX")
5. Ao confirmar, atualizar para plan='premium', status='active'

---

### Fase 3: Modal de Upgrade (Tela do Trainer)

1. Criar componente `StudentLimitModal`:
   - Exibido automaticamente quando trainer no plano free tenta cadastrar o 6o aluno ativo
   - Mostra: "Voce atingiu o limite de 5 alunos ativos no plano gratuito"
   - Dois botoes: "Assinar com Cartao (R$ 9,90/mes)" e "Pagar via PIX"
   - Botao Stripe redireciona para o checkout
   - Botao PIX mostra QR code / chave PIX
2. Integrar o modal na pagina Students.tsx (antes de criar aluno, verificar limite)

---

### Fase 4: Indicador de Slots no Dashboard do Trainer

1. Criar hook `useTrainerSubscription` que retorna:
   - Plano atual (free/premium)
   - Contagem de alunos ativos
   - Slots disponiveis (5 - ativos se free, ou "Ilimitado" se premium)
2. Mostrar no Index.tsx um card/badge: "3/5 alunos ativos" ou "Ilimitado"
3. Na pagina Students.tsx, mostrar alerta quando proximo do limite (4/5)

---

### Fase 5: Painel Admin - Confirmacao PIX

1. Adicionar na tabela de usuarios (`/admin/users`) uma coluna de acao "Confirmar PIX" para trainers com status='pending_pix'
2. Ao confirmar, atualizar subscription para premium ativo

---

### Fase 6: Controle de Acesso por Limite

1. Atualizar o trigger `check_student_limit` existente:
   - Permitir INSERT de alunos sempre (cadastro ilimitado)
   - Bloquear UPDATE de status para 'active' quando free e ja tem 5 ativos
2. No StudentPortal (portal do aluno), verificar se o aluno esta ativo antes de exibir dados
3. Na UI do trainer, alunos alem do limite ficam visiveis mas com status 'inactive' ate o upgrade

---

### Secao Tecnica

**Novas Edge Functions:**

```text
supabase/functions/
  create-checkout/index.ts    -- Cria sessao Stripe checkout
  stripe-webhook/index.ts     -- Recebe webhooks do Stripe
```

**Config.toml atualizado:**
```text
[functions.create-checkout]
verify_jwt = false

[functions.stripe-webhook]
verify_jwt = false
```

**Novos componentes:**
```text
src/components/StudentLimitModal.tsx   -- Modal de upgrade
src/hooks/useTrainerSubscription.ts    -- Hook com dados do plano
```

**Arquivos modificados:**
```text
src/pages/Students.tsx        -- Verificacao de limite antes de criar aluno
src/pages/Index.tsx            -- Badge de slots disponiveis
src/hooks/useAdminData.ts      -- Mutation para confirmar PIX
src/components/admin/TrainersTable.tsx -- Botao confirmar PIX
src/pages/StudentPortal.tsx    -- Verificar status ativo do aluno
```

**Migracao SQL:**
```text
-- Atualizar trigger check_student_limit para a nova logica
-- Adicionar status 'pending_pix' como opcao valida
-- Ajustar para permitir cadastro mas bloquear ativacao alem do limite
```

**Fluxo Stripe:**
```text
1. Trainer clica "Assinar" -> chama edge function create-checkout
2. Edge function cria Stripe Checkout Session (mode: subscription)
3. Trainer completa pagamento no Stripe
4. Stripe envia webhook -> edge function stripe-webhook
5. Webhook atualiza trainer_subscriptions (plan: premium, status: active)
6. Trainer pode ter alunos ilimitados
```

**Fluxo PIX:**
```text
1. Trainer clica "Pagar via PIX"
2. Modal mostra chave PIX e valor (R$ 9,90)
3. Trainer faz transferencia e avisa
4. Admin ve no painel que ha um "PIX pendente"
5. Admin confirma -> subscription atualizada para premium
```

---

### Ordem de Implementacao

1. Habilitar Stripe (solicitar chave)
2. Criar edge functions (create-checkout + stripe-webhook)
3. Criar componente StudentLimitModal
4. Criar hook useTrainerSubscription
5. Integrar modal na pagina Students
6. Adicionar badge de slots no Index
7. Atualizar painel admin com confirmacao PIX
8. Ajustar trigger SQL
9. Testar fluxo completo
