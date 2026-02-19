
# Correcao de Drag-and-Drop e Seguranca do Portal do Aluno

## Problema 1: Drag and Drop com dois alunos no mesmo horario

### Causa raiz
Quando dois cards de sessao estao no mesmo slot horario, o evento `onDragStart` propaga corretamente, mas o `onDrop` recebe o `sessionId` do ultimo card arrastado. O problema e que os cards estao dentro do mesmo container de drop e ao arrastar um card sobreposto, o evento de click/drag pode conflitar.

### Solucao
- Adicionar `e.stopPropagation()` no `onDragStart` do card para evitar propagacao
- Renderizar cada sessao no mesmo horario lado a lado (layout horizontal) em vez de empilhado, para facilitar a selecao visual e o drag individual
- Alterar o layout de `space-y-1` (vertical) para `flex flex-wrap gap-1` quando ha multiplas sessoes no mesmo slot
- Cada card recebe um visual mais compacto quando compartilha horario (largura proporcional)

## Problema 2: Seguranca do Portal do Aluno (acesso publico)

### Causa raiz
O `StudentPortal.tsx` faz queries diretas nas tabelas `sessions`, `progress_photos` e `bioimpedance` usando o cliente Supabase anonimo. Mas todas essas tabelas tem RLS que exige `auth.uid() = trainer_id`. Um usuario nao autenticado (aluno acessando via link) recebe **dados vazios** -- nao consegue ver nada.

### Solucao
Criar funcoes `SECURITY DEFINER` no banco (como ja existe `get_student_by_code`) para cada tipo de dado que o portal precisa:

1. **`get_student_sessions(_student_id uuid)`** -- retorna sessoes do aluno
2. **`get_student_photos(_student_id uuid)`** -- retorna fotos de progresso
3. **`get_student_bio(_student_id uuid)`** -- retorna registros de bioimpedancia

Essas funcoes rodam com privilegios elevados (security definer) e validam que o `student_id` existe antes de retornar dados. O frontend do portal passa a chamar `supabase.rpc(...)` em vez de queries diretas.

**Importante**: As funcoes recebem o `student_id` retornado pela funcao `get_student_by_code` (que ja valida o codigo de acesso), entao a cadeia de seguranca e:
- Aluno digita codigo -> `get_student_by_code` valida e retorna student_id
- Com student_id, chama as 3 funcoes RPC para buscar dados

### Protecao adicional
- Validar que o `_student_id` passado corresponde a um aluno com `access_code IS NOT NULL` (so alunos que o trainer habilitou para o portal)

## Problema 3: Publicar o app

Apos as correcoes, publicar o app para que o link funcione para alunos sem conta Lovable.

## Detalhes Tecnicos

### Migration SQL (3 funcoes security definer)

```sql
CREATE OR REPLACE FUNCTION public.get_student_sessions(_student_id uuid)
RETURNS TABLE (
  id uuid, scheduled_date date, scheduled_time time,
  status text, muscle_groups text[], notes text,
  duration_minutes int
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.id, s.scheduled_date, s.scheduled_time,
         s.status, s.muscle_groups, s.notes, s.duration_minutes
  FROM sessions s
  JOIN students st ON st.id = s.student_id
  WHERE s.student_id = _student_id
    AND st.access_code IS NOT NULL
  ORDER BY s.scheduled_date DESC
  LIMIT 30;
$$;

CREATE OR REPLACE FUNCTION public.get_student_photos(_student_id uuid)
RETURNS TABLE (id uuid, photo_url text, photo_type text, taken_at date, notes text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.photo_url, p.photo_type, p.taken_at, p.notes
  FROM progress_photos p
  JOIN students st ON st.id = p.student_id
  WHERE p.student_id = _student_id
    AND st.access_code IS NOT NULL
  ORDER BY p.taken_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_student_bio(_student_id uuid)
RETURNS TABLE (
  id uuid, measured_at date, weight numeric,
  body_fat_pct numeric, muscle_mass numeric,
  visceral_fat numeric, bmr numeric, body_water_pct numeric, bone_mass numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.id, b.measured_at, b.weight, b.body_fat_pct,
         b.muscle_mass, b.visceral_fat, b.bmr, b.body_water_pct, b.bone_mass
  FROM bioimpedance b
  JOIN students st ON st.id = b.student_id
  WHERE b.student_id = _student_id
    AND st.access_code IS NOT NULL
  ORDER BY b.measured_at ASC;
$$;
```

### StudentPortal.tsx -- substituir queries diretas por RPC

```typescript
// ANTES (nao funciona sem auth):
const { data: sessData } = await supabase
  .from('sessions').select('*').eq('student_id', s.id);

// DEPOIS (funciona sem auth via security definer):
const { data: sessData } = await supabase
  .rpc('get_student_sessions', { _student_id: s.id });
```

Aplicar o mesmo padrao para `get_student_photos` e `get_student_bio`.

### Schedule.tsx -- correcao do drag and drop

Alterar a renderizacao de sessoes no mesmo horario:

```tsx
// Quando ha multiplas sessoes no mesmo slot:
<div className="flex-1 border-t border-border/30 pt-1 pb-1">
  {hourSessions.length > 0 ? (
    <div className="flex flex-wrap gap-1">
      {hourSessions.map((s) => (
        <div key={s.id} className={hourSessions.length > 1 ? 'flex-1 min-w-0' : 'w-full'}>
          {renderSessionCard(s, true)}
        </div>
      ))}
    </div>
  ) : (/* empty slot */)}
</div>
```

E adicionar `e.stopPropagation()` no `onDragStart` do card.

### Publicacao
Publicar o app apos as correcoes para que o link `fitproagenda.lovable.app/portal` funcione para alunos.

## Resumo de arquivos alterados

| Arquivo | Mudanca |
|---------|---------|
| Migration SQL | 3 funcoes security definer para portal |
| `src/pages/StudentPortal.tsx` | Trocar queries diretas por `supabase.rpc()` |
| `src/pages/Schedule.tsx` | Layout lado-a-lado + stopPropagation no drag |
