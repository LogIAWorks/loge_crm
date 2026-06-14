import { useEffect, useState } from 'react';
import { Bell, Bot, Zap } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { api, authHeaders } from '../api';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Resumen general del negocio' },
  '/pipeline': { title: 'Pipeline de Ventas', subtitle: 'Gestiona tus oportunidades comerciales' },
  '/clients': { title: 'Clientes Activos', subtitle: 'Empresas con servicios contratados' },
  '/tasks': { title: 'Tareas', subtitle: 'Pendientes del equipo y seguimiento' },
  '/interactions': { title: 'Interacciones', subtitle: 'Historial de contactos con empresas' },
  '/payments': { title: 'Control de Pagos', subtitle: 'Facturación e ingresos' },
  '/affiliates': { title: 'Afiliados', subtitle: 'Colaboradores y comisiones por venta' },
  '/settings': { title: 'Ajustes', subtitle: 'Configuración del sistema e integraciones' },
};

const Header = () => {
  const [settings, setSettings] = useState<any>({});
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: 'LOGE CRM', subtitle: '' };

  useEffect(() => {
    api('/api/settings', { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(console.error);
  }, []);

  const isClaudeActive = !!settings.claude_api_key;
  const isOpenClawActive = !!settings.openclaw_token;

  return (
    <header className="h-[72px] bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center justify-between px-8 sticky top-0 z-10 flex-shrink-0">
      {/* Page title */}
      <div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{page.title}</h1>
        <p className="text-[13px] text-gray-400 -mt-0.5">{page.subtitle}</p>
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
        <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700">
          <Bell className="w-[18px] h-[18px]" />
        </button>
      </div>
    </header>
  );
};

export default Header;
