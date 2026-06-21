import { useEffect, useState } from 'react';
import { Plus, Search, Phone, MessageSquare, Users, Trash2, X, Clock, Zap, CheckCircle2 } from 'lucide-react';
import { api, authHeaders } from '../api';
import { toast } from '../components/toast';
import { useEscapeKey } from '../utils/useEscapeKey';

const val = (obj: any, ...keys: string[]) => {
  for (const k of keys) { if (obj[k] != null && obj[k] !== '') return obj[k]; }
  return null;
};

const TIPOS = ['Llamada', 'WhatsApp', 'Reunión', 'Visita presencial', 'Email', 'Otro'];

const MailIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const Interactions = () => {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const h = authHeaders();
  const fetchInteractions = () => api('/api/interactions', { headers: h }).then(r => r.json()).then(d => setInteractions(Array.isArray(d) ? d : [])).catch(() => toast.error('No se pudieron cargar las interacciones'));
  useEffect(() => { fetchInteractions(); }, []);
  useEscapeKey(showModal, () => setShowModal(false));
  useEscapeKey(deleteId != null, () => setDeleteId(null));

  const openEdit = (item: any) => {
    setFormData({
      ...item,
      resumen: val(item, 'resumen_corto', 'resumen') || '',
      proximo_paso: val(item, 'siguiente_paso', 'proximo_paso') || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const method = formData.id ? 'PATCH' : 'POST';
    const url = formData.id ? `/api/interactions/${formData.id}` : '/api/interactions';
    const body: any = {
      fecha: formData.fecha,
      tipo: formData.tipo,
      empresa: formData.empresa,
      resumen: formData.resumen,
      proximo_paso: formData.proximo_paso,
      detalle: formData.detalle || null,
      responsable: formData.responsable || null,
    };
    api(url, { method, headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) { toast.error('Error: ' + (data.error || r.status)); return; }
        toast.success(formData.id ? 'Actividad actualizada' : 'Actividad registrada');
        setShowModal(false); fetchInteractions();
      });
  };

  const getResumen = (i: any) => val(i, 'resumen_corto', 'resumen') || 'Sin resumen';
  const getProximo = (i: any) => val(i, 'siguiente_paso', 'proximo_paso') || '—';

  const filtered = interactions.filter(i =>
    (i.empresa || '').toLowerCase().includes(search.toLowerCase()) ||
    getResumen(i).toLowerCase().includes(search.toLowerCase())
  );

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'Llamada': return <Phone className="w-4 h-4" />;
      case 'WhatsApp': return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'Reunión': return <Users className="w-4 h-4 text-blue-500" />;
      case 'Email': return <MailIcon className="w-4 h-4 text-amber-500" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 page-enter pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar interacción..." className="input pl-10 !py-2.5 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => { setFormData({ fecha: new Date().toISOString().split('T')[0], tipo: 'WhatsApp', responsable: 'Edu' }); setShowModal(true); }} className="btn-primary !py-2.5 text-sm font-bold px-6">
          <Plus className="w-4 h-4" /> Registrar Actividad
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(item => (
          <div key={item.id} className="card group p-5 border-none shadow-sm ring-1 ring-gray-100 hover:ring-brand/50 transition-all cursor-pointer" onClick={() => openEdit(item)}>
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                  {getIcon(item.tipo)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm truncate max-w-[150px]">{item.empresa}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{item.tipo} · {item.fecha}</p>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }} className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-gray-700 font-medium line-clamp-2 mb-4 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100/50">
              {getResumen(item)}
            </p>
            <div className="flex items-center border-t border-gray-50 pt-3">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 mr-1.5" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Próximo: {getProximo(item)}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100">
            <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-gray-400">No hay interacciones registradas.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="flex min-h-full items-center justify-center p-4 py-8">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-modal overflow-hidden animate-slide-up flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                  <h3 className="text-lg font-black text-gray-900">{formData.id ? 'Editar Actividad' : 'Registrar Actividad'}</h3>
                  <button type="button" onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Fecha *</label>
                      <input type="date" required className="input" value={formData.fecha || ''} onChange={e => setFormData({...formData, fecha: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Tipo *</label>
                      <select className="input" value={formData.tipo || 'WhatsApp'} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                        {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Empresa / Cliente *</label>
                    <input required placeholder="Ej: Miami Gastro" className="input" value={formData.empresa || ''} onChange={e => setFormData({...formData, empresa: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Resumen *</label>
                    <input required placeholder="Ej: Confirmada reunión para demo" className="input font-bold" value={formData.resumen || ''} onChange={e => setFormData({...formData, resumen: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Siguiente Paso *</label>
                    <input required placeholder="Ej: Enviar presupuesto" className="input" value={formData.proximo_paso || ''} onChange={e => setFormData({...formData, proximo_paso: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Detalle (Opcional)</label>
                    <textarea rows={2} className="input !bg-gray-50/50" value={formData.detalle || ''} onChange={e => setFormData({...formData, detalle: e.target.value})} />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500">Cancelar</button>
                  <button type="submit" className="btn-primary !py-2.5 px-8 rounded-2xl font-bold text-xs uppercase tracking-wider">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete */}
      {deleteId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-modal animate-slide-up">
              <h3 className="text-lg font-black text-gray-900 mb-2">¿Eliminar registro?</h3>
              <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl">Cancelar</button>
                <button onClick={() => { api(`/api/interactions/${deleteId}`, { method: 'DELETE', headers: h }).then(() => { setDeleteId(null); fetchInteractions(); toast.success('Actividad eliminada'); }); }} className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-2xl text-xs uppercase">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interactions;
