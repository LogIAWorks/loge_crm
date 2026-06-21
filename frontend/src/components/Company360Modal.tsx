import { useEffect, useState } from 'react';
import { X, Target, Users, MessageSquare, CreditCard } from 'lucide-react';
import { api, authHeaders } from '../api';

interface Props {
  companyName: string;
  onClose: () => void;
}

const Company360Modal = ({ companyName, onClose }: Props) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/api/company/${encodeURIComponent(companyName)}`, { headers: authHeaders() })
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [companyName]);

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-fade-in" onClick={onClose}>
      <div className="bg-white p-0 rounded-2xl shadow-modal w-full max-w-4xl max-h-[90vh] flex flex-col animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{companyName}</h2>
            <p className="text-sm text-gray-500 mt-1">Vista 360° del Cliente</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-200 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <div className="space-y-8">
              
              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-blue-500"/><span className="text-xs font-semibold text-gray-500">Leads</span></div>
                  <p className="text-xl font-bold text-gray-900">{data.leads?.length || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-violet-500"/><span className="text-xs font-semibold text-gray-500">Proyectos Activos</span></div>
                  <p className="text-xl font-bold text-gray-900">{data.clients?.length || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2"><MessageSquare className="w-4 h-4 text-amber-500"/><span className="text-xs font-semibold text-gray-500">Interacciones</span></div>
                  <p className="text-xl font-bold text-gray-900">{data.interactions?.length || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2"><CreditCard className="w-4 h-4 text-emerald-500"/><span className="text-xs font-semibold text-gray-500">Total Facturado</span></div>
                  <p className="text-xl font-bold text-emerald-600">
                    €{(data.payments?.filter((p:any) => p.estado === 'cobrado').reduce((a:number, p:any) => a + Number(p.importe), 0) || 0).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1 */}
                <div className="space-y-8">
                  {/* Pipeline */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> Historial de Leads</h3>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      {data.leads?.length > 0 ? data.leads.map((l: any, i: number) => (
                        <div key={i} className="p-3 border-b border-gray-50 last:border-0 flex justify-between items-center hover:bg-gray-50">
                          <div><p className="text-sm font-medium">{l.servicio_interesado || 'Sin servicio'}</p><p className="text-xs text-gray-500">{l.estado}</p></div>
                          <span className="text-sm font-semibold">€{Number(l.valor_estimado || 0).toLocaleString('es-ES')}</span>
                        </div>
                      )) : <p className="p-4 text-sm text-gray-400">Sin leads registrados</p>}
                    </div>
                  </div>

                  {/* Active Projects */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Proyectos como Cliente</h3>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      {data.clients?.length > 0 ? data.clients.map((c: any, i: number) => (
                        <div key={i} className="p-3 border-b border-gray-50 last:border-0">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-medium">{c.servicio_contratado}</p>
                            <span className="badge badge-blue">{c.estado_cliente || c.estado_proyecto || 'Activo'}</span>
                          </div>
                          {c.proxima_revision && <p className="text-xs text-gray-500 flex items-center gap-1">Revisión: {c.proxima_revision}</p>}
                        </div>
                      )) : <p className="p-4 text-sm text-gray-400">Sin proyectos activos</p>}
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-8">
                  {/* Interactions */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Últimas Interacciones</h3>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      {data.interactions?.length > 0 ? data.interactions.slice(0, 5).map((inter: any, i: number) => (
                        <div key={i} className="p-3 border-b border-gray-50 last:border-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-gray-500">{inter.fecha}</span>
                            <span className="badge badge-gray">{inter.tipo}</span>
                          </div>
                          <p className="text-sm text-gray-700">{inter.resumen}</p>
                        </div>
                      )) : <p className="p-4 text-sm text-gray-400">Sin interacciones</p>}
                    </div>
                  </div>

                  {/* Payments */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Historial de Pagos</h3>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      {data.payments?.length > 0 ? data.payments.map((p: any, i: number) => (
                        <div key={i} className="p-3 border-b border-gray-50 last:border-0 flex justify-between items-center">
                          <div><p className="text-sm font-medium">{p.concepto}</p><p className="text-xs text-gray-500">{p.fecha}</p></div>
                          <div className="text-right">
                            <p className="text-sm font-bold">€{Number(p.importe).toLocaleString('es-ES')}</p>
                            <p className={`text-[10px] uppercase font-bold ${p.estado === 'cobrado' ? 'text-emerald-500' : 'text-red-500'}`}>{p.estado}</p>
                          </div>
                        </div>
                      )) : <p className="p-4 text-sm text-gray-400">Sin facturas</p>}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Company360Modal;
