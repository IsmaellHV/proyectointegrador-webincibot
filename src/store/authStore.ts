import { create } from 'zustand';
import { Usuario } from '../types/database';

interface AuthStore {
  // Estado de autenticación
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => void;
  updateUser: (userData: Partial<Usuario>) => void;
  clearError: () => void;
}

// Usuarios de prueba para la demo
const DEMO_USERS: Usuario[] = [
  {
    id: '1',
    email: 'admin.sistema@gmail.com',
    nombre: 'Administrador Sistema',
    rol: 'administrador',
    password_hash: 'password123',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'soporte.tecnico@gmail.com',
    nombre: 'Soporte Técnico',
    rol: 'soporte',
    password_hash: 'password123',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'usuario.personal@gmail.com',
    nombre: 'Usuario Personal',
    rol: 'personal',
    password_hash: 'password123',
    activo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Clave para localStorage
const STORAGE_KEY = 'incibot_user_data';

// ---------- Persistencia local ----------
const saveUserToStorage = (userData: Usuario) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    console.log('💾 [STORAGE] User data saved to localStorage');
  } catch (error) {
    console.error('💾 [STORAGE] Error saving user data:', error);
  }
};

const getUserFromStorage = (): Usuario | null => {
  try {
    const userData = localStorage.getItem(STORAGE_KEY);
    if (!userData) return null;
    return JSON.parse(userData) as Usuario;
  } catch (error) {
    console.error('💾 [STORAGE] Error loading user data:', error);
    clearUserFromStorage();
    return null;
  }
};

const clearUserFromStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('💾 [STORAGE] User data cleared from localStorage');
  } catch (error) {
    console.error('💾 [STORAGE] Error clearing user data:', error);
  }
};

// ---------- Utilidades ----------
const validateCredentials = (email: string, password: string): Usuario | null => {
  const user = DEMO_USERS.find(u => u.email === email && u.password_hash === password);
  return user || null;
};

// Función simplificada para aplicar estado de autenticación
const applyAuthState = (user: Usuario | null, set: any) => {
  if (user) {
    saveUserToStorage(user);
    set({
      user,
      isLoading: false,
      isAuthenticated: true,
      error: null,
    });
  } else {
    clearUserFromStorage();
    set({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }
};

export const useAuthStore = create<AuthStore>((set, get) => {
  // Hidratar inmediatamente desde localStorage
  const storedUser = getUserFromStorage();
  
  return {
    // Estado inicial
    user: storedUser,
    isLoading: false,
    isAuthenticated: !!storedUser,
    error: null,

    // Acciones
    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      
      // Simular delay de red para la demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const user = validateCredentials(email, password);
        
        if (user) {
          applyAuthState(user, set);
          return { success: true };
        } else {
          set({ isLoading: false, error: 'Credenciales incorrectas' });
          return { success: false, error: 'Credenciales incorrectas' };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        set({ isLoading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    },

    logout: () => {
      applyAuthState(null, set);
    },

    checkAuth: () => {
      const storedUser = getUserFromStorage();
      applyAuthState(storedUser, set);
    },

    updateUser: (userData: Partial<Usuario>) => {
      const currentUser = get().user;
      if (currentUser) {
        const updated = { ...currentUser, ...userData };
        applyAuthState(updated as Usuario, set);
      }
    },

    clearError: () => {
      set({ error: null });
    },
  };
});

// ---------- Hooks auxiliares ----------
export const useRole = () => {
  const user = useAuthStore((state) => state.user);
  return {
    isPersonal: user?.rol === 'personal',
    isSoporte: user?.rol === 'soporte',
    isAdmin: user?.rol === 'administrador',
    hasRole: (role: string) => user?.rol === role,
    canAccess: (allowedRoles: string[]) => (user ? allowedRoles.includes(user.rol) : false),
  };
};

export const useAuth = () => {
  const { user, isLoading, error } = useAuthStore();
  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
};

// ---------- Testing utilities ----------
export const resetStoreForTesting = () => {
  // Limpiar localStorage
  clearUserFromStorage();
  
  // Resetear el store a su estado inicial
  useAuthStore.setState({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
  });
  
  console.log('🧪 [TESTING] Store reset completed');
};
