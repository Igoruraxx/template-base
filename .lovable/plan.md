
## Upload Multi-Foto, OCR de Bioimpedancia e WhatsApp

Este plano cobre 3 grandes funcionalidades: upload de 3 fotos simultaneas, extracao automatica de dados de bioimpedancia via foto (usando IA), e botoes de WhatsApp para contato rapido, cobranca e compartilhamento de acesso.

---

### 1. Upload Multi-Foto (Frente, Lado, Costas)

Substituir o dialog atual de upload de foto unica por um novo componente que permite enviar ate 3 fotos de uma vez.

**Interface:**
- Botao "Nova medicao visual" abre um dialog com:
  - Campo de data (pre-preenchido com hoje, editavel)
  - Campo opcional de peso atual (kg)
  - 3 cards lado a lado: Frente, Lateral, Costas
  - Cada card: area clicavel com icone de upload, preview apos selecao, botao X para remover
  - Campo de anotacao por foto (textarea pequeno)
  - Botao "Salvar medicao" (exige pelo menos 1 foto)

**Compressao automatica:**
- Usar Canvas API no browser para redimensionar imagens antes do upload (max 1920px de lado maior, qualidade JPEG 0.8)
- Utilidade `compressImage(file: File): Promise<File>` criada em `src/lib/imageUtils.ts`

**Logica de salvamento:**
- Itera sobre as 3 fotos preenchidas, chama `useUploadProgressPhoto` para cada uma com o mesmo `takenAt`
- Hook existente ja suporta `notes` por foto

**Novo componente:** `src/components/MultiPhotoUpload.tsx`

---

### 2. Extracao de Bioimpedancia por Foto (OCR via IA)

Novo fluxo "Adicionar bioimpedancia por foto" na aba de bioimpedancia.

**Fluxo:**
1. Professor clica "Bioimpedancia por foto"
2. Seleciona/tira foto da tela da balanca
3. Foto e enviada para edge function que usa Lovable AI (Gemini) para extrair os valores
4. Campos detectados aparecem pre-preenchidos mas editaveis
5. Professor confirma e salva

**Edge Function:** `supabase/functions/extract-bioimpedance/index.ts`
- Recebe imagem em base64
- Envia para Lovable AI Gateway (google/gemini-3-flash-preview) com prompt para extrair: peso, gordura %, musculo %, massa muscular kg, massa magra kg, gordura visceral, TMB, agua %, massa ossea
- Retorna JSON com valores detectados
- Trata erros 429/402

**Frontend:**
- Novo dialog "Bioimpedancia por foto" com:
  - Area de upload da foto da balanca
  - Preview da imagem
  - Spinner durante processamento
  - Campos pre-preenchidos com valores extraidos (todos editaveis)
  - Botao "Confirmar e salvar"
  - Foto original salva como `report_url` para auditoria

---

### 3. WhatsApp - Contato Rapido, Cobranca e Compartilhar Acesso

**3a. Botao de Contato Rapido (card do aluno)**
- No dropdown menu do card do aluno em Students.tsx, adicionar opcao "WhatsApp"
- Abre `https://wa.me/55{phone}` com mensagem pre-preenchida: "Ola {nome}, tudo bem?"
- Limpa o telefone (remove parenteses, espacos, tracos)

**3b. Cobranca Automatica (Finance.tsx)**
- No card de pagamento pendente/atrasado, botao de WhatsApp
- Mensagem: "Ola {nome}, seu pagamento de R$ {valor} referente a {mes} esta {pendente/atrasado}. Podemos resolver?"
- Precisa do join com students para pegar nome e telefone

**3c. Compartilhar Acesso (Profile.tsx)**
- Apos gerar codigo de acesso, botao "Enviar via WhatsApp"
- Mensagem: "Ola {nome}! Seu acesso ao portal IFT esta pronto. Acesse: {url}/portal e use o codigo: {codigo}"

**Utilidade:** `src/lib/whatsapp.ts`
- `openWhatsApp(phone: string, message: string)` - formata numero e abre link

---

### Secao Tecnica

**Arquivos novos:**
- `src/lib/imageUtils.ts` - compressao de imagem via Canvas
- `src/lib/whatsapp.ts` - funcao helper do WhatsApp
- `src/components/MultiPhotoUpload.tsx` - componente de upload multi-foto
- `supabase/functions/extract-bioimpedance/index.ts` - edge function OCR

**Arquivos modificados:**
- `src/pages/Progress.tsx` - substituir dialog de foto por MultiPhotoUpload, adicionar fluxo OCR bio
- `src/pages/Students.tsx` - adicionar opcao WhatsApp no dropdown
- `src/pages/Finance.tsx` - adicionar botao WhatsApp nos pagamentos (precisa join com students)
- `src/hooks/usePayments.ts` - atualizar query para incluir dados do aluno (nome, telefone)
- `src/pages/Profile.tsx` - adicionar botao WhatsApp apos gerar codigo
- `supabase/config.toml` - registrar edge function extract-bioimpedance

**Dependencias:** Nenhuma nova (Canvas API e nativo, Lovable AI ja disponivel)

**Modelo IA:** google/gemini-3-flash-preview (bom para OCR de imagens, rapido e economico)
