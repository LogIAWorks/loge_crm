import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { subscribe, dismiss, type ToastItem } from './toast';

const styles: Record<string, { ring: string; icon: JSX.Element; text: string }> = {
  success: { ring: 'ring-emerald-200 bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
  error: { ring: 'ring-red-200 bg-red-50', text: 'text-red-700', icon: <AlertTriangle className="w-5 h-5 text-red-500" /> },
  info: { ring: 'ring-brand-200 bg-brand-50', text: 'text-brand-dark', icon: <Info className="w-5 h-5 text-brand" /> },
};

const ToastContainer = () => {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => subscribe(setItems), []);

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 max-w-[calc(100vw-2rem)]">
      {items.map(t => {
        const s = styles[t.type];
        return (
          <div key={t.id} className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg ring-1 ${s.ring} animate-slide-up`}>
            {s.icon}
            <span className={`font-medium text-sm ${s.text}`}>{t.msg}</span>
            <button onClick={() => dismiss(t.id)} className="ml-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
