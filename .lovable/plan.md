

## Corrigir OCR de Bioimpedancia: Upload de Arquivo em vez de Foto

A funcionalidade de extracao automatica de dados da balanca sera ajustada para aceitar upload de arquivo (PDF ou imagem do laudo) em vez de tirar foto da tela da balanca.

---

### Mudancas

**Arquivo: `src/pages/Progress.tsx`**

1. **Titulo e descricao do dialog OCR**: Trocar de "Bioimpedancia por Foto" / "Tire foto da tela da balanca" para "Bioimpedancia por Arquivo" / "Envie o laudo da balanca (PDF ou imagem) para extrair os dados automaticamente"
2. **Input de arquivo**: Remover o atributo `capture="environment"` (que forca a camera) e ajustar o `accept` para aceitar tambem PDFs: `accept="image/*,.pdf"`
3. **Texto do placeholder**: Trocar "Clique para selecionar a foto da balanca" para "Clique para enviar o laudo ou imagem"
4. **Icone**: Trocar `ScanLine` por `FileText` ou `Upload` no titulo e na area de drop para ficar mais coerente com upload de arquivo
5. **Preview**: Quando o arquivo for PDF, mostrar o nome do arquivo em vez de tentar exibir como imagem

---

### Secao Tecnica

Todas as mudancas sao no arquivo `src/pages/Progress.tsx`, no bloco do dialog OCR (linhas ~329-388):

- Linha 334: Trocar titulo de "Bioimpedancia por Foto" para "Bioimpedancia por Arquivo"
- Linha 336: Trocar descricao para "Envie o laudo da balanca (PDF ou imagem) para extrair os dados"
- Linha 356-357: Trocar icone e texto do placeholder
- Linha 360: Remover `capture="environment"` e mudar `accept` para `"image/*,.pdf"`
- Adicionar logica para mostrar nome do arquivo quando for PDF em vez de preview de imagem

