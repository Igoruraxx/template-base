

## Gerar PDF da Avaliacao Fisica

Adicionar um botao em cada card de avaliacao para gerar e baixar um PDF completo com todos os dados, usando a biblioteca `jsPDF` que ja esta instalada no projeto.

---

### O que o PDF vai conter

1. **Cabecalho**: Titulo "Avaliacao Fisica", nome do aluno e data da avaliacao
2. **Dados Gerais**: Sexo, idade, peso
3. **Composicao Corporal**: Densidade corporal, percentual de gordura, massa gorda e massa magra
4. **Tabela de Dobras Cutaneas**: As 7 dobras com valores em mm e a soma total
5. **Tabela de Perimetros**: Os 12 perimetros com valores em cm
6. **Observacoes**: Se houver notas registradas

---

### Mudancas

**Novo arquivo: `src/lib/generateAssessmentPdf.ts`**
- Funcao que recebe um objeto `Assessment` e o nome do aluno
- Usa `jsPDF` para montar o documento com tabelas formatadas
- Retorna o download automatico do PDF

**Arquivo modificado: `src/components/AssessmentTab.tsx`**
- Importar a funcao de geracao de PDF
- Buscar o nome do aluno (receber via prop ou buscar do hook `useStudents`)
- Adicionar um botao com icone `FileDown` ao lado do botao de deletar em cada card de avaliacao
- Ao clicar, chama a funcao de geracao e faz o download

---

### Secao Tecnica

**`src/lib/generateAssessmentPdf.ts`**
- Importa `jsPDF` (ja instalado)
- Cria documento A4, adiciona titulo, dados do aluno, tabelas de dobras e perimetros com `doc.text()` e posicionamento manual
- Chama `doc.save('avaliacao-NOME-DATA.pdf')`

**`src/components/AssessmentTab.tsx`**
- Adicionar prop `studentName` na interface `Props`
- Importar `FileDown` do lucide-react
- Adicionar botao de PDF no card, ao lado do Trash2
- O `Progress.tsx` precisara passar o `studentName` como prop (buscar do array `students` pelo `selectedStudent`)

**`src/pages/Progress.tsx`**
- Passar o nome do aluno selecionado para `AssessmentTab` via prop `studentName`

