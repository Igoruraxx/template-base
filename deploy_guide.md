# Guia de Deploy Independente (Supabase External)

Agora que o seu projeto está 100% independente da Lovable Cloud para o funcionamento do app e do OCR, você precisa garantir que as funções de servidor (Edge Functions) estejam rodando no seu próprio projeto Supabase (`drjdifrwmbrirmifmxjv`).

## Pré-requisitos

1. **Supabase CLI** instalado na sua máquina.
2. Estar logado no CLI: `supabase login`.

## 1. Deploy das Funções

Execute o comando abaixo na raiz do projeto para subir todas as funções necessárias (Pagamentos, Assinaturas, Notificações e Segurança):

```bash
supabase functions deploy create-checkout
supabase functions deploy check-subscription
supabase functions deploy push-notify
supabase functions deploy register-push
supabase functions deploy student-signed-urls
supabase functions deploy generate-vapid-keys
```

## 2. Configuração de Segredos (Secrets)

Para que os pagamentos via Stripe e as notificações funcionem, você precisa configurar as chaves no painel do Supabase:

```bash
# Chave Secreta do Stripe
supabase secrets set STRIPE_SECRET_KEY=sua_chave_aqui

# Chaves VAPID para Notificações (se você já tiver)
supabase secrets set VAPID_PUBLIC_KEY=sua_chave_aqui
supabase secrets set VAPID_PRIVATE_KEY=sua_chave_aqui
```

## 3. Webhooks do Stripe

Não esqueça de configurar o Webhook no painel do Stripe apontando para a sua nova URL do Supabase para que as confirmações de pagamento automáticas continuem funcionando.

> [!NOTE]
> A extração de Bioimpedância **não precisa mais de deploy**, pois agora roda diretamente no celular do usuário (OCR Local).
