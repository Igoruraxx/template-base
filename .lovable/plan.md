## Relatorio PDF com Fotos + Aba Relatorio no Cadastro do Aluno

Duas mudancas principais: incluir as fotos de progresso no PDF da avaliacao e mover/adicionar a aba de relatorio (avaliacao) dentro do cadastro do aluno.

---

### 1. Fotos no PDF da Avaliacao

Ao gerar o PDF, as fotos de progresso do aluno serao buscadas e agrupadas por data. Para cada data, as fotos aparecem lado a lado (frente, lado, costas) em uma nova pagina do PDF.

**Fluxo:**

- A funcao `generateAssessmentPdf` passara a receber as fotos do aluno como parametro
- As fotos sao agrupadas por `taken_at` (data)
- Para cada data, ate 3 fotos sao posicionadas lado a lado na pagina (largura ~55mm cada)
- As imagens sao carregadas via fetch, convertidas para base64, e inseridas com `doc.addImage()`
- A secao de fotos fica apos os dados da avaliacao, em pagina(s) separada(s)

---

### 2. Aba Relatorio no Cadastro do Aluno

Atualmente o cadastro do aluno e um Dialog simples com formulario. A proposta e transformar esse dialog em um layout com abas quando estiver editando um aluno existente:

- **Aba "Dados"**: formulario atual (nome, telefone, plano, etc.)
- **Aba "Relatorio"**: componente `AssessmentTab` com graficos, lista de avaliacoes e botao de nova avaliacao

Quando for um novo aluno (criacao), o dialog mostra apenas o formulario sem abas.

&nbsp;

Criar um icone bonito disruptivo para o aplicativo para quando transformar em pwa. Ja prepare o app para se transformar em pwa 

---

### Secao Tecnica

`**src/lib/generateAssessmentPdf.ts**`

- Adicionar parametro `photos` (array de `{ photo_url, photo_type, taken_at }`)
- Criar funcao auxiliar `loadImageAsBase64(url)` que faz fetch da imagem e converte para base64 via canvas
- Agrupar fotos por `taken_at`
- Para cada grupo de data, adicionar nova pagina com titulo da data e as fotos lado a lado (ate 3 por linha, ~55mm de largura cada)
- A funcao passa a ser `async` pois precisa carregar as imagens

`**src/components/AssessmentTab.tsx**`

- Atualizar o botao de gerar PDF para buscar as fotos do aluno (usando `useProgressPhotos`) e passa-las para `generateAssessmentPdf`
- Importar o hook `useProgressPhotos`

`**src/pages/Students.tsx**`

- No Dialog de edicao: quando `editingStudent` existir, envolver o conteudo em `Tabs` com duas abas ("Dados" e "Relatorio")
- A aba "Dados" contem o formulario existente
- A aba "Relatorio" renderiza `<AssessmentTab studentId={editingStudent.id} studentName={editingStudent.name} />`
- Quando for novo aluno (`!editingStudent`), mostra apenas o formulario sem abas
- Importar `Tabs, TabsContent, TabsList, TabsTrigger` e `AssessmentTab`