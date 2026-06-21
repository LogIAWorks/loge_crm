import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Users, CreditCard, AlertTriangle, Calendar, FileText, CheckCircle2, X, Copy, Bot, BrainCircuit, Clock, Handshake, TrendingUp, TrendingDown } from 'lucide-react';
import { api, authHeaders } from '../api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const [showEkko, setShowEkko] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ekkoProactive, setEkkoProactive] = useState(() => localStorage.getItem('ekko_proactive') !== 'off');

  const toggleEkko = () => {
    setEkkoProactive(prev => {
      const next = !prev;
      localStorage.setItem('ekko_proactive', next ? 'on' : 'off');
      return next;
    });
  };

  useEffect(() => {
    api('/api/dashboard', { headers: authHeaders() }).then(r => r.json()).then(setData).catch(console.error);
  }, []);

  const alerts: any[] = Array.isArray(data?.alerts) ? data.alerts : [];

  const loadReport = async () => {
    const r = await api('/api/report/weekly', { headers: authHeaders() });
    setReport(await r.json());
    setShowReport(true);
  };

  const copyReport = () => {
    if (!report || !data) return;
    const d = new Date().toLocaleDateString('es-ES');
    let t = `📊 INFORME LOGE — ${d}\n\n`;
    t += `━━━ RESUMEN ━━━\n`;
    t += `• Leads activos: ${data.leadsActivos}\n`;
    t += `• Clientes activos: ${data.clientesActivos}\n`;
    t += `• Follow-ups vencidos: ${data.followUpsVencidos}\n`;
    t += `• Tareas pendientes: ${data.tareasPendientesCount}\n\n`;
    t += `━━━ FINANZAS ━━━\n`;
    t += `• Cobrado este mes: €${(data.cobradoMes || 0).toLocaleString('es-ES')}\n`;
    t += `• Pendiente de cobro: €${(data.pagosPendientesTotal || 0).toLocaleString('es-ES')}\n\n`;
    if (report.overdueActions?.length) {
      t += `⚠️ FOLLOW-UPS VENCIDOS\n`;
      report.overdueActions.forEach((a: any) => { t += `  • ${a.empresa}\n`; });
    }
    navigator.clipboard.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Cargando datos...</p>
      </div>
    </div>
  );

  // Format currency
  const eur = (n: number) => `€${(n || 0).toLocaleString('es-ES')}`;

  return (
    <div className="space-y-6 page-enter pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Centro de Mando</h2>
          <p className="text-gray-400 text-sm mt-0.5 font-medium">Estado real de LOGE — {new Date().toLocaleDateString('es-ES')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowEkko(true)} className="btn-secondary !py-2 text-xs font-bold flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5" /> Ekko
          </button>
          <button onClick={loadReport} className="btn-primary !py-2 text-xs font-bold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Informe Semanal
          </button>
        </div>
      </div>

      {/* Urgent Alerts Banner — only if something needs attention */}
      {(data.followUpsVencidos > 0 || data.pagosPendientesCount > 0 || data.clientesRevisionCount > 0 || data.comisionesPendientesTotal > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.followUpsVencidos > 0 && (
            <button onClick={() => navigate('/pipeline')} className="text-left bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3 hover:border-red-300 hover:shadow-md transition-all active:scale-[0.98]">
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Follow-ups vencidos</p>
                <p className="text-xl font-black text-red-700">{data.followUpsVencidos}</p>
              </div>
            </button>
          )}
          {data.pagosPendientesCount > 0 && (
            <button onClick={() => navigate('/payments')} className="text-left bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3 hover:border-amber-300 hover:shadow-md transition-all active:scale-[0.98]">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white flex-shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Pagos pendientes</p>
                <p className="text-xl font-black text-amber-700">{data.pagosPendientesCount} · {eur(data.pagosPendientesTotal)}</p>
              </div>
            </button>
          )}
          {data.clientesRevisionCount > 0 && (
            <button onClick={() => navigate('/clients')} className="text-left bg-violet-50 p-4 rounded-2xl border border-violet-100 flex items-center gap-3 hover:border-violet-300 hover:shadow-md transition-all active:scale-[0.98]">
              <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center text-white flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-violet-500 font-black uppercase tracking-widest">Revisión requerida</p>
                <p className="text-xl font-black text-violet-700">{data.clientesRevisionCount} clientes</p>
              </div>
            </button>
          )}
          {data.comisionesPendientesTotal > 0 && (
            <button onClick={() => navigate('/affiliates')} className="text-left bg-teal-50 p-4 rounded-2xl border border-teal-100 flex items-center gap-3 hover:border-teal-300 hover:shadow-md transition-all active:scale-[0.98]">
              <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white flex-shrink-0">
                <Handshake className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-teal-500 font-black uppercase tracking-widest">Comisiones por pagar</p>
                <p className="text-xl font-black text-teal-700">{eur(data.comisionesPendientesTotal)}</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Leads Activos', value: data.leadsActivos, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50', to: '/pipeline' },
          { label: 'Clientes Activos', value: data.clientesActivos, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', to: '/clients' },
          { label: 'Cobrado (Mes)', value: eur(data.cobradoMes), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', to: '/payments' },
          { label: 'Tareas Pendientes', value: data.tareasPendientesCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', to: '/tasks' },
        ].map((s, i) => (
          <button key={i} onClick={() => navigate(s.to)} className="text-left card p-5 border-none shadow-sm ring-1 ring-gray-100 hover:ring-brand/40 hover:shadow-md transition-all active:scale-[0.98]">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg} mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{s.label}</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{s.value}</p>
          </button>
        ))}
      </div>

      {/* Charts: Ingresos + Cobrado este mes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos últimos 6 meses */}
        <div className="card p-6 border-none shadow-sm ring-1 ring-gray-100">
          <h3 className="font-black text-gray-900 mb-5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Ingresos cobrados (6 meses)
          </h3>
          {(() => {
            const series = data.revenueByMonth || [];
            const max = Math.max(1, ...series.map((m: any) => m.total));
            return (
              <div className="flex items-end justify-between gap-3 h-44 pt-4">
                {series.map((m: any, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] font-black text-gray-600">{m.total > 0 ? eur(m.total) : ''}</span>
                    <div className="w-full bg-gradient-to-t from-brand to-brand-light rounded-t-lg transition-all" style={{ height: `${Math.max(2, (m.total / max) * 100)}%` }} title={eur(m.total)} />
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{m.label}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Cobrado este mes */}
        <div className="card p-6 border-none shadow-sm ring-1 ring-gray-100 flex flex-col">
          <h3 className="font-black text-gray-900 mb-5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cobrado este mes
          </h3>
          {(() => {
            const series = data.revenueByMonth || [];
            const current = series[series.length - 1] || { total: 0 };
            const prev = series[series.length - 2] || { total: 0 };
            const diff = (current.total || 0) - (prev.total || 0);
            const pct = prev.total > 0 ? Math.round((diff / prev.total) * 100) : null;
            const mesActual = new Date().toLocaleDateString('es-ES', { month: 'long' });
            const up = diff >= 0;
            return (
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500 mb-1 capitalize">{mesActual} {new Date().getFullYear()}</p>
                <p className="text-5xl font-black text-gray-900 leading-none">{eur(current.total || 0)}</p>
                <div className={`mt-5 inline-flex items-center gap-2 text-sm font-bold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
                  {up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{up ? '+' : '−'}{eur(Math.abs(diff))}{pct != null ? ` (${up ? '+' : '−'}${Math.abs(pct)}%)` : ''}</span>
                  <span className="text-gray-400 font-medium">vs mes anterior</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Main Content: Alerts + Tasks side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Actionable Alerts */}
        <div className="card p-6 border-none shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Requiere Acción
            </h3>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{alerts.length} alertas</span>
          </div>
          <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar">
            {alerts.length > 0 ? alerts.map((a, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl flex items-start justify-between gap-3 hover:bg-gray-100 transition-colors">
                <div className="min-w-0">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${a.type === 'lead' ? 'text-blue-500' : a.type === 'payment' ? 'text-amber-500' : a.type === 'task' ? 'text-red-500' : 'text-violet-500'}`}>
                    {a.type === 'lead' ? 'Follow-up' : a.type === 'payment' ? 'Cobro' : a.type === 'task' ? 'Bloqueada' : 'Riesgo'}
                  </span>
                  <p className="text-sm font-bold text-gray-900 truncate">{a.empresa}</p>
                  <p className="text-xs text-gray-500 truncate">{a.titulo}</p>
                </div>
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg whitespace-nowrap flex-shrink-0">{a.fecha}</span>
              </div>
            )) : (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-100 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-300">Todo bajo control</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Pending Tasks */}
        <div className="card p-6 border-none shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Próximas Tareas
            </h3>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{data.tareasPendientesCount} pendientes</span>
          </div>
          <div className="space-y-3">
            {data.recentTasks?.length > 0 ? data.recentTasks.map((t: any, i: number) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${t.prioridad === 'Alta' ? 'bg-red-100 text-red-600' : t.prioridad === 'Normal' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>{t.prioridad || 'Normal'}</span>
                  <span className="text-[10px] font-bold text-gray-400">{t.fecha_limite}</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{t.titulo}</p>
                <p className="text-xs text-gray-500">{t.empresa_relacionada || t.related_empresa || t.relacionado_con || 'Interno'} · {t.responsable || t.asignado_a || '—'}</p>
              </div>
            )) : (
              <div className="py-12 text-center">
                <p className="text-sm font-bold text-gray-300 italic">Sin tareas pendientes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overdue Clients requiring revision */}
      {data.overdueClients?.length > 0 && (
        <div className="card p-6 border-none shadow-sm ring-1 ring-gray-100">
          <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-500" /> Clientes con revisión pendiente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.overdueClients.map((c: any, i: number) => (
              <div key={i} className="p-3 bg-violet-50/50 rounded-xl border border-violet-100">
                <p className="text-sm font-bold text-gray-900">{c.empresa}</p>
                <p className="text-xs text-gray-500 truncate">{c.servicio}</p>
                <p className="text-[10px] font-bold text-violet-600 mt-1">Rev: {c.proxima_revision}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Report Modal */}
      {showReport && report && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-modal p-8 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-900">Informe Semanal</h3>
              <button onClick={() => setShowReport(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 p-4 rounded-2xl"><p className="text-[10px] text-emerald-600 font-black uppercase">Cobrado mes</p><p className="text-xl font-black text-emerald-700">{eur(report.monthRevenue)}</p></div>
                <div className="bg-amber-50 p-4 rounded-2xl"><p className="text-[10px] text-amber-600 font-black uppercase">Pendiente total</p><p className="text-xl font-black text-amber-700">{eur(report.pendingRevenue)}</p></div>
              </div>
              {report.overdueActions?.length > 0 && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <p className="text-[10px] text-red-600 font-black uppercase mb-2">Follow-ups vencidos ({report.overdueActions.length})</p>
                  {report.overdueActions.slice(0, 5).map((a: any, i: number) => (
                    <p key={i} className="text-sm font-bold text-red-700">• {a.empresa}</p>
                  ))}
                </div>
              )}
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] text-gray-500 font-black uppercase mb-2">Actividad de la semana</p>
                <p className="text-sm text-gray-700">Interacciones: <span className="font-bold">{report.weekInteractions?.length || 0}</span></p>
              </div>
            </div>
            <button onClick={copyReport} className={`w-full mt-6 btn-primary !py-3 rounded-2xl font-bold flex items-center justify-center gap-2 ${copied ? '!bg-emerald-500' : ''}`}>
              {copied ? <><CheckCircle2 className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar para WhatsApp</>}
            </button>
          </div>
        </div>
      )}

      {/* Ekko Modal */}
      {showEkko && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEkko(false)}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-modal p-8 text-center animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><Bot className="w-7 h-7 text-brand" /></div>
            <h3 className="text-xl font-black text-gray-900 mb-1">Ekko</h3>
            <p className="text-sm text-gray-500 mb-6">Empleado virtual de LOGE</p>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3 text-left mb-4">
              <BrainCircuit className="w-5 h-5 text-brand flex-shrink-0" />
              <div><p className="text-sm font-bold text-gray-900">Modo Proactivo</p><p className="text-[10px] text-gray-400">Reportes diarios a las 9:00</p></div>
              <button
                type="button"
                onClick={toggleEkko}
                role="switch"
                aria-checked={ekkoProactive}
                className={`w-9 h-5 rounded-full relative ml-auto transition-colors ${ekkoProactive ? 'bg-brand' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${ekkoProactive ? 'right-0.5' : 'left-0.5'}`}></div>
              </button>
            </div>
            <button onClick={() => setShowEkko(false)} className="w-full btn-primary !py-3 rounded-2xl font-bold">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
