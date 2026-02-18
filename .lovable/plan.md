
## PDF de Bioimpedancia com Fotos + Logo em Todo o App

Tres mudancas: (1) criar gerador de PDF para bioimpedancia com comparativo e fotos de progresso, (2) substituir a logo do app pela imagem enviada em todos os lugares, (3) usar a logo no cabecalho do PDF.

---

### 1. PDF de Bioimpedancia com Fotos

Um botao de download sera adicionado em cada card de bioimpedancia na aba "Bio" da pagina de Progresso. O PDF gerado contera:

- **Cabecalho**: Logo do app + nome do aluno + data
- **Dados da Bioimpedancia**: Peso, Gordura (%), Massa Muscular, Gordura Visceral, TMB, Agua Corporal (%), Massa Ossea
- **Comparativo**: Se houver mais de um registro, mostra uma tabela comparando o primeiro e o ultimo registro com as diferencas (setas para cima/baixo)
- **Fotos de Progresso**: Agrupadas por data, lado a lado (ate 3 por linha), em paginas separadas -- mesma logica que ja existe no PDF de avaliacao

---

### 2. Logo em Todo o App

A imagem enviada (relogio com braco musculoso) sera copiada para `src/assets/logo.png` e usada em:

- **Tela de Login (Auth.tsx)**: Substituir o icone Dumbbell pela imagem
- **Loading Screen**: Substituir o icone Dumbbell pela imagem
- **Portal do Aluno**: Substituir o icone Dumbbell pela imagem
- **PWA Icons**: Copiar para `public/icon-192.png` e `public/icon-512.png`
- **Cabecalho do PDF**: Inserir a logo no topo do relatorio

---

### Secao Tecnica

**Novo arquivo: `src/lib/generateBioimpedancePdf.ts`**
- Funcao `async generateBioimpedancePdf(records, studentName, photos?)`
- Recebe array de registros de bioimpedancia (tipo da tabela `bioimpedance`)
- Cabecalho com logo (carregada de `/icon-192.png` via base64) + nome + data
- Secao de dados do registro selecionado
- Secao comparativa: tabela com colunas "Primeiro | Atual | Diferenca" mostrando evolucao de cada metrica
- Secao de fotos: reutiliza a mesma logica de `loadImageAsBase64` e agrupamento por data do `generateAssessmentPdf.ts`
- Download automatico do arquivo

**Arquivo modificado: `src/pages/Progress.tsx`**
- Importar `generateBioimpedancePdf` e `useProgressPhotos` (ja importado)
- Adicionar icone `FileDown` em cada card de bioimpedancia
- Ao clicar, chamar a funcao passando todos os registros do aluno + fotos

**Arquivo modificado: `src/pages/Auth.tsx`**
- Importar `logo` de `@/assets/logo.png`
- Substituir `<Dumbbell>` por `<img src={logo}>` na area do logo

**Arquivo modificado: `src/components/LoadingScreen.tsx`**
- Importar `logo` de `@/assets/logo.png`
- Substituir `<Dumbbell>` por `<img src={logo}>` com animacao mantida

**Arquivo modificado: `src/pages/StudentPortal.tsx`**
- Importar `logo` de `@/assets/logo.png`
- Substituir `<Dumbbell>` por `<img src={logo}>`

**Arquivo copiado: logo para `src/assets/logo.png`**
- Imagem enviada pelo usuario

**Arquivos copiados: `public/icon-192.png` e `public/icon-512.png`**
- Mesma imagem para os icones PWA

**Arquivo modificado: `src/lib/generateAssessmentPdf.ts`**
- Adicionar logo no cabecalho do PDF de avaliacao fisica tambem (consistencia)
