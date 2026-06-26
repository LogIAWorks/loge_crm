import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable, useDraggable, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Plus, Search, AlertTriangle, List, LayoutGrid, X, Trash2, Edit2, Eye, UserCheck } from 'lucide-react';
import { api, authHeaders, jsonHeaders } from '../api';
import { toast } from '../components/toast';
import { useEscapeKey } from '../utils/useEscapeKey';
import Company360Modal from '../components/Company360Modal';

const val = (obj: any, ...keys: string[]) => {
  for (const k of keys) { if (obj[k] != null && obj[k] !== '') return obj[k]; }
  return null;
};

const ESTADOS = ['Prospecto', 'Contactado', 'Reunión Agendada', 'Propuesta Enviada', 'Esperando respuesta', 'Cerrado', 'Perdido'];

// ── Draggable card ──────────────────────────────────────────────────────────
const DraggableCard = ({ lead, onEdit, overdue, nota, interes, followUp }: any) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onEdit(lead)}
      className={`card p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group select-none
        ${overdue ? 'ring-2 ring-red-500 shadow-sm shadow-red-100' : 'border-none ring-1 ring-gray-100'}
        ${isDragging ? 'opacity-30' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-bold text-gray-900 text-sm leading-tight">{lead.empresa}</h4>
        {overdue && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 animate-pulse" />}
      </div>
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{nota}</p>
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
        <span className="text-[10px] font-black text-brand uppercase truncate max-w-[120px] bg-brand/5 px-2 py-1 rounded-lg">{interes}</span>
        <span className={`text-[10px] font-bold ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
          {followUp ? new Date(followUp).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : 'Sin fecha'}
        </span>
      </div>
    </div>
  );
};

