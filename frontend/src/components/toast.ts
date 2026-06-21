// Sistema de toasts imperativo y minimalista (sin dependencias).
// Uso: import { toast } from '../components/toast'; toast.error('algo falló');
export type ToastType = 'success' | 'error' | 'info';
export interface ToastItem { id: number; type: ToastType; msg: string; }

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
const listeners = new Set<Listener>();
let seq = 0;

const emit = () => listeners.forEach(l => l([...items]));

const push = (type: ToastType, msg: string) => {
  const id = ++seq;
  items = [...items, { id, type, msg }];
  emit();
  setTimeout(() => {
    items = items.filter(t => t.id !== id);
    emit();
  }, 3800);
};

export const subscribe = (l: Listener) => {
  listeners.add(l);
  l([...items]);
  return () => { listeners.delete(l); };
};

export const dismiss = (id: number) => {
  items = items.filter(t => t.id !== id);
  emit();
};

export const toast = {
  success: (msg: string) => push('success', msg),
  error: (msg: string) => push('error', msg),
  info: (msg: string) => push('info', msg),
};
