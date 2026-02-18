

## Painel de Assinatura na Tela do Trainer

Criar uma secao dedicada na pagina de Perfil (`/profile`) para que o trainer visualize e gerencie sua assinatura diretamente.

---

### O que sera adicionado

Uma nova secao "Meu Plano" na pagina de Perfil, entre o card do perfil e as ferramentas existentes, contendo:

1. **Card do plano atual** mostrando:
   - Nome do plano (Gratuito ou Premium)
   - Badge de status (Ativo, Pendente PIX, etc.)
   - Barra de progresso de slots usados (ex: "3/5 alunos ativos")
   - Data de expiracao (se Premium)

2. **Botoes de acao**:
   - Se plano Gratuito: botao "Fazer Upgrade" que abre o `StudentLimitModal` ja existente
   - Se Premium: botao "Gerenciar Assinatura" (futura integracao com portal Stripe)
   - Se PIX pendente: indicador visual de "Aguardando confirmacao"

3. **Indicador visual de limite**:
   - Barra de progresso colorida (verde ate 3/5, amarelo em 4/5, vermelho em 5/5)
   - Texto "Ilimitado" com icone de coroa para Premium

---

### Secao Tecnica

**Arquivo modificado:**
- `src/pages/Profile.tsx`: adicionar secao "Meu Plano" usando o hook `useTrainerSubscription` e o componente `StudentLimitModal` ja existentes

**Componentes reutilizados:**
- `useTrainerSubscription` (hook com dados do plano, slots, status)
- `StudentLimitModal` (modal de upgrade Stripe/PIX)
- `Progress` (barra de progresso do shadcn/ui)
- `Badge` (badge de status)
- `Card` (container visual)

**Nenhum novo arquivo sera criado** -- tudo sera adicionado dentro de `Profile.tsx` usando componentes e hooks existentes.

**Estrutura da nova secao:**

```text
Profile.tsx
  [Card perfil existente]
  [NOVA SECAO: Meu Plano]
    - Card com plano atual + badge status
    - Progress bar de slots (slotsUsed / slotsTotal)
    - Botao upgrade (free) ou gerenciar (premium)
  [Ferramentas existentes]
```

**Dados utilizados do hook `useTrainerSubscription`:**
- `plan` (free/premium)
- `status` (active/pending_pix)
- `isPremium`
- `isPendingPix`
- `slotsUsed`
- `slotsTotal`
- `isNearLimit`