// ── Drag overlay ghost card ─────────────────────────────────────────────────
const GhostCard = ({ lead, overdue, nota, interes, followUp }: any) => (
  <div className={`card p-4 w-80 shadow-2xl rotate-2 scale-105
    ${overdue ? 'ring-2 ring-red-500' : 'ring-1 ring-gray-200'}`}>
    <div className="flex items-start justify-between mb-2">
      <h4 className="font-bold text-gray-900 text-sm leading-tight">{lead.empresa}</h4>
      {overdue && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
    </div>
    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{nota}</p>
    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
      <span className="text-[10px] font-black text-brand uppercase truncate max-w-[120px] bg-brand/5 px-2 py-1 rounded-lg">{interes}</span>
      <span className={`text-[10px] font-bold ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
        {followUp ? new Date(followUp).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : 'Sin fecha'}
      </span>
    </div>
  </div>
);

// ── Droppable column ────────────────────────────────────────────────────────
const DroppableColumn = ({ estado, columnLeads, isOver, onEdit, isOverdue, getNota, getInteres, getFollowUp }: any) => {
  const { setNodeRef } = useDroppable({ id: estado });
  return (
    <div
      ref={setNodeRef}
      className={`flex-none w-80 rounded-3xl p-4 border flex flex-col h-[calc(100vh-220px)] transition-colors duration-150
        ${isOver ? 'bg-brand/5 border-brand/30' : 'bg-gray-50/50 border-gray-100'}`}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-black text-gray-900 text-sm">{estado}</h3>
        <span className="text-[10px] font-black text-gray-400 bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-50">
          {columnLeads.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
        {columnLeads.map((lead: any) => {
          const followUp = getFollowUp(lead);
          const overdue = isOverdue(followUp);
          return (
            <DraggableCard
              key={lead.id}
              lead={lead}
              onEdit={onEdit}
              overdue={overdue}
              nota={getNota(lead)}
              interes={getInteres(lead)}
              followUp={followUp}
            />
          );
        })}
        {columnLeads.length === 0 && (
          <div className={`h-20 rounded-2xl border-2 border-dashed flex items-center justify-center transition-colors
            ${isOver ? 'border-brand/40 bg-brand/5' : 'border-gray-200'}`}>
            <span className="text-[10px] text-gray-300 font-bold uppercase">Suelta aquí</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────
const Pipeline = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [view360, setView360] = useState<string | null>(null);
  const [confirmConvert, setConfirmConvert] = useState(false);
  const [converting, setConverting] = useState(false);

  const h = authHeaders();
  const fetchLeads = () => api('/api/leads', { headers: h }).then(r => r.json()).then(d => setLeads(Array.isArray(d) ? d : [])).catch(() => toast.error('No se pudieron cargar los leads'));
  useEffect(() => { fetchLeads(); }, []);
  useEscapeKey(showModal, () => setShowModal(false));
  useEscapeKey(deleteId != null, () => setDeleteId(null));
  useEscapeKey(view360 != null, () => setView360(null));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const openEdit = (l: any) => {
    setFormData({
      ...l,
      interes_principal: val(l, 'interes_principal', 'servicio_interesado') || '',
      proximo_follow_up: val(l, 'proximo_follow_up', 'fecha_proxima_accion') || '',
      nota_corta: val(l, 'nota_corta', 'proxima_accion') || '',
      valor_estimado: val(l, 'valor_estimado') || '',
    });
    setConfirmConvert(false);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const method = formData.id ? 'PATCH' : 'POST';
    const url = formData.id ? `/api/leads/${formData.id}` : '/api/leads';
    const body: any = {
      empresa: formData.empresa,
      contacto: formData.contacto,
      telefono: formData.telefono,
      estado: formData.estado,
      interes_principal: formData.interes_principal,
      ultimo_contacto: formData.ultimo_contacto,
      proximo_follow_up: formData.proximo_follow_up,
      nota_corta: formData.nota_corta,
      email: formData.email || null,
      web: formData.web || null,
      valor_estimado: formData.valor_estimado ? Number(formData.valor_estimado) : null,
      probabilidad_cierre: formData.probabilidad_cierre || null,
    };
    api(url, { method, headers: jsonHeaders(), body: JSON.stringify(body) })
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) { toast.error('Error: ' + (data.error || r.status)); return; }
        toast.success(formData.id ? 'Lead actualizado' : 'Lead creado');
        setShowModal(false); fetchLeads();
      });
  };

  // Convierte el lead actual del formulario en un cliente y marca el lead como Cerrado.
  const doConvert = async () => {
    if (!formData.id || converting) return;
    setConverting(true);
    // Evitar duplicados: si ya existe un cliente con ese nombre, abortar.
    try {
      const cr = await api('/api/clients', { headers: h });
      const clients = await cr.json();
      const dup = Array.isArray(clients) && clients.some((c: any) => (c.empresa || '').trim().toLowerCase() === (formData.empresa || '').trim().toLowerCase());
      if (dup) { toast.error('Ya existe un cliente con ese nombre'); setConverting(false); setConfirmConvert(false); return; }
    } catch { /* si falla la comprobación, continuamos */ }
    const en30dias = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })();
    const clientBody = {
      empresa: formData.empresa,
      contacto: formData.contacto || null,
      servicio_contratado: val(formData, 'interes_principal', 'servicio_interesado') || 'Por definir',
      valor: formData.valor_estimado ? Number(formData.valor_estimado) : null,
      estado_cliente: 'Onboarding',
      estado_pago: 'Pendiente',
      proxima_revision: en30dias,
      notas: val(formData, 'nota_corta', 'proxima_accion') || 'Convertido desde lead',
      proximo_paso: val(formData, 'nota_corta', 'proxima_accion') || 'Onboarding inicial',
      telefono: formData.telefono || null,
      email: formData.email || null,
    };
    const r = await api('/api/clients', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(clientBody) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { toast.error('No se pudo convertir: ' + (data.error || r.status)); setConverting(false); return; }
    await api(`/api/leads/${formData.id}`, { method: 'PATCH', headers: jsonHeaders(), body: JSON.stringify({ estado: 'Cerrado' }) });
    toast.success(`${formData.empresa} convertido en cliente 🎉`);
    setConverting(false); setConfirmConvert(false);
    setShowModal(false); fetchLeads();
  };

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as number);
  };

  const handleDragOver = (e: any) => {
    setOverColumn(e.over?.id ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    setOverColumn(null);
    if (!over) return;
    const lead = leads.find(l => l.id === active.id);
    const newEstado = over.id as string;
    if (!lead || lead.estado === newEstado) return;
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, estado: newEstado } : l));
    api(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({ estado: newEstado }),
    }).catch(() => fetchLeads());
  };

  const filtered = leads.filter(l =>
    (l.empresa || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.contacto || '').toLowerCase().includes(search.toLowerCase())
  );

  const isOverdue = (dateStr: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date(new Date().toISOString().split('T')[0]);
  };

  const getFollowUp = (l: any) => val(l, 'proximo_follow_up', 'fecha_proxima_accion');
  const getInteres  = (l: any) => val(l, 'interes_principal', 'servicio_interesado') || '—';
  const getNota     = (l: any) => val(l, 'nota_corta', 'proxima_accion', 'notas') || 'Sin notas';

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    <div className="space-y-6 page-enter pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar lead..." className="input pl-10 !py-2.5 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setView('kanban')} className={`p-1.5 rounded-lg transition-all ${view === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setView('list')} className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}><List className="w-4 h-4" /></button>
          </div>
        </div>
        <button onClick={() => { setFormData({ estado: 'Prospecto', ultimo_contacto: new Date().toISOString().split('T')[0] }); setShowModal(true); }} className="btn-primary !py-2.5 text-sm font-bold px-6">
          <Plus className="w-4 h-4" /> Nuevo Lead
        </button>
      </div>

      {/* Kanban */}
      {view === 'kanban' ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-8 custom-scrollbar">
            {ESTADOS.map(estado => {
              const columnLeads = filtered.filter(l => (l.estado || 'Prospecto') === estado);
              return (
                <DroppableColumn
                  key={estado}
                  estado={estado}
                  columnLeads={columnLeads}
                  isOver={overColumn === estado}
                  onEdit={openEdit}
                  isOverdue={isOverdue}
                  getNota={getNota}
                  getInteres={getInteres}
                  getFollowUp={getFollowUp}
                />
              );
            })}
          </div>
          {/* Portal a body: evita el desfase del overlay por el transform del contenedor .page-enter */}
          {createPortal(
            <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
              {activeLead ? (
                <GhostCard
                  lead={activeLead}
                  overdue={isOverdue(getFollowUp(activeLead))}
                  nota={getNota(activeLead)}
                  interes={getInteres(activeLead)}
                  followUp={getFollowUp(activeLead)}
                />
              ) : null}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      ) : (
        /* List view */
        <div className="card overflow-x-auto border-none shadow-sm ring-1 ring-gray-100">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Lead</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Interés</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Estado</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Follow-up</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(lead => {
                const followUp = getFollowUp(lead);
                const overdue = isOverdue(followUp);
                return (
                  <tr key={lead.id} className="group hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => openEdit(lead)}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm">{lead.empresa}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{lead.contacto || ''}</p>
                    </td>
                    <td className="px-6 py-4"><p className="text-sm text-gray-700">{getInteres(lead)}</p></td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600">{lead.estado || 'Prospecto'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${overdue ? 'bg-red-50 text-red-600' : 'text-gray-600'}`}>{followUp || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button title="Vista 360°" onClick={(e) => { e.stopPropagation(); setView360(lead.empresa); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-violet-500"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); openEdit(lead); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteId(lead.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="flex min-h-full items-center justify-center p-4 py-8">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-modal overflow-hidden animate-slide-up flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                <h3 className="text-lg font-black text-gray-900">{formData.id ? 'Ficha de Lead' : 'Nuevo Lead'}</h3>
                <button type="button" onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Empresa *</label>
                    <input required className="input font-bold" value={formData.empresa || ''} onChange={e => setFormData({...formData, empresa: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Contacto *</label>
                    <input required className="input" value={formData.contacto || ''} onChange={e => setFormData({...formData, contacto: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Teléfono *</label>
                    <input required className="input" value={formData.telefono || ''} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Estado *</label>
                    <select required className="input" value={formData.estado || 'Prospecto'} onChange={e => setFormData({...formData, estado: e.target.value})}>
                      {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Interés Principal *</label>
                    <input required className="input" placeholder="Ej: Web, Agente de Voz..." value={formData.interes_principal || ''} onChange={e => setFormData({...formData, interes_principal: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Último Contacto</label>
                    <input type="date" className="input" value={formData.ultimo_contacto || ''} onChange={e => setFormData({...formData, ultimo_contacto: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Próximo Follow-up</label>
                    <input type="date" className="input border-brand/20" value={formData.proximo_follow_up || ''} onChange={e => setFormData({...formData, proximo_follow_up: e.target.value})} />
                    <p className="text-[9px] text-gray-400 mt-1">Opcional · vacío si no requiere seguimiento</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Nota Corta *</label>
                    <input required className="input" placeholder="Ej: Interesado, llamar mañana" value={formData.nota_corta || ''} onChange={e => setFormData({...formData, nota_corta: e.target.value})} />
                  </div>
                </div>
                <div className="pt-5 border-t border-gray-100">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">Opcional</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Email</label>
                      <input type="email" className="input !bg-gray-50/50" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Web</label>
                      <input className="input !bg-gray-50/50" value={formData.web || ''} onChange={e => setFormData({...formData, web: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Valor Estimado (€)</label>
                      <input type="number" min="0" className="input !bg-gray-50/50" value={formData.valor_estimado || ''} onChange={e => setFormData({...formData, valor_estimado: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Prob. Cierre</label>
                      <select className="input !bg-gray-50/50" value={formData.probabilidad_cierre || ''} onChange={e => setFormData({...formData, probabilidad_cierre: e.target.value})}>
                        <option value="">Seleccionar...</option>
                        <option value="Alta">Alta</option>
                        <option value="Media">Media</option>
                        <option value="Baja">Baja</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-end gap-3 shrink-0">
                {formData.id && (
                  <button
                    type="button"
                    disabled={converting}
                    onClick={() => confirmConvert ? doConvert() : setConfirmConvert(true)}
                    className={`mr-auto inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-2xl transition-colors disabled:opacity-60 ${confirmConvert ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
                  >
                    <UserCheck className="w-4 h-4" /> {converting ? 'Convirtiendo…' : confirmConvert ? '¿Confirmar conversión?' : 'Convertir en Cliente'}
                  </button>
                )}
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

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4 py-8">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-modal animate-slide-up">
            <h3 className="text-lg font-black text-gray-900 mb-6">¿Eliminar lead?</h3>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl">No</button>
              <button onClick={() => { api(`/api/leads/${deleteId}`, { method: 'DELETE', headers: h }).then(() => { setDeleteId(null); fetchLeads(); toast.success('Lead eliminado'); }); }} className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-2xl text-xs uppercase">Sí, eliminar</button>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
