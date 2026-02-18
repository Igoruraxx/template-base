
## Correção da Aba Progresso e Comparativo de Fotos

### Problemas Identificados

1. **Bug principal no comparativo (BeforeAfterComparison.tsx)**: O componente usa `useMemo` com `setState` dentro, o que e um anti-pattern do React. Isso causa comportamento imprevisivel - as datas "antes" e "depois" podem nao ser selecionadas automaticamente, ou o componente pode nao reagir corretamente a mudancas.

2. **Dependencias faltando**: O `useMemo` de auto-selecao usa `beforeDate` e `afterDate` mas nao os inclui nas dependencias, causando closures desatualizadas.

3. **Reset ao trocar aluno**: Quando o usuario troca de aluno, os estados `beforeDate`/`afterDate` do comparativo nao resetam, mostrando dados do aluno anterior.

---

### Correcoes

**Arquivo: `src/components/BeforeAfterComparison.tsx`**

- Trocar o `useMemo` com side effects (linhas 44-49) por `useEffect` para auto-selecionar primeira e ultima data
- Adicionar `useEffect` para resetar selecoes quando as fotos mudam (troca de aluno)
- Garantir que `parseISO` funciona corretamente com datas no formato `YYYY-MM-DD`

**Arquivo: `src/pages/Progress.tsx`**

- Verificar que o componente `BeforeAfterComparison` recebe props corretas
- Sem mudancas necessarias neste arquivo

---

### Secao Tecnica

Mudanca principal em `BeforeAfterComparison.tsx`:

```
// ANTES (bugado):
useMemo(() => {
  if (dates.length >= 2 && !beforeDate && !afterDate) {
    setBeforeDate(dates[0]);
    setAfterDate(dates[dates.length - 1]);
  }
}, [dates]);

// DEPOIS (correto):
useEffect(() => {
  if (dates.length >= 2) {
    setBeforeDate(dates[0]);
    setAfterDate(dates[dates.length - 1]);
  } else if (dates.length === 1) {
    setBeforeDate(dates[0]);
    setAfterDate('');
  } else {
    setBeforeDate('');
    setAfterDate('');
  }
}, [dates]);
```

Isso garante que:
- Ao selecionar um aluno, as datas sao auto-preenchidas
- Ao trocar de aluno, as datas resetam e atualizam
- O comparativo sempre mostra as fotos corretas
