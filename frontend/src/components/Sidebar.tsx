import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, CreditCard, Settings, Target, CheckSquare, Handshake, LogOut, CalendarDays, BarChart3 } from 'lucide-react';
import { useAuth } from '../auth';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Pipeline', path: '/pipeline', icon: Target },
  { name: 'Clientes', path: '/clients', icon: Users },
  { name: 'Tareas', path: '/tasks', icon: CheckSquare },
  { name: 'Calendario', path: '/calendar', icon: CalendarDays },
  { name: 'Interacciones', path: '/interactions', icon: MessageSquare },
  { name: 'Pagos', path: '/payments', icon: CreditCard },
  { name: 'Resumen Anual', path: '/annual', icon: BarChart3 },
  { name: 'Afiliados', path: '/affiliates', icon: Handshake },
  { name: 'Ajustes', path: '/settings', icon: Settings },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ open = false, onClose }: SidebarProps) => {
  const location = useLocation();
  const { session, signOut } = useAuth();
  const username = (session?.user?.email || '').split('@')[0] || 'usuario';
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <>
    {/* Backdrop (solo móvil, cuando el drawer está abierto) */}
    <div
      className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    />
    <div className={`fixed inset-y-0 left-0 w-[260px] bg-white border-r border-gray-100 h-full flex flex-col flex-shrink-0 z-40 transform transition-transform duration-300 lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Logo */}
      <div className="px-6 pt-10 pb-6 flex flex-col items-center text-center">
        <img src="/logo.png" alt="LOGE" className="h-[76px] w-auto max-w-full object-contain mb-4" />
        <p className="text-gray-400 text-[10px] tracking-[0.2em] uppercase font-bold">
          Sistema de Gestión
        </p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 mt-2">
        <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-bold px-4 mb-3">
          Menú principal
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-brand/10 text-brand font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand rounded-r-full" />
              )}
              <Icon className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-brand' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span className="text-[13px]">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
      
      {/* User section */}
      <div className="p-3 mx-3 mb-4 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-light to-brand flex items-center justify-center text-white text-xs font-bold shadow-md uppercase">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 truncate capitalize">{username}</p>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">LOGE S.L.</p>
          </div>
          <button
            onClick={() => signOut()}
            title="Cerrar sesión"
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
