

# Correcao do Drag-and-Drop na Agenda

## Causa raiz

O componente `renderSessionCard` usa `motion.div` do framer-motion com `draggable` e `onDragStart`. O problema e que o framer-motion intercepta esses eventos e os trata como seu proprio sistema de drag (animacoes de arrastar), nao como o drag-and-drop nativo do HTML5. Por isso, `e.dataTransfer.setData('sessionId', ...)` nunca funciona -- o evento recebido nao e um `DragEvent` nativo, e sim um evento do framer-motion.

## Solucao

Envolver o `motion.div` em um `div` nativo que controla o drag-and-drop HTML5, deixando o `motion.div` apenas para animacoes de entrada (fade-in).

## Mudancas

### Arquivo: `src/pages/Schedule.tsx`

**Funcao `renderSessionCard`** (linhas 212-271):

Separar as responsabilidades:
- Um `div` externo (nativo) recebe `draggable`, `onDragStart` e `onClick`
- O `motion.div` interno fica apenas com animacoes visuais (sem `draggable`, sem `onDragStart`, sem `onClick`)

```tsx
// ANTES (nao funciona - motion.div intercepta drag):
<motion.div
  draggable={draggable}
  onDragStart={draggable ? (e) => handleDragStart(e as any, session) : undefined}
  onClick={() => setDetailSession(session)}
  ...
>

// DEPOIS (div nativo controla drag, motion.div so anima):
<div
  draggable={draggable}
  onDragStart={draggable ? (e) => handleDragStart(e, session) : undefined}
  onClick={() => setDetailSession(session)}
  className={cn(
    draggable && 'cursor-grab active:cursor-grabbing'
  )}
>
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      'glass rounded-xl p-3 relative overflow-hidden',
      isCompleted && 'opacity-70',
      isCancelled && 'opacity-40'
    )}
  >
    {/* conteudo do card inalterado */}
  </motion.div>
</div>
```

Tambem remover o cast `as any` do `handleDragStart`, pois agora o evento sera um `React.DragEvent` nativo real.

Nenhum outro arquivo precisa ser alterado. O resto da logica de drop (handleDragOver, handleDrop, handleDragLeave) ja esta correta nos containers de hora.
