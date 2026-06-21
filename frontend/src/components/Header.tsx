import { useEffect, useState } from 'react';
import { Bell, Bot, Zap, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, authHeaders } from '../api';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Resumen general del negocio' },
  '/pipeline': { title: 'Pipeline de Ventas', subtitle: 'Gestiona tus oportunidades comerciales' },
  '/clients': { title: 'Clientes Activos', subtitle: 'Empresas con servicios contratados' },
  '/tasks': { title: 'Tareas', subtitle: 'Pendientes del equipo y seguimiento' },
  '/calendar': { title: 'Calendario', subtitle: 'Follow-ups, tareas y revisiones' },
  '/interactions': { title: 'Interacciones', subtitle: 'Historial de contactos con empresas' },
  '/payments': { title: 'Control de Pagos', subtitle: 'Facturación e ingresos' },
  '/affiliates': { title: 'Afiliados', subtitle: 'Colaboradores y comisiones por venta' },
  '/settings': { title: 'Ajustes', subtitle: 'Configuración del sistema e integraciones' },
};

interface HeaderProps {
  onMenu?: () => void;
}

const Header = ({ onMenu }: HeaderProps) => {
  const [settings, setSettings] = useState<any>({});
  const location = useLocation();
  const navigate = useNavigate();
  const alertTo = (t: string) => t === 'lead' ? '/pipeline' : t === 'payment' ? '/payments' : t === 'task' ? '/tasks' : '/clients';
  const page = pageTitles[location.pathname] || { title: 'LOGE CRM', subtitle: '' };

  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    api('/api/settings', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(console.error);
    api('/api/alerts', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setAlerts(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // Cierra el desplegable al cambiar de página
  useEffect(() => { setShowAlerts(false); }, [location.pathname]);

  const isClaudeActive = !!settings.claude_api_key;
  const isOpenClawActive = !!settings.openclaw_token;

  const alertLabel = (t: string) =>
    t === 'lead' ? 'Follow-up' : t === 'payment' ? 'Cobro' : t === 'task' ? 'Bloqueada' : 'Riesgo';

  return (
    <header className="h-[72px] bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-10 flex-shrink-0">
      {/* Page title + botón hamburguesa (móvil) */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenu}
          className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 text-gray-600 flex-shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight truncate">{page.title}</h1>
          <p className="text-[13px] text-gray-400 -mt-0.5 truncate">{page.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Connection status pills */}
        <div className="flex items-center gap-1.5">
          <div 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isClaudeActive 
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' 
                : 'bg-gray-100 text-gray-400'
            }`}
            title={isClaudeActive ? 'Claude API conectada' : 'Claude API sin configurar'}
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Claude</span>
            <div className={`w-1.5 h-1.5 rounded-full ${isClaudeActive ? 'bg-emerald-500 animate-pulse-dot' : 'bg-gray-300'}`} />
          </div>

          <div 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isOpenClawActive 
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' 
                : 'bg-gray-100 text-gray-400'
            }`}
            title={isOpenClawActive ? 'OpenClaw conectado' : 'OpenClaw sin configurar'}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">OpenClaw</span>
            <div className={`w-1.5 h-1.5 rounded-full ${isOpenClawActive ? 'bg-emerald-500 animate-pulse-dot' : 'bg-gray-300'}`} />
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts(v => !v)}
            className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            aria-label="Notificaciones"
          >
            <Bell className="w-[18px] h-[18px]" />
            {alerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </button>

          {showAlerts && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowAlerts(false)} />
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-modal ring-1 ring-gray-100 z-40 overflow-hidden animate-slide-up">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <span className="text-sm font-black text-gray-900">Notificaciones</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{alerts.length}</span>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-gray-50">
                  {alerts.length > 0 ? alerts.map((a, i) => (
                    <button key={i} onClick={() => { setShowAlerts(false); navigate(alertTo(a.type)); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${a.type === 'lead' ? 'text-blue-500' : a.type === 'payment' ? 'text-amber-500' : a.type === 'task' ? 'text-red-500' : 'text-violet-500'}`}>{alertLabel(a.type)}</span>
                        <p className="text-sm font-bold text-gray-900 truncate">{a.empresa}</p>
                        <p className="text-xs text-gray-500 truncate">{a.titulo}</p>
                      </div>
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg whitespace-nowrap flex-shrink-0">{a.fecha}</span>
                    </button>
                  )) : (
                    <div className="py-10 text-center">
                      <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-300">Sin notificaciones</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
