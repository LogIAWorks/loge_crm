import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Handshake, Users as UsersIcon, Percent, Wallet, CheckCircle2, Clock, Phone, Mail } from 'lucide-react';
import { api, authHeaders, jsonHeaders } from '../api';
import { toast } from '../components/toast';
import { useEscapeKey } from '../utils/useEscapeKey';

const TIPOS = ['Comercial', 'Partner técnico', 'Referido', 'Agencia', 'Otro'];

const eur = (n: number) => `€${(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Affiliates = () => {
  const [data, setData] = useState<{ affiliates: any[]; commissions: any[]; totals: any }>({ affiliates: [], commissions: [], totals: {} });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const h = authHeaders();
  const fetchData = () => api('/api/affiliates/summary', { headers: h }).then(r => r.json())
    .then(d => setData(d && Array.isArray(d.affiliates) ? d : { affiliates: [], commissions: [], totals: {} }))
    .catch(() => toast.error('No se pudieron cargar los colaboradores'));
  useEffect(() => { fetchData(); }, []);
  useEscapeKey(showModal, () => setShowModal(false));
  useEscapeKey(deleteId != null, () => setDeleteId(null));

  const openNew = () => { setFormData({ tipo: 'Comercial', comision_pct: 10 }); setShowModal(true); };
  const openEdit = (a: any) => { setFormData({ ...a }); setShowModal(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const method = formData.id ? 'PATCH' : 'POST';
    const url = formData.id ? `/api/affiliates/${formData.id}` : '/api/affiliates';
    const body: any = {
      nombre: formData.nombre,
      telefono: formData.telefono || null,
      email: formData.email || null,
      comision_pct: formData.comision_pct !== '' && formData.comision_pct != null ? Number(formData.comision_pct) : null,
      iban: formData.iban || null,
      nif: formData.nif || null,
      tipo: formData.tipo || null,
      notas: formData.notas || null,
    };
    api(url, { method, headers: jsonHeaders(), body: JSON.stringify(body) })
      .then(async r => {
        const resp = await r.json().catch(() => ({}));
        if (!r.ok) { toast.error('Error al guardar: ' + (resp.error || r.status)); return; }
        toast.success(formData.id ? 'Colaborador actualizado' : 'Colaborador creado');
        setShowModal(false); fetchData();
      });
  };

  const toggleComision = (c: any) => {
    const nuevo = c.comision_estado === 'pagada' ? 'pendiente' : 'pagada';
    api(`/api/payments/${c.id}`, { method: 'PATCH', headers: jsonHeaders(), body: JSON.stringify({ comision_estado: nuevo }) })
      .then(() => fetchData());
  };

  const filtered = data.affiliates.filter(a =>
    (a.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.tipo || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 page-enter pb-10">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-teal-500 rounded-[32px] p-7 text-white shadow-lg shadow-teal-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Comisión generada</p>
            <p className="text-3xl font-black">{eur(data.totals.comision_total)}</p>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md"><Handshake className="w-7 h-7" /></div>
        </div>
        <div className="bg-white rounded-[32px] p-7 border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Pendiente de pagar</p>
            <p className="text-3xl font-black text-amber-600">{eur(data.totals.comision_pendiente)}</p>
          </div>
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center"><Clock className="w-7 h-7 text-amber-500" /></div>
        </div>
        <div className="bg-white rounded-[32px] p-7 border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Ya pagado</p>
            <p className="text-3xl font-black text-emerald-600">{eur(data.totals.comision_pagada)}</p>
          </div>
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center"><CheckCircle2 className="w-7 h-7 text-emerald-500" /></div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar colaborador..." className="input pl-10 !py-2.5 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={openNew} className="btn-primary !py-2.5 text-sm font-bold px-6">
          <Plus className="w-4 h-4" /> Nuevo Colaborador
        </button>
      </div>

      {/* Tabla de colaboradores */}
      <div className="card overflow-x-auto border-none shadow-sm ring-1 ring-gray-100">
        <table className="w-full text-left min-w-[820px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Colaborador</th>
              <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Contacto</th>
              <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400 text-center">%</th>
              <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400 text-right">Ventas</th>
              <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400 text-right">Comisión total</th>
              <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400 text-right">Pendiente</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(a => (
              <tr key={a.id} className="group hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => openEdit(a)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 text-xs font-black uppercase">{(a.nombre || '?')[0]}</div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{a.nombre}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{a.tipo || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {a.telefono && <p className="text-xs text-gray-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {a.telefono}</p>}
                  {a.email && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /> {a.email}</p>}
                  {!a.telefono && !a.email && <span className="text-[10px] text-gray-300">—</span>}
                </td>
                <td className="px-6 py-4 text-center"><span className="text-sm font-black text-gray-900">{a.comision_pct != null ? `${a.comision_pct}%` : '—'}</span></td>
                <td className="px-6 py-4 text-right"><p className="text-sm text-gray-700">{a.num_ventas} · {eur(a.ventas_generadas)}</p></td>
                <td className="px-6 py-4 text-right"><p className="text-sm font-black text-gray-900">{eur(a.comision_total)}</p></td>
                <td className="px-6 py-4 text-right"><p className={`text-sm font-black ${a.comision_pendiente > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{eur(a.comision_pendiente)}</p></td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(a); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(a.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-16 text-center"><UsersIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">Sin colaboradores todavía</p></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Comisiones generadas */}
      <div className="card overflow-hidden border-none shadow-sm ring-1 ring-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-teal-500" />
          <h3 className="font-black text-gray-900 text-sm">Comisiones generadas</h3>
          <span className="text-[10px] font-black text-gray-400 uppercase ml-auto">{data.commissions.length}</span>
        </div>
        <div className="divide-y divide-gray-50">
          {data.commissions.map(c => (
            <div key={c.id} className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-gray-50/50">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{c.afiliado_nombre} <span className="text-gray-400 font-medium">·</span> {c.cliente}</p>
                <p className="text-xs text-gray-400 truncate">{c.concepto} — {eur(Number(c.importe))} × {Number(c.comision_pct || 0)}%</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-black text-gray-900">{eur(c.comision_importe)}</span>
                <button
                  onClick={() => toggleComision(c)}
                  className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-colors ${c.comision_estado === 'pagada' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                >
                  {c.comision_estado === 'pagada' ? '✓ Pagada' : 'Marcar pagada'}
                </button>
              </div>
            </div>
          ))}
          {data.commissions.length === 0 && (
            <div className="py-12 text-center">
              <Percent className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Sin comisiones. Asigna un colaborador a un cobro en la sección Pagos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal alta/edición */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="flex min-h-full items-center justify-center p-4 py-8">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-modal overflow-hidden animate-slide-up flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                  <h3 className="text-lg font-black text-gray-900">{formData.id ? 'Ficha de Colaborador' : 'Nuevo Colaborador'}</h3>
                  <button type="button" onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Nombre *</label>
                      <input required className="input font-bold" value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">% Comisión por defecto *</label>
                      <input type="number" step="0.01" min="0" max="100" required className="input" value={formData.comision_pct ?? ''} onChange={e => setFormData({...formData, comision_pct: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Tipo</label>
                      <select className="input" value={formData.tipo || 'Comercial'} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                        {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Teléfono</label>
                      <input className="input" value={formData.telefono || ''} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Email</label>
                      <input type="email" className="input" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                  </div>
                  <div className="pt-5 mt-5 border-t border-gray-100">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">Datos de pago / fiscales</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">IBAN</label>
                        <input className="input !bg-gray-50/50 font-mono text-xs" value={formData.iban || ''} onChange={e => setFormData({...formData, iban: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">NIF / CIF</label>
                        <input className="input !bg-gray-50/50" value={formData.nif || ''} onChange={e => setFormData({...formData, nif: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Notas</label>
                        <textarea rows={2} className="input !bg-gray-50/50" value={formData.notas || ''} onChange={e => setFormData({...formData, notas: e.target.value})} />
                      </div>
                    </div>
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
              <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-black text-gray-900 mb-1">¿Eliminar colaborador?</h3>
              <p className="text-sm text-gray-500 mb-6">Las comisiones asignadas en sus cobros se desvincularán. Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl">Cancelar</button>
                <button onClick={() => { api(`/api/affiliates/${deleteId}`, { method: 'DELETE', headers: h }).then(() => { setDeleteId(null); fetchData(); toast.success('Colaborador eliminado'); }); }} className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-2xl text-xs uppercase">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Affiliates;
