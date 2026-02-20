
# Correção: Upload e Extração de Bioimpedância

## Diagnóstico Confirmado

### Causa Raiz — Modelo de IA Descontinuado

A Edge Function `extract-bioimpedance` usa o modelo `google/gemini-3-flash-preview`. Ao testar diretamente via curl, a resposta foi:

```
status: 500
body: {"error":"AI gateway error"}
```

Esse modelo foi renomeado no gateway da Lovable. O modelo correto atualmente é `google/gemini-2.5-flash` (ou `google/gemini-2.5-flash-lite` para maior velocidade), ambos com suporte a visão/imagens.

### Causa Secundária — Tool Calling com JSON Schema incompatível

A função usa `tool_choice` com `"type": ["number", "null"]` no JSON Schema dos parâmetros. Essa sintaxe de array de tipos pode não ser suportada por todos os modelos. O mais robusto é usar apenas `"type": "number"` e marcar como `nullable` ou simplesmente não usar tool calling — usar o modo de resposta JSON diretamente no `system` prompt.

## O Que Vai Ser Feito

### 1. Atualizar o modelo na Edge Function

Trocar `google/gemini-3-flash-preview` por `google/gemini-2.5-flash`, que:
- Suporta visão (imagens base64)
- Está ativo e disponível no gateway da Lovable
- Tem boa velocidade e custo-benefício para OCR

### 2. Simplificar a estratégia de extração (sem Tool Calling)

O `tool_choice` com function calling adiciona complexidade desnecessária e pode falhar com certos modelos. A abordagem mais robusta é:
- Remover `tools` e `tool_choice` da requisição
- Usar `response_format: { type: "json_object" }` (mais simples e mais confiável)
- O `system` prompt já instrui o modelo a retornar JSON puro

```typescript
// ANTES (frágil)
tools: [...],
tool_choice: { type: "function", function: { name: "extract_bioimpedance" } }

// DEPOIS (robusto)
response_format: { type: "json_object" }
// Parse direto do content: result.choices[0].message.content
```

### 3. Melhorar o tratamento de erros com logs detalhados

Adicionar `console.error` com o body completo do erro do gateway para facilitar diagnósticos futuros:

```typescript
const errBody = await response.text();
console.error("AI gateway error:", response.status, errBody);
```

## Arquivo a Modificar

Apenas um arquivo muda:

**`supabase/functions/extract-bioimpedance/index.ts`**
- Linha 57: `model: "google/gemini-3-flash-preview"` → `"google/gemini-2.5-flash"`
- Remover o bloco `tools` (linhas 86-110)
- Remover `tool_choice` (linha 109)
- Adicionar `response_format: { type: "json_object" }`
- Simplificar o parse da resposta: ler direto de `choices[0].message.content`
- Melhorar logs de erro com o body completo

## Resultado Esperado

Ao clicar no botão de upload (ícone de câmera/upload na aba "Bio" em Progresso) e selecionar uma foto da balança:
1. A imagem é convertida para base64 no frontend
2. A Edge Function é chamada com o modelo correto
3. O Gemini 2.5 Flash extrai os valores (peso, gordura, músculo, etc.)
4. Os campos do formulário são preenchidos automaticamente
5. O trainer revisa e confirma para salvar no banco

Nenhuma migração de banco necessária. Apenas o redeploy da Edge Function.
