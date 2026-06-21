import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Target, CheckSquare, CalendarDays } from 'lucide-react';
import { api, authHeaders } from '../api';

const val = (obj: any, ...keys: string[]) => {
  for (const k of keys) { if (obj[k] != null && obj[k] !== '') return obj[k]; }
  return null;
};

const DOW = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type EventType = 'lead' | 'task' | 'revision';
interface CalEvent { date: string; type: EventType; title: string; sub: string; }

const typeStyle: Record<EventType, string> = {
  lead: 'bg-blue-50 text-blue-600',
  task: 'bg-amber-50 text-amber-600',
  revision: 'bg-violet-50 text-violet-600',
};
const typeLabel: Record<EventType, string> = { lead: 'Follow-up', task: 'Tarea', revision: 'Revisión' };

const Calendar = () => {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [events, setEvents] = useState<CalEvent[]>([]);

  useEffect(() => {
    const h = authHeaders();
    Promise.all([
      api('/api/leads', { headers: h }).then(r => r.json()),
      api('/api/tasks', { headers: h }).then(r => r.json()),
      api('/api/clients', { headers: h }).then(r => r.json()),
    ]).then(([leads, tasks, clients]) => {
      const ev: CalEvent[] = [];
      (leads || []).forEach((l: any) => {
        const f = val(l, 'proximo_follow_up', 'fecha_proxima_accion');
        if (f && (!l.estado || !['Cerrado', 'Perdido'].includes(l.estado)))
          ev.push({ date: String(f).slice(0, 10), type: 'lead', title: l.empresa, sub: val(l, 'nota_corta', 'proxima_accion') || 'Follow-up' });
      });
      (tasks || []).forEach((t: any) => {
        if (t.fecha_limite && t.estado !== 'Completado')
          ev.push({ date: String(t.fecha_limite).slice(0, 10), type: 'task', title: t.titulo, sub: val(t, 'responsable', 'asignado_a') || '' });
      });
      (clients || []).forEach((c: any) => {
        if (c.proxima_revision && c.estado_cliente !== 'Baja')
          ev.push({ date: String(c.proxima_revision).slice(0, 10), type: 'revision', title: c.empresa, sub: 'Revisión de cliente' });
      });
      setEvents(ev);
    });
  }, []);

  const byDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    events.forEach(e => { (map[e.date] = map[e.date] || []).push(e); });
    return map;
  }, [events]);

  const fmt = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const todayStr = new Date().toLocaleDateString('en-CA');

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startBlank = (first.getDay() + 6) % 7; // Lunes = 0
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const arr: (number | null)[] = [];
    for (let i = 0; i < startBlank; i++) arr.push(null);
    for (let d = 1; d <= days; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cursor]);

  const prev = () => setCursor(c => c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 });
  const next = () => setCursor(c => c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 });
  const goToday = () => { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() }); };

  return (
    <div className="space-y-6 page-enter pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-gray-900 capitalize min-w-[180px]">{MONTHS[cursor.m]} {cursor.y}</h2>
          <div className="flex items-center gap-1">
            <button onClick={prev} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={next} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <button onClick={goToday} className="btn-secondary !py-2 text-xs font-bold px-4">Hoy</button>
        </div>
        {/* Leyenda */}
        <div className="flex items-center gap-4 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-blue-600"><Target className="w-3.5 h-3.5" /> Follow-ups</span>
          <span className="flex items-center gap-1.5 text-amber-600"><CheckSquare className="w-3.5 h-3.5" /> Tareas</span>
          <span className="flex items-center gap-1.5 text-violet-600"><CalendarDays className="w-3.5 h-3.5" /> Revisiones</span>
        </div>
      </div>

      <div className="card border-none shadow-sm ring-1 ring-gray-100 !p-0 overflow-x-auto">
       <div className="min-w-[760px]">
        {/* Cabecera días */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {DOW.map(d => <div key={d} className="px-3 py-2.5 text-[10px] font-black uppercase text-gray-400 text-center">{d}</div>)}
        </div>
        {/* Celdas */}
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const ds = d ? fmt(cursor.y, cursor.m, d) : '';
            const dayEvents = d ? (byDate[ds] || []) : [];
            const isToday = ds === todayStr;
            return (
              <div key={i} className={`min-h-[104px] border-b border-r border-gray-50 p-1.5 ${d ? '' : 'bg-gray-50/30'}`}>
                {d && (
                  <>
                    <div className={`text-[11px] font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-lg ${isToday ? 'bg-brand text-white' : 'text-gray-500'}`}>{d}</div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((e, j) => (
                        <div key={j} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate ${typeStyle[e.type]}`} title={`${typeLabel[e.type]}: ${e.title} — ${e.sub}`}>
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && <div className="text-[9px] font-bold text-gray-400 px-1.5">+{dayEvents.length - 3} más</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
       </div>
      </div>
    </div>
  );
};

export default Calendar;
