import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Star, Users as UsersIcon, Eye, Download } from 'lucide-react';
import { api, authHeaders, jsonHeaders } from '../api';
import { toast } from '../components/toast';
import { exportToCSV } from '../utils/csv';
import { fmtDate } from '../utils/date';
import { useEscapeKey } from '../utils/useEscapeKey';
import Company360Modal from '../components/Company360Modal';

// Helper: read from whichever column has data (old or new schema)
const val = (obj: any, ...keys: string[]) => {
  for (const k of keys) { if (obj[k] != null && obj[k] !== '') return obj[k]; }
  return null;
};

const ESTADOS_CLIENTE = ['Activo', 'Onboarding', 'Mantenimiento', 'En Pausa', 'En Riesgo', 'Baja'];
const ESTADOS_PAGO = ['Al día', 'Pendiente', 'Retraso', 'Moroso'];

const Clients = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [view360, setView360] = useState<string | null>(null);

  const h = authHeaders();
  const fetchClients = () => api('/api/clients', { headers: h }).then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : [])).catch(() => toast.error('No se pudieron cargar los clientes'));
  useEffect(() => { fetchClients(); }, []);
  useEscapeKey(showModal, () => setShowModal(false));
  useEscapeKey(deleteId != null, () => setDeleteId(null));
  useEscapeKey(view360 != null, () => setView360(null));

  const openEdit = (client: any) => {
    setFormData({
      ...client,
      servicio_contratado: val(client, 'servicio_contratado') || '',
      valor: val(client, 'valor', 'importe') || '',
      estado_cliente: val(client, 'estado_cliente') || 'Activo',
      estado_pago: val(client, 'estado_pago') || 'Al día',
      proxima_revision: val(client, 'proxima_revision') || '',
      // Unificar notas + proximo_paso en un solo campo visible
      notas: val(client, 'notas', 'proximo_paso', 'siguiente_accion') || '',
      telefono: val(client, 'telefono') || '',
      email: val(client, 'email') || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const method = formData.id ? 'PATCH' : 'POST';
    const url = formData.id ? `/api/clients/${formData.id}` : '/api/clients';
    const body: any = {
      empresa: formData.empresa,
      contacto: formData.contacto || null,
      servicio_contratado: formData.servicio_contratado,
      valor: formData.valor ? Number(formData.valor) : null,
      estado_cliente: formData.estado_cliente,
      estado_pago: formData.estado_pago,
      proxima_revision: formData.proxima_revision,
      notas: formData.notas,
      proximo_paso: formData.notas, // sincronizar ambas columnas
      telefono: formData.telefono || null,
      email: formData.email || null,
      mantenimiento: formData.mantenimiento || null,
      recurrencia: formData.recurrencia || null,
      satisfaccion: formData.satisfaccion ? Number(formData.satisfaccion) : null,
    };
    api(url, { method, headers: jsonHeaders(), body: JSON.stringify(body) })
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          toast.error('Error al guardar: ' + (data.error || r.status));
          return;
        }
        toast.success(formData.id ? 'Cliente actualizado' : 'Cliente creado');
        setShowModal(false);
        fetchClients();
      });
  };

  const filtered = clients.filter(c =>
    (c.empresa || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.contacto || '').toLowerCase().includes(search.toLowerCase())
  );

  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: 'empresa', dir: 1 });
  const sortVal = (c: any, key: string) => key === 'importe' ? getImporte(c) : key === 'revision' ? (c.proxima_revision || '') : (c.empresa || '');
  const toggleSort = (key: string) => setSort(s => s.key === key ? { key, dir: (s.dir === 1 ? -1 : 1) } : { key, dir: 1 });
  const sorted = [...filtered].sort((a, b) => { const x = sortVal(a, sort.key), y = sortVal(b, sort.key); return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; });
  const arrow = (key: string) => sort.key === key ? (sort.dir === 1 ? ' ↑' : ' ↓') : '';

  const exportCSV = () => {
    if (filtered.length === 0) { toast.info('No hay clientes que exportar'); return; }
    exportToCSV('clientes', filtered.map(c => ({
      empresa: c.empresa,
      contacto: c.contacto || '',
      servicio: getServicio(c),
      estado: getEstadoCliente(c),
      estado_pago: getEstadoPago(c),
      proxima_revision: getEstadoCliente(c) === 'Baja' ? '' : (c.proxima_revision || ''),
      importe: getImporte(c),
      satisfaccion: c.satisfaccion || '',
      telefono: c.telefono || '',
      email: c.email || '',
    })), [
      { key: 'empresa', label: 'Empresa' }, { key: 'contacto', label: 'Contacto' },
      { key: 'servicio', label: 'Servicio' }, { key: 'estado', label: 'Estado' },
      { key: 'estado_pago', label: 'Estado Pago' }, { key: 'proxima_revision', label: 'Próxima Revisión' },
      { key: 'importe', label: 'Importe (€)' }, { key: 'satisfaccion', label: 'Satisfacción' },
      { key: 'telefono', label: 'Teléfono' }, { key: 'email', label: 'Email' },
    ]);
    toast.success(`${filtered.length} clientes exportados`);
  };

  const getImporte = (c: any) => Number(val(c, 'valor', 'importe') || 0);
  const getCobrado = (c: any) => Number(c.cobrado ?? 0);
  const getPendiente = (c: any) => Number(c.pendiente ?? 0);
  const getServicio = (c: any) => val(c, 'servicio_contratado') || '—';
  const getEstadoCliente = (c: any) => val(c, 'estado_cliente') || 'Activo';
  const getEstadoPago = (c: any) => val(c, 'estado_pago') || '—';
  const getProximaRev = (c: any) => val(c, 'proxima_revision') || '—';
  const getNotas = (c: any) => val(c, 'notas', 'proximo_paso', 'siguiente_accion') || '';
  // Un cliente de Baja no tiene nada que revisar: no genera aviso de revisión vencida.
  const isRevisionVencida = (c: any) =>
    getEstadoCliente(c) !== 'Baja' &&
    c.proxima_revision && c.proxima_revision < new Date().toLocaleDateString('en-CA');

  const renderStars = (n: number) => (
    <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= n ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />)}</div>
  );

  const estadoColor = (e: string) => {
    if (e === 'Activo') return 'text-emerald-600 bg-emerald-50';
    if (e === 'Onboarding') return 'text-blue-600 bg-blue-50';
    if (e === 'Baja') return 'text-gray-400 bg-gray-100';
    if (e === 'En Riesgo') return 'text-red-600 bg-red-50';
    return 'text-amber-600 bg-amber-50';
  };

  return (
    <div className="space-y-6 page-enter pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar cliente..." className="input pl-10 !py-2.5 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCSV()} className="btn-secondary !py-2.5 text-sm font-bold px-4" title="Exportar a CSV">
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button onClick={() => { setFormData({ estado_cliente: 'Activo', estado_pago: 'Pendiente' }); setShowModal(true); }} className="btn-primary !py-2.5 text-sm font-bold px-6">
            <Plus className="w-4 h-4" /> Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto border-none shadow-sm ring-1 ring-gray-100">
        <table className="w-full text-left min-w-[760px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Cliente</th>
              <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Servicio</th>
              <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Estado</th>
              <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400 cursor-pointer select-none hover:text-gray-600" onClick={() => toggleSort('revision')}>Próxima Revisión{arrow('revision')}</th>
              <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400 text-right cursor-pointer select-none hover:text-gray-600" onClick={() => toggleSort('importe')}>Importe{arrow('importe')}</th>
              <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Satisf.</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map(client => (
              <tr key={client.id} className="group hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => openEdit(client)}>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 text-sm">{client.empresa}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{client.contacto || ''}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-700 truncate max-w-[200px]">{getServicio(client)}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${estadoColor(getEstadoCliente(client))}`}>{getEstadoCliente(client)}</span>
                  <p className={`text-[10px] font-bold mt-1 ${getEstadoPago(client) === 'Al día' ? 'text-emerald-500' : 'text-amber-500'}`}>{getEstadoPago(client)}</p>
                </td>
                <td className="px-6 py-4">
                  {getEstadoCliente(client) === 'Baja'
                    ? <p className="text-xs font-bold text-gray-300">— Sin revisión</p>
                    : <p className={`text-xs font-bold ${isRevisionVencida(client) ? 'text-red-500' : 'text-gray-700'}`}>{client.proxima_revision ? fmtDate(client.proxima_revision) : '—'}</p>}
                  <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{getNotas(client)}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-sm font-black text-gray-900">€{getImporte(client).toLocaleString('es-ES')}</p>
                  {getPendiente(client) > 0
                    ? <p className="text-[10px] font-bold text-amber-600 mt-0.5">Pend. €{getPendiente(client).toLocaleString('es-ES')}</p>
                    : getCobrado(client) > 0 && <p className="text-[10px] font-bold text-emerald-500 mt-0.5">Cobrado</p>}
                </td>
                <td className="px-6 py-4">
                  {client.satisfaccion ? renderStars(client.satisfaccion) : <span className="text-[10px] text-gray-300">—</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button title="Vista 360°" onClick={(e) => { e.stopPropagation(); setView360(client.empresa); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-violet-500"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); openEdit(client); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(client.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-16 text-center"><UsersIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">Sin clientes</p></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="flex min-h-full items-center justify-center p-4 py-8">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-modal overflow-hidden animate-slide-up flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                <h3 className="text-lg font-black text-gray-900">{formData.id ? 'Ficha de Cliente' : 'Nuevo Cliente'}</h3>
                <button type="button" onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {/* Required fields */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Empresa *</label>
                    <input required className="input font-bold" value={formData.empresa || ''} onChange={e => setFormData({...formData, empresa: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Contacto</label>
                    <input className="input" value={formData.contacto || ''} onChange={e => setFormData({...formData, contacto: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Servicio Vendido *</label>
                    <input required className="input" value={formData.servicio_contratado || ''} onChange={e => setFormData({...formData, servicio_contratado: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Importe (€) *</label>
                    <input type="number" step="0.01" min="0" required className="input" value={formData.valor || ''} onChange={e => setFormData({...formData, valor: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Estado Cliente *</label>
                    <select required className="input" value={formData.estado_cliente || 'Activo'} onChange={e => setFormData({...formData, estado_cliente: e.target.value})}>
                      {ESTADOS_CLIENTE.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Estado Pago *</label>
                    <select required className="input" value={formData.estado_pago || 'Pendiente'} onChange={e => setFormData({...formData, estado_pago: e.target.value})}>
                      {ESTADOS_PAGO.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Próxima Revisión *</label>
                    <input type="date" required className="input" value={formData.proxima_revision || ''} onChange={e => setFormData({...formData, proxima_revision: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Próximo Paso / Notas *</label>
                    <textarea rows={2} required className="input" placeholder="Ej: Preguntar por la nueva carta y fotos" value={formData.notas || ''} onChange={e => setFormData({...formData, notas: e.target.value})} />
                  </div>
                </div>
                {/* Optional fields */}
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">Opcional</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Teléfono</label>
                      <input className="input !bg-gray-50/50" value={formData.telefono || ''} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Email</label>
                      <input type="email" className="input !bg-gray-50/50" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Satisfacción (1-5)</label>
                      <input type="number" min="1" max="5" className="input !bg-gray-50/50" value={formData.satisfaccion || ''} onChange={e => setFormData({...formData, satisfaccion: e.target.value})} />
                    </div>
                    <div className="flex items-end gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.mantenimiento === 'Sí'} onChange={e => setFormData({...formData, mantenimiento: e.target.checked ? 'Sí' : 'No'})} className="rounded" />
                        <span className="text-[10px] font-bold uppercase text-gray-500">Mant.</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.recurrencia === 'Sí'} onChange={e => setFormData({...formData, recurrencia: e.target.checked ? 'Sí' : 'No'})} className="rounded" />
                        <span className="text-[10px] font-bold uppercase text-gray-500">Recurrente</span>
                      </label>
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

      {/* Vista 360° */}
      {view360 && <Company360Modal companyName={view360} onClose={() => setView360(null)} />}

      {/* Delete */}
      {deleteId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-modal animate-slide-up">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-black text-gray-900 mb-1">¿Eliminar cliente?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl">Cancelar</button>
              <button onClick={() => { api(`/api/clients/${deleteId}`, { method: 'DELETE', headers: h }).then(() => { setDeleteId(null); fetchClients(); toast.success('Cliente eliminado'); }); }} className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-2xl text-xs uppercase">Eliminar</button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
