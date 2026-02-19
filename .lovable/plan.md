
# Reorganizacao e Consolidacao do App

## Problemas Identificados

1. **AssessmentTab duplicado**: aparece na pagina Progresso (aba "Avaliacao") E dentro do dialogo de edicao do aluno (aba "Relatorio")
2. **Geracao de PDF espalhada**: Profile.tsx tem PDF generico, AssessmentTab tem PDF de avaliacao, Progress bio tab tem PDF de bioimpedancia
3. **Avaliacao travada**: O botao "Salvar Avaliacao" exige que TODAS as 7 dobras cutaneas estejam preenchidas. Se o usuario quer registrar apenas perimetros ou apenas peso, nao consegue salvar
4. **Funcionalidades de progresso fragmentadas**: fotos, bio, comparacao, avaliacao e PDFs estao em locais diferentes

## Plano de Mudancas

### 1. Destravar a Avaliacao (NewAssessmentDialog)
- Remover a exigencia de todos os campos de dobras para salvar
- Tornar campos de dobras opcionais - calcular composicao corporal apenas quando todos estiverem preenchidos
- Exigir apenas: data, peso (minimo para gerar graficos uteis)
- Se o usuario preencher apenas perimetros, salvar apenas perimetros e gerar graficos de perimetros
- Se preencher dobras tambem, calcular automaticamente gordura/massa magra como ja faz

### 2. Consolidar tudo na pagina Progresso
A pagina Progresso ja tem as 4 abas (Fotos, Comparar, Bio, Avaliacao). Ela sera o hub central. Ajustes:
- **Manter as 4 abas como estao** (ja estao bem organizadas)
- **Adicionar botao de PDF** na area do header (ao lado do seletor de aluno), gerando um relatorio completo que inclui bio + avaliacao + fotos
- **Adicionar botao de codigo de acesso** do aluno no header tambem (ou como link para o portal)

### 3. Remover redundancias
- **Students.tsx**: remover a aba "Relatorio" do dialogo de edicao do aluno. O dialogo fica apenas com "Dados" (cadastro). O progresso/relatorio e acessado pela pagina Progresso
- **Profile.tsx**: remover a secao "Relatorio PDF" (botoes de gerar PDF por aluno). Essa funcao migra para a pagina Progresso
- Manter a geracao de codigo de acesso no Profile (faz sentido la como ferramenta do trainer)

### 4. Resumo das mudancas por arquivo

| Arquivo | Acao |
|---------|------|
| `src/components/NewAssessmentDialog.tsx` | Tornar dobras opcionais; salvar com apenas data+peso |
| `src/pages/Progress.tsx` | Adicionar botao PDF completo no header |
| `src/pages/Students.tsx` | Remover aba "Relatorio" do dialogo de edicao |
| `src/pages/Profile.tsx` | Remover secao "Relatorio PDF" |

## Detalhes Tecnicos

### NewAssessmentDialog - destravar avaliacao
- Mudar a logica do `calc` para ser opcional: se dobras preenchidas, calcula; senao, `null`
- Mudar a validacao do `handleSave`: exigir apenas `measuredAt` e `weight`
- O botao salvar fica habilitado com peso preenchido (sem necessidade de dobras)
- Campos de composicao corporal (`body_density`, `body_fat_pct`, `fat_mass_kg`, `lean_mass_kg`, `sum_skinfolds`) ficam `null` quando dobras nao estao completas

### Students.tsx - simplificar dialogo
- Remover import do `AssessmentTab`
- Remover o sistema de Tabs do dialogo de edicao (nao precisa mais de "Dados" / "Relatorio")
- Renderizar diretamente o `StudentForm` sem wrapper de tabs

### Progress.tsx - adicionar PDF completo
- Adicionar um botao "PDF" ao lado do seletor de aluno
- Reutilizar `generateAssessmentPdf` e `generateBioimpedancePdf` existentes ou criar um PDF unificado

### Profile.tsx - limpar
- Remover a secao de "Relatorio PDF" com os botoes de alunos
- Manter: perfil, plano, codigo de acesso, notificacoes
