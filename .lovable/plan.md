

## 1. Icones sugestivos para grupos musculares

Trocar os emojis genericos (quadrados coloridos) por emojis que representam visualmente cada grupo muscular:

| Grupo | Atual | Novo |
|-------|-------|------|
| Peito | `🟦` | `🫁` |
| Costas | `🟪` | `🔙` |
| Ombros | `🟨` | `🏋️` |
| Biceps | `🟥` | `💪` |
| Triceps | `🟩` | `🦾` |
| Quadriceps | `🔵` | `🦵` |
| Posterior | `🩷` | `🦿` |
| Gluteos | `🟧` | `🍑` |
| Panturrilha | `🩵` | `🦶` |
| Abdomen | `💜` | `🎯` |
| Cardio | `💚` | `❤️‍🔥` |

**Arquivo:** `src/lib/constants.ts` -- alterar o campo `emoji` de cada item no array `MUSCLE_GROUPS`.

---

## 2. Pagamento rapido com swipe/tap direto na lista

Atualmente, para marcar como pago o usuario ja pode clicar no icone de status (circulo). Mas para simplificar ainda mais:

- Na lista de pagamentos do Financeiro, adicionar um **botao "Receber"** visivel diretamente em cada card de pagamento pendente/atrasado. Um unico toque marca como `paid` sem dialogs.
- Quando o pagamento ja esta pago, o botao desaparece e mostra apenas o check verde.
- Isso elimina a necessidade de abrir qualquer dialog para a acao mais comum (registrar recebimento).

**Arquivo:** `src/pages/Finance.tsx`
- Na lista `filtered.map(...)`, para pagamentos com status `pending` ou `overdue`, exibir um botao compacto "Receber" ao lado do valor que chama `togglePaid(payment)` diretamente.
- Manter o botao circular de status existente tambem clicavel, mas agora o botao textual "Receber" torna a acao mais obvia e acessivel.

---

### Secao Tecnica

**`src/lib/constants.ts`**
- Substituir os 11 valores de `emoji` no array `MUSCLE_GROUPS`

**`src/pages/Finance.tsx`**
- Na area do card de cada pagamento (linhas 251-284), adicionar um `<Button>` compacto "Receber" com `variant="ghost"` e `size="sm"` que aparece apenas quando `payment.status !== 'paid'`
- O botao chama `togglePaid(payment)` diretamente
- Layout: mover o valor e acoes para uma segunda linha, e colocar o botao "Receber" alinhado a direita na primeira linha ao lado do nome

