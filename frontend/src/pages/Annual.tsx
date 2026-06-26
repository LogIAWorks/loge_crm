import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, BarChart3, TrendingUp, Calendar, Trophy } from 'lucide-react';
import { api, authHeaders } from '../api';
import { toast } from '../components/toast';

// Lee el primer valor no vacío entre varias claves (esquema antiguo/nuevo).
const val = (obj: any, ...keys: string[]) => {
  for (const k of keys) { if (obj[k] != null && obj[k] !== '') return obj[k]; }
  return null;
};
// Fecha relevante del pago (misma prioridad que el resto del CRM).
const fechaPago = (p: any): string => val(p, 'fecha_prevista_cobro', 'fecha_vencimiento', 'fecha') || '';
const eur = (n: number) => `€${(n || 0).toLocaleString('es-ES')}`;

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const Annual = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    api('/api/payments', { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setPayments(Array.isArray(d) ? d : []))
      .catch(() => toast.error('No se pudieron cargar los pagos'));
  }, []);

  // Ingresos cobrados por mes del año seleccionado.
  const serie = MESES.map((label, i) => {
    const ym = `${year}-${String(i + 1).padStart(2, '0')}`;
    const total = payments
      .filter(p => p.estado === 'cobrado' && fechaPago(p).slice(0, 7) === ym)
      .reduce((s, p) => s + (Number(p.importe) || 0), 0);
    return { label, total };
  });

  const totalAnual = serie.reduce((s, m) => s + m.total, 0);
  const mediaMensual = totalAnual / 12;
  const mejor = serie.reduce((best, m) => (m.total > best.total ? m : best), { label: '—', total: 0 });
  const max = Math.max(1, ...serie.map(m => m.total));

  const cards = [
    { label: 'Total cobrado', value: eur(totalAnual), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Media mensual', value: eur(Math.round(mediaMensual)), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Mejor mes', value: mejor.total > 0 ? `${mejor.label} · ${eur(mejor.total)}` : '—', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6 page-enter pb-10">
      {/* Header + selector de año */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Resumen Anual</h2>
          <p className="text-gray-400 text-sm mt-0.5 font-medium">Ingresos cobrados por mes</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm p-1.5 self-start sm:self-auto">
          <button onClick={() => setYear(y => y - 1)} aria-label="Año anterior" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-brand transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xl font-black text-gray-900 w-16 text-center tabular-nums">{year}</span>
          <button onClick={() => setYear(y => y + 1)} aria-label="Año siguiente" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-brand transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="card p-5 border-none shadow-sm ring-1 ring-gray-100">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.bg} mb-3`}>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{c.label}</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Gráfica de 12 meses */}
      <div className="card p-6 border-none shadow-sm ring-1 ring-gray-100">
        <h3 className="font-black text-gray-900 mb-5 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand" /> Ingresos cobrados {year}
        </h3>
        <div className="overflow-x-auto">
          <div className="flex items-end justify-between gap-2 sm:gap-3 h-56 pt-6 min-w-[640px]">
            {serie.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-black text-gray-600 whitespace-nowrap">{m.total > 0 ? eur(m.total) : ''}</span>
                <div
                  className="w-full bg-gradient-to-t from-brand to-brand-light rounded-t-lg transition-all"
                  style={{ height: `${Math.max(2, (m.total / max) * 100)}%` }}
                  title={`${m.label}: ${eur(m.total)}`}
                />
                <span className="text-[10px] font-bold text-gray-400 uppercase">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
        {totalAnual === 0 && (
          <p className="text-center text-sm text-gray-300 font-bold mt-4">Sin ingresos cobrados en {year}</p>
        )}
      </div>
    </div>
  );
};

export default Annual;
