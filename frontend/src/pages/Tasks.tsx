import { useEffect, useState } from 'react';
import { Plus, Search, Calendar, Briefcase, CheckCircle2, Trash2, X, Check } from 'lucide-react';
import { api, authHeaders } from '../api';
import { toast } from '../components/toast';
import { fmtDate } from '../utils/date';
import { useEscapeKey } from '../utils/useEscapeKey';

const val = (obj: any, ...keys: string[]) => {
  for (const k of keys) { if (obj[k] != null && obj[k] !== '') return obj[k]; }
  return null;
};

const ESTADOS = ['Pendiente', 'En curso', 'Bloqueado', 'Completado'];
const PRIORIDADES = ['Baja', 'Normal', 'Alta'];

const Tasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('Pendiente');

  const h = authHeaders();
  const fetchTasks = () => api('/api/tasks', { headers: h }).then(r => r.json()).then(d => setTasks(Array.isArray(d) ? d : [])).catch(() => toast.error('No se pudieron cargar las tareas'));
  useEffect(() => { fetchTasks(); }, []);
  useEscapeKey(showModal, () => setShowModal(false));
  useEscapeKey(deleteId != null, () => setDeleteId(null));

  const openEdit = (t: any) => {
    setFormData({
      ...t,
      relacionado_con: val(t, 'relacionado_con', 'empresa_relacionada', 'related_empresa') || '',
      responsable: val(t, 'responsable', 'asignado_a') || 'Edu',
      descripcion: val(t, 'descripcion', 'notas') || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const method = formData.id ? 'PATCH' : 'POST';
    const url = formData.id ? `/api/tasks/${formData.id}` : '/api/tasks';
    const body: any = {
      titulo: formData.titulo,
      relacionado_con: formData.relacionado_con,
      responsable: formData.responsable,
      fecha_limite: formData.fecha_limite,
      estado: formData.estado,
      prioridad: formData.prioridad,
      descripcion: formData.descripcion,
      bloqueos: formData.bloqueos || null,
      resultado: formData.resultado || null,
    };
    api(url, { method, headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) { toast.error('Error: ' + (data.error || r.status)); return; }
        toast.success(formData.id ? 'Tarea actualizada' : 'Tarea creada');
        setShowModal(false); fetchTasks();
      });
  };

  const completeTask = (t: any) => {
    api(`/api/tasks/${t.id}`, { method: 'PATCH', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: 'Completado' }) })
      .then(() => { fetchTasks(); toast.success('Tarea completada ✓'); });
  };

  const getRelacionado = (t: any) => val(t, 'relacionado_con', 'empresa_relacionada', 'related_empresa') || 'Interno';
  const getResponsable = (t: any) => val(t, 'responsable', 'asignado_a') || '—';

  const filtered = tasks.filter(t =>
    (t.estado || 'Pendiente') === activeTab &&
    ((t.titulo || '').toLowerCase().includes(search.toLowerCase()) || getRelacionado(t).toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusColor = (s: string) => {
    if (s === 'Completado') return 'text-emerald-500 bg-emerald-50';
    if (s === 'Bloqueado') return 'text-red-500 bg-red-50';
    if (s === 'En curso') return 'text-blue-500 bg-blue-50';
    return 'text-amber-500 bg-amber-50';
  };

  return (
    <div className="space-y-6 page-enter pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar tarea..." className="input pl-10 !py-2.5 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => { setFormData({ estado: 'Pendiente', responsable: 'Edu', prioridad: 'Normal' }); setShowModal(true); }} className="btn-primary !py-2.5 text-sm font-bold px-6">
          <Plus className="w-4 h-4" /> Nueva Tarea
        </button>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {ESTADOS.map(estado => (
          <button key={estado} onClick={() => setActiveTab(estado)} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === estado ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            {estado}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(task => (
          <div key={task.id} className="card group p-5 border-none shadow-sm ring-1 ring-gray-100 hover:ring-brand/50 transition-all cursor-pointer" onClick={() => openEdit(task)}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${getStatusColor(task.estado || 'Pendiente')}`}>{task.estado || 'Pendiente'}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {task.estado !== 'Completado' && (
                  <button title="Marcar completada" onClick={(e) => { e.stopPropagation(); completeTask(task); }} className="p-1 text-gray-300 hover:text-emerald-500"><Check className="w-4 h-4" /></button>
                )}
                <button title="Eliminar" onClick={(e) => { e.stopPropagation(); setDeleteId(task.id); }} className="p-1 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <h4 className="font-bold text-gray-900 text-sm leading-snug mb-2">{task.titulo}</h4>
            <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mb-4"><Briefcase className="w-3 h-3" /> {getRelacionado(task)}</p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center text-[10px] font-black text-brand uppercase">{(getResponsable(task) || '?')[0]}</div>
                <span className="text-[10px] font-bold text-gray-500 uppercase">{getResponsable(task)}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                <Calendar className="w-3 h-3" />{fmtDate(task.fecha_limite)}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100">
            <CheckCircle2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-gray-400">No hay tareas en este estado.</p>
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
                  <h3 className="text-lg font-black text-gray-900">{formData.id ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
                  <button type="button" onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Título *</label>
                    <input required placeholder="Ej: Subir demo de voz" className="input font-bold text-base" value={formData.titulo || ''} onChange={e => setFormData({...formData, titulo: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Cliente / Lead relacionado *</label>
                    <input required placeholder="Ej: Inmobiliaria Costa o Interno" className="input" value={formData.relacionado_con || ''} onChange={e => setFormData({...formData, relacionado_con: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Responsable</label>
                      <select className="input" value={formData.responsable || 'Edu'} onChange={e => setFormData({...formData, responsable: e.target.value})}>
                        <option value="Edu">Edu</option>
                        <option value="Oscar">Oscar</option>
                        <option value="Ekko">Ekko (IA)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Fecha Límite</label>
                      <input type="date" className="input" value={formData.fecha_limite || ''} onChange={e => setFormData({...formData, fecha_limite: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest mb-1 block">Estado</label>
                    <select className="input" value={formData.estado || 'Pendiente'} onChange={e => setFormData({...formData, estado: e.target.value})}>
                      {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Prioridad</label>
                    <div className="flex gap-3">
                      {PRIORIDADES.map(p => (
                        <button key={p} type="button" onClick={() => setFormData({...formData, prioridad: p})} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${formData.prioridad === p ? 'bg-brand text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Notas</label>
                    <textarea rows={3} className="input !bg-gray-50/50" placeholder="Detalles, bloqueos..." value={formData.descripcion || ''} onChange={e => setFormData({...formData, descripcion: e.target.value})} />
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
              <h3 className="text-lg font-black text-gray-900 mb-2">¿Borrar esta tarea?</h3>
              <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl">Cancelar</button>
                <button onClick={() => { api(`/api/tasks/${deleteId}`, { method: 'DELETE', headers: h }).then(() => { setDeleteId(null); fetchTasks(); toast.success('Tarea eliminada'); }); }} className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-2xl text-xs uppercase">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
