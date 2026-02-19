
# Ocultar aba de horarios para alunos de consultoria

## O que muda

No formulario de cadastro/edicao de alunos (`src/pages/Students.tsx`), quando o switch "Consultoria" estiver ativado, as seguintes secoes serao ocultadas:

1. **Frequencia semanal** (botoes 1x a 6x)
2. **Dias e horarios** (selects de dia da semana + inputs de hora)

Isso faz sentido porque alunos de consultoria nao tem sessoes presenciais com horario fixo na semana.

## Detalhes tecnicos

### Arquivo: `src/pages/Students.tsx`

No componente `StudentForm`, envolver os blocos de "Frequencia semanal" (linhas 509-522) e "Dias e horarios" (linhas 524-551) em uma condicional `{!form.is_consulting && (...)}`.

Nenhum outro arquivo precisa ser alterado. A mudanca e puramente visual no formulario.
