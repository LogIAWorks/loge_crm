import { useEffect } from 'react';

// Llama a `handler` cuando se pulsa Escape, solo si `active` es true.
// Útil para cerrar modales con el teclado.
export function useEscapeKey(active: boolean, handler: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handler(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, handler]);
}
