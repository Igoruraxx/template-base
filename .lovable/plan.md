

## 🏋️ IFT v3 — Sistema de Gestão para Personal Trainer

Reconstrução completa do app de gestão de personal trainer com design moderno e polido, conectado ao seu Supabase existente.

---

### Fase 1: Fundação e Autenticação
- **Conectar Supabase existente** com suas tabelas e dados já configurados
- **Tela de login/cadastro** com visual moderno (email/senha)
- **Proteção de rotas** — redirecionar usuários não autenticados
- **Loading screen** animada durante carregamento

### Fase 2: Gestão de Alunos
- **Lista de alunos** com cards visuais, foto, cor personalizada e busca
- **Cadastro/edição de aluno** — nome, telefone, objetivo, plano (mensal/pacote), valor, frequência, observações
- **Status do aluno** — ativo, inativo, "esquecido"
- **Alunos de consultoria** com flag separada

### Fase 3: Agenda de Sessões
- **Calendário visual** com visão diária/semanal
- **Agendar sessão** — vincular aluno, data, horário, duração, local
- **Marcar sessão como concluída** com anotações
- **Controle de pacotes** — contagem de sessões realizadas vs. contratadas

### Fase 4: Registro de Grupos Musculares por Sessão
- **Tags/chips clicáveis** com os principais grupos musculares: Peito, Costas, Ombros, Bíceps, Tríceps, Pernas (Quadríceps), Posterior, Glúteos, Panturrilha, Abdômen, Cardio
- Cada grupo com **cor/ícone distinto** para identificação rápida
- **Multi-select** — selecionar múltiplos grupos por sessão
- Ao **concluir ou editar** uma sessão, aparece a seção de grupos musculares com chips para tocar — seleção rápida, sem digitação
- **Na agenda**: badges/tags coloridas pequenas no card da sessão abaixo do nome do aluno (ex: 🟦 Peito 🟩 Tríceps)
- **Ao clicar na sessão**: visão detalhada com chips maiores e informações completas
- Campo `muscle_groups` (array de texto) na tabela de sessões no Supabase

### Fase 5: Fotos de Progresso e Bioimpedância
- **Upload de fotos** (frente, lado, costas) com data
- **Galeria de progresso** com comparação temporal
- **Registro de bioimpedância** com upload de laudos
- **Gráficos de evolução** dos dados de bioimpedância com Recharts
- **Lightbox** para visualização em tela cheia

### Fase 6: Controle Financeiro
- **Pagamentos por aluno** — valor, mês, status (pago/pendente)
- **Histórico de pagamentos** com filtros
- **Visão geral financeira** — receita mensal, pendências

### Fase 7: Portal do Aluno
- **Acesso por código** para o aluno visualizar seus dados
- **Visualização de treinos, fotos e progresso** pelo próprio aluno

### Fase 8: Painel Admin e Funcionalidades Extras
- **Dashboard admin** — visão geral de todos os usuários/treinadores
- **Relatórios em PDF** com dados do aluno (jsPDF)
- **Configurações de notificações push**
- **Navegação inferior** (bottom nav) otimizada para mobile
- **Design responsivo** — experiência mobile-first com visual premium

---

### 🎨 Design Melhorado
- Visual dark/escuro moderno com acentos coloridos
- Animações suaves com Framer Motion
- Cards com gradientes e glassmorphism
- Tipografia hierárquica clara
- UX mobile-first com bottom navigation

### 🔧 Stack Técnica
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (seu projeto existente — auth, DB, storage)
- Recharts para gráficos
- jsPDF para relatórios
- Framer Motion para animações
