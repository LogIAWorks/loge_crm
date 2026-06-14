import { useEffect, useState } from 'react';
import { Plus, Search, DollarSign, Edit2, Trash2, X, ShieldCheck, ArrowDownLeft, Handshake } from 'lucide-react';
import { api, authHeaders, jsonHeaders } from '../api';

const val = (obj: any, ...keys: string[]) => {
  for (const k of keys) { if (obj[k] != null && obj[k] !== '') return obj[k]; }
  return null;
};

const ESTADOS = ['pendiente', 'cobrado', 'parcial', 'vencido'];

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [affiliates, setAffiliates] = useState<any[]>([]);

  const h = authHeaders();
  const fetchPayments = () => api('/api/payments', { headers: h }).then(r => r.json()).then(setPayments);
  const fetchAffiliates = () => api('/api/affiliates', { headers: h }).then(r => r.json()).then(setAffiliates);
  useEffect(() => { fetchPayments(); fetchAffiliates(); }, []);

  const openEdit = (p: any) => {
    setFormData({
      ...p,
      fecha: val(p, 'fecha_prevista_cobro', 'fecha_vencimiento', 'fecha') || '',
      afiliado_id: p.afiliado_id || '',
      comision_pct: p.comision_pct ?? '',
      comision_estado: p.comision_estado || 'pendiente',
    });
    setShowModal(true);
  };

  // Al elegir colaborador, autorrellenar su % por defecto si no hay uno puesto
  const onAffiliateChange = (id: string) => {
    const aff = affiliates.find(a => String(a.id) === id);
    setFormData((prev: any) => ({
      ...prev,
      afiliado_id: id,
      comision_pct: id ? (prev.comision_pct !== '' && prev.comision_pct != null ? prev.comision_pct : (aff?.comision_pct ?? '')) : '',
      comision_estado: id ? (prev.comision_estado || 'pendiente') : '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const method = formData.id ? 'PATCH' : 'POST';
    const url = formData.id ? `/api/payments/${formData.id}` : '/api/payments';
    const tieneAfiliado = !!formData.afiliado_id;
    const body: any = {
      cliente: formData.cliente,
      concepto: formData.concepto,
      importe: formData.importe ? Number(formData.importe) : null,
      estado: formData.estado,
      fecha: formData.fecha,
      factura_emitida: formData.factura_emitida || null,
      contrato_firmado: formData.contrato_firmado || null,
      notas: formData.notas || null,
      afiliado_id: tieneAfiliado ? Number(formData.afiliado_id) : null,
      comision_pct: tieneAfiliado && formData.comision_pct !== '' ? Number(formData.comision_pct) : null,
      comision_estado: tieneAfiliado ? (formData.comision_estado || 'pendiente') : null,
    };
    api(url, { method, headers: jsonHeaders(), body: JSON.stringify(body) })
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) { alert('Error: ' + (data.error || r.status)); return; }
        setShowModal(false); fetchPayments();
      });
  };

  const comisionCalculada = formData.afiliado_id && formData.importe && formData.comision_pct !== ''
    ? (Number(formData.importe) * Number(formData.comision_pct) / 100)
    : 0;
  const affName = (id: any) => affiliates.find(a => a.id === id)?.nombre || '';

  const filtered = payments.filter(p =>
    (p.cliente || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.concepto || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    cobrado: payments.filter(p => p.estado === 'cobrado').reduce((a, c) => a + (Number(c.importe) || 0), 0),
    pendiente: payments.filter(p => p.estado !== 'cobrado').reduce((a, c) => a + (Number(c.importe) || 0), 0),
  };

  const getFecha = (p: any) => val(p, 'fecha_prevista_cobro', 'fecha_vencimiento', 'fecha') || '—';

  return (
    <div className="space-y-6 page-enter pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="bg-emerald-500 rounded-[32px] p-8 text-white shadow-lg shadow-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Total Cobrado</p>
            <p className="text-4xl font-black">€{stats.cobrado.toLocaleString('es-ES')}</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="bg-white rounded-[32px] p-8 border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Pendiente de Cobro</p>
            <p className="text-4xl font-black text-gray-900">€{stats.pendiente.toLocaleString('es-ES')}</p>
          </div>
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
            <ArrowDownLeft className="w-8 h-8 text-amber-500" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por cliente o concepto..." className="input pl-10 !py-2.5 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => { setFormData({ estado: 'pendiente', fecha: new Date().toISOString().split('T')[0] }); setShowModal(true); }} className="btn-primary !py-2.5 text-sm font-bold px-6">
          <Plus className="w-4 h-4" /> Nuevo Cobro
        </button>
      </div>

      <div className="card overflow-hidden border-none shadow-sm ring-1 ring-gray-100">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Fecha</th>
              <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Cliente / Concepto</th>
              <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400 text-right">Importe</th>
              <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Estado</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(p => (
              <tr key={p.id} className="group hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => openEdit(p)}>
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-gray-900">{getFecha(p)}</p>
                  <div className="flex gap-1 mt-1.5">
                    {p.factura_emitida === 'Sí' && <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-lg font-black uppercase">Factura</span>}
                    {p.contrato_firmado === 'Sí' && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-lg font-black uppercase">Contrato</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 text-sm">{p.cliente}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{p.concepto}</p>
                  {p.afiliado_id && (
                    <span className={`inline-flex items-center gap-1 mt-1.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-lg ${p.comision_estado === 'pagada' ? 'bg-emerald-50 text-emerald-600' : 'bg-teal-50 text-teal-600'}`}>
                      <Handshake className="w-2.5 h-2.5" /> {affName(p.afiliado_id)} · {Number(p.comision_pct || 0)}%
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-sm font-black text-gray-900">€{Number(p.importe || 0).toLocaleString('es-ES')}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${p.estado === 'cobrado' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{p.estado}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="py-16 text-center"><DollarSign className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">Sin pagos</p></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="flex min-h-full items-center justify-center p-4 py-8">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-modal overflow-hidden animate-slide-up flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
                <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                  <h3 className="text-lg font-black text-gray-900">{formData.id ? 'Editar Cobro' : 'Nuevo Cobro'}</h3>
                  <button type="button" onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-8 space-y-5 overflow-y-auto flex-1">
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Cliente *</label>
                    <input required placeholder="Ej: Miami Gastro" className="input font-bold" value={formData.cliente || ''} onChange={e => setFormData({...formData, cliente: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Concepto *</label>
                    <input required placeholder="Ej: Setup Agente de Voz" className="input" value={formData.concepto || ''} onChange={e => setFormData({...formData, concepto: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Importe (€) *</label>
                      <input type="number" step="0.01" required className="input font-black" value={formData.importe || ''} onChange={e => setFormData({...formData, importe: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Estado *</label>
                      <select className="input" value={formData.estado || 'pendiente'} onChange={e => setFormData({...formData, estado: e.target.value})}>
                        {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Fecha *</label>
                    <input type="date" required className="input" value={formData.fecha || ''} onChange={e => setFormData({...formData, fecha: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-2xl">
                      <input type="checkbox" checked={formData.factura_emitida === 'Sí'} onChange={e => setFormData({...formData, factura_emitida: e.target.checked ? 'Sí' : 'No'})} className="rounded" />
                      <span className="text-[10px] font-bold uppercase text-gray-500">Factura emitida</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-2xl">
                      <input type="checkbox" checked={formData.contrato_firmado === 'Sí'} onChange={e => setFormData({...formData, contrato_firmado: e.target.checked ? 'Sí' : 'No'})} className="rounded" />
                      <span className="text-[10px] font-bold uppercase text-gray-500">Contrato firmado</span>
                    </label>
                  </div>

                  {/* Colaborador / Comisión */}
                  <div className="pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Handshake className="w-3.5 h-3.5" /> Colaborador (opcional)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">¿Quién trajo esta venta?</label>
                        <select className="input !bg-gray-50/50" value={formData.afiliado_id || ''} onChange={e => onAffiliateChange(e.target.value)}>
                          <option value="">— Sin colaborador —</option>
                          {affiliates.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </select>
                      </div>
                      {formData.afiliado_id && (
                        <>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">% Comisión</label>
                            <input type="number" step="0.01" min="0" max="100" className="input !bg-gray-50/50" value={formData.comision_pct} onChange={e => setFormData({...formData, comision_pct: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Estado comisión</label>
                            <select className="input !bg-gray-50/50" value={formData.comision_estado || 'pendiente'} onChange={e => setFormData({...formData, comision_estado: e.target.value})}>
                              <option value="pendiente">Pendiente</option>
                              <option value="pagada">Pagada</option>
                            </select>
                          </div>
                          <div className="col-span-2 bg-teal-50 rounded-2xl p-3 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-teal-600">Comisión a pagar</span>
                            <span className="text-sm font-black text-teal-700">€{comisionCalculada.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
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
                <button onClick={() => { api(`/api/payments/${deleteId}`, { method: 'DELETE', headers: h }).then(() => { setDeleteId(null); fetchPayments(); }); }} className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-2xl text-xs uppercase">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
