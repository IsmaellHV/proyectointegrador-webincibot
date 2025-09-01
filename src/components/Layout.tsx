import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import logoIncibot from '../assets/logo_incibot.png';
import { Home, MessageSquare, Inbox, Headphones, Users, Settings, LogOut, Menu, X, Bell, User } from 'lucide-react';
import { useAuthStore, useRole } from '../store/authStore';
import { toast } from 'sonner';
import ConfirmationModal from './ConfirmationModal';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: string[];
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    allowedRoles: ['personal', 'soporte', 'administrador'],
  },
  {
    name: 'Chatbot',
    href: '/chatbot',
    icon: MessageSquare,
    allowedRoles: ['personal', 'soporte', 'administrador'],
  },
  {
    name: 'Mis Incidencias',
    href: '/incidencias',
    icon: Inbox,
    allowedRoles: ['personal', 'soporte', 'administrador'],
  },
  {
    name: 'Atención',
    href: '/soporte',
    icon: Headphones,
    allowedRoles: ['soporte', 'administrador'],
  },
  {
    name: 'Usuarios',
    href: '/usuarios',
    icon: Users,
    allowedRoles: ['administrador'],
  },
  {
    name: 'Administración',
    href: '/admin',
    icon: Settings,
    allowedRoles: ['administrador'],
  },
];

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, logout } = useAuthStore();
  const { canAccess } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  
  console.log('🏗️ [LAYOUT] Renderizando Layout - Ruta actual:', location.pathname);
  console.log('🏗️ [LAYOUT] Usuario:', user?.email);
  console.log('🎯 [LAYOUT] Renderizando Layout con Outlet')

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada correctamente');
      navigate('/login');
    } catch (error) {
      console.error('Error en logout:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  const filteredNavigation = navigation.filter((item) => canAccess(item.allowedRoles));

  const getRoleBadgeColor = (rol: string) => {
    switch (rol) {
      case 'administrador':
        return 'bg-red-100 text-red-800';
      case 'soporte':
        return 'bg-blue-100 text-blue-800';
      case 'personal':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleName = (rol: string) => {
    switch (rol) {
      case 'administrador':
        return 'Admin';
      case 'soporte':
        return 'Soporte';
      case 'personal':
        return 'Personal';
      default:
        return rol;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar móvil */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button type="button" className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <img src={logoIncibot} alt="INCIBOT" className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold text-gray-900">INCIBOT</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(item.href);
                      setSidebarOpen(false);
                    }}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full text-left ${isCurrentPath(item.href) ? 'bg-blue-100 text-blue-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    <Icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">{user?.nombre}</p>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(user?.rol || '')}`}>{getRoleName(user?.rol || '')}</span>
                  <button onClick={handleLogoutClick} className="text-gray-400 hover:text-gray-600 focus:outline-none" title="Cerrar sesión">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <img src={logoIncibot} alt="INCIBOT" className="h-8 w-8" />
                <span className="ml-2 text-xl font-bold text-gray-900">INCIBOT</span>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {filteredNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.name} onClick={() => navigate(item.href)} className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${isCurrentPath(item.href) ? 'bg-blue-100 text-blue-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700 truncate">{user?.nombre}</p>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(user?.rol || '')}`}>{getRoleName(user?.rol || '')}</span>
                    <button onClick={handleLogoutClick} className="text-gray-400 hover:text-gray-600 focus:outline-none" title="Cerrar sesión">
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header móvil */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button type="button" className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Header desktop */}
        <div className="hidden md:block bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-semibold text-gray-900">INCIBOT</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md">
                  <Bell className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">{user?.nombre}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(user?.rol || '')}`}>{getRoleName(user?.rol || '')}</span>
                  <button onClick={handleLogoutClick} className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md" title="Cerrar sesión">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido de la página */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {console.log('🎯 [LAYOUT] Renderizando Outlet para ruta:', location.pathname)}
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Modal de confirmación de logout */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Cerrar Sesión"
        message="¿Desea salir?"
        confirmText="Sí"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default Layout;
