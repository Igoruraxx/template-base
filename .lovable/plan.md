

## Avaliacao Fisica -- Pollock 7 Dobras + Perimetria

Nova aba "Avaliacao" na pagina de Progresso com formulario de entrada, calculos automaticos (Pollock + Siri), 3 graficos de evolucao e analise humanizada comparativa.

---

### Visao Geral

Uma nova aba sera adicionada ao lado de "Fotos", "Comparar" e "Bio" na pagina de Progresso. Ao abrir, o personal ve a lista de avaliacoes do aluno, com graficos de evolucao e botao para nova avaliacao. Todos os calculos (densidade corporal, percentual de gordura, massa magra/gorda) sao feitos automaticamente no frontend a partir das dobras inseridas.

---

### Fluxo do Usuario

1. Seleciona aluno na pagina de Progresso
2. Clica na nova aba "Avaliacao"
3. Ve historico de avaliacoes + graficos de evolucao
4. Clica "Nova Avaliacao" para abrir dialog
5. Preenche sexo, idade, peso, dobras e perimetros
6. Os calculos aparecem automaticamente conforme digita
7. Salva -- o registro aparece na lista com analise humanizada

---

### Secao Tecnica

**1. Nova tabela no banco: `assessments`**

Migracao SQL para criar a tabela com todos os campos:

```text
Campos:
- id (uuid, PK)
- student_id (uuid, FK -> students)
- trainer_id (uuid)
- measured_at (date)
- sex (text: 'male' | 'female')
- age (integer)
- weight (numeric)

Dobras (7, em mm):
- skinfold_chest, skinfold_axillary, skinfold_triceps
- skinfold_subscapular, skinfold_abdominal
- skinfold_suprailiac, skinfold_thigh

Perimetros (em cm):
- perim_neck, perim_shoulder, perim_chest
- perim_waist, perim_abdomen, perim_hip
- perim_arm_relaxed, perim_arm_contracted
- perim_forearm, perim_thigh_proximal
- perim_thigh_mid, perim_calf

Calculados:
- body_density (numeric)
- body_fat_pct (numeric)
- fat_mass_kg (numeric)
- lean_mass_kg (numeric)
- sum_skinfolds (numeric)

- notes (text)
- created_at (timestamptz)
```

RLS: mesmo padrao das outras tabelas (trainer_id = auth.uid() para CRUD, admin para SELECT).

**2. Novo hook: `src/hooks/useAssessments.ts`**

- `useAssessments(studentId)` -- lista avaliacoes ordenadas por data
- `useCreateAssessment()` -- calcula densidade/gordura antes de inserir
- `useDeleteAssessment()` -- deleta registro

**3. Logica de calculo: `src/lib/pollock.ts`**

Funcoes puras:

- `calcDensityPollock7(sex, age, sumSkinfolds)` -- aplica a formula de Pollock de 7 dobras
  - Homem: DC = 1.112 - 0.00043499 * S + 0.00000055 * S^2 - 0.00028826 * age
  - Mulher: DC = 1.097 - 0.00046971 * S + 0.00000056 * S^2 - 0.00012828 * age
- `calcBodyFatSiri(density)` -- G% = (4.95/DC - 4.50) * 100
- `calcComposition(weight, fatPct)` -- retorna fat_mass_kg e lean_mass_kg

**4. Pagina de Progresso: nova aba "Avaliacao"**

Adicionar 4a aba no `TabsList` existente: `<TabsTrigger value="assessment">Avaliacao</TabsTrigger>`

Conteudo da aba:
- Botao "Nova Avaliacao" no topo
- 3 graficos de evolucao (Recharts, ja instalado):
  - Grafico 1: Composicao Corporal (G% + Peso)
  - Grafico 2: Perimetros (todas as medidas em cm)
  - Grafico 3: Dobras (7 dobras em mm)
- Lista de avaliacoes com cards mostrando data, resumo dos valores e botao de deletar
- Analise humanizada: comparacao entre primeira e ultima avaliacao com texto motivacional

**5. Dialog de nova avaliacao**

Dialog com scroll dividido em secoes:
- Dados basicos: data, sexo (select M/F), idade, peso
- Dobras cutaneas: 7 campos numericos em grid 2 colunas
- Perimetros: 12 campos numericos em grid 2 colunas
- Preview dos calculos em tempo real (densidade, G%, massa gorda, massa magra)
- Botao salvar

**6. Analise humanizada**

Componente que compara a primeira e ultima avaliacao e gera frases simples como:
- "Voce perdeu 2.3kg de gordura e ganhou 1.1kg de musculo!"
- "Sua cintura reduziu 3cm -- otimo progresso!"
- "Seu percentual de gordura caiu de 22% para 18%"

A logica e puramente frontend, comparando campos numericos entre os dois registros.

**Arquivos criados:**
- `src/lib/pollock.ts` (funcoes de calculo)
- `src/hooks/useAssessments.ts` (hook de dados)
- `src/components/AssessmentTab.tsx` (componente da aba com graficos + lista)
- `src/components/NewAssessmentDialog.tsx` (dialog de nova avaliacao)
- `src/components/AssessmentAnalysis.tsx` (analise humanizada)

**Arquivos modificados:**
- `src/pages/Progress.tsx` (adicionar aba + importar componentes)

