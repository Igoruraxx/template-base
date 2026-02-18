

## Agenda como tela inicial com visualizacao "Horario" padrao

Duas alteracoes simples:

### 1. Redirecionar "/" para "/schedule"
A rota principal (`/`) atualmente mostra a pagina `Index`. Sera alterada para renderizar a pagina `Schedule`, tornando a Agenda a primeira tela apos o login.

O item "Inicio" no menu inferior tambem sera atualizado para apontar para `/schedule` (e renomeado para "Agenda"), removendo a duplicidade.

### 2. View padrao "hour" na Agenda
O estado inicial de `viewMode` em `Schedule.tsx` sera alterado de `'day'` para `'hour'`.

---

### Secao Tecnica

**Arquivos modificados:**

1. **`src/App.tsx`** (linha 35): trocar `<Index />` por `<Schedule />` na rota `/`, ou redirecionar `/` para `/schedule` usando `Navigate`.

2. **`src/pages/Schedule.tsx`** (linha 32): alterar o valor inicial de `useState` de `'day'` para `'hour'`.

3. **`src/components/BottomNav.tsx`** (linha 7): atualizar o primeiro item do nav de `{ icon: Home, label: 'Inicio', path: '/' }` para `{ icon: Calendar, label: 'Agenda', path: '/schedule' }` e remover o item duplicado de Agenda (linha 9).

