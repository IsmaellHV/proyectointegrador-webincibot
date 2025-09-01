import { create } from 'zustand';
import { Usuario } from '../types/database';
import { signIn, signOut, getCurrentUserProfile, supabase } from '../lib/supabase';

interface AuthStore {
  // Estado de autenticación
  user: Usuario | null;
  isAuthenticated: boolean;
  sessionVerified: boolean;
  isLoading: boolean;
  error: string | null;
  connectionError: boolean;

  // Acciones
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => void;
  updateUser: (userData: Partial<Usuario>) => void;
  clearError: () => void;
  retryAuth: () => Promise<void>;
}

// Función para verificar la sesión actual de Supabase
const checkSupabaseSession = async (): Promise<Usuario | null> => {
  try {
    const profile = await getCurrentUserProfile();
    if (profile) {
      console.log('🔍 [AUTH] Usuario encontrado en Supabase:', profile.email);
      return profile;
    }
    return null;
  } catch (error) {
    console.error('🔍 [AUTH] Error verificando sesión:', error);
    return null;
  }
};

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
const authenticateWithSupabase = async (email: string, password: string): Promise<{ user: Usuario | null; error?: string }> => {
  try {
    const { user: authUser, error } = await signIn(email, password);
    
    if (error) {
      return { user: null, error: error.message };
    }
    
    if (!authUser) {
      return { user: null, error: 'No se pudo autenticar el usuario' };
    }
    
    // Obtener el perfil completo del usuario
    const profile = await getCurrentUserProfile();
    
    if (!profile) {
      return { user: null, error: 'No se pudo obtener el perfil del usuario' };
    }
    
    return { user: profile };
  } catch (error) {
    console.error('🔍 [AUTH] Error en autenticación:', error);
    return { user: null, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

// Función simplificada para aplicar estado de autenticación
const applyAuthState = (user: Usuario | null, set: any) => {
  if (user) {
    saveUserToStorage(user);
    set({
      user,
      isLoading: false,
      isAuthenticated: true,
      sessionVerified: true,
      connectionError: false,
      error: null,
    });
  } else {
    clearUserFromStorage();
    set({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      sessionVerified: false,
      connectionError: false,
      error: null,
    });
  }
};

export const useAuthStore = create<AuthStore>((set, get) => {
  // Verificar sesión de Supabase al inicializar
  const initializeAuth = async () => {
    console.log('🔄 [AUTH] Inicializando autenticación...');
    
    // COMENTADO: No limpiar localStorage automáticamente para mantener sesiones
    // console.log('🧹 [AUTH] Limpiando TODO el localStorage...');
    // localStorage.clear();
    
    // Limpiar localStorage si contiene datos de prueba
    const storedUser = getUserFromStorage();
    console.log('🔍 [AUTH] Usuario en localStorage después de limpiar:', storedUser);
    
    if (storedUser && (storedUser.id === '1' || storedUser.id === '1' || typeof storedUser.id === 'number')) {
      console.log('🧹 [AUTH] FORZANDO limpieza de datos de prueba del localStorage');
      clearUserFromStorage();
      localStorage.clear();
    }
    
    // Verificar si hay una sesión activa en Supabase
    const currentUser = await checkSupabaseSession();
    console.log('🔍 [AUTH] Usuario de Supabase:', currentUser ? currentUser.email : 'No encontrado');
    applyAuthState(currentUser, set);
  };
  
  // Inicializar autenticación
  initializeAuth();
  
  return {
    // Estado inicial - empezamos con loading true hasta verificar Supabase
    user: null,
    isLoading: true,
    isAuthenticated: false,
    sessionVerified: false,
    connectionError: false,
    error: null,

    // Acciones
    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const { user, error } = await authenticateWithSupabase(email, password);
        
        if (user) {
          applyAuthState(user, set);
          console.log('✅ [AUTH] Login exitoso:', user.email);
          return { success: true };
        } else {
          set({ isLoading: false, error: error || 'Credenciales incorrectas' });
          return { success: false, error: error || 'Credenciales incorrectas' };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        set({ isLoading: false, error: errorMessage });
        console.error('❌ [AUTH] Error en login:', errorMessage);
        return { success: false, error: errorMessage };
      }
    },

    logout: async () => {
      try {
        await signOut();
        applyAuthState(null, set);
        console.log('✅ [AUTH] Logout exitoso');
      } catch (error) {
        console.error('❌ [AUTH] Error en logout:', error);
        // Aún así limpiar el estado local
        applyAuthState(null, set);
      }
    },

    checkAuth: async () => {
      try {
        const currentUser = await checkSupabaseSession();
        applyAuthState(currentUser, set);
      } catch (error) {
        console.error('❌ [AUTH] Error verificando autenticación:', error);
        applyAuthState(null, set);
      }
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

    retryAuth: async () => {
      try {
        const currentUser = await checkSupabaseSession();
        applyAuthState(currentUser, set);
      } catch (error) {
        console.error('❌ [AUTH] Error en retry auth:', error);
        applyAuthState(null, set);
      }
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
  const { user, isLoading, error, sessionVerified } = useAuthStore();
  return {
    user,
    isLoading,
    error,
    sessionVerified,
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
    sessionVerified: false,
    connectionError: false,
    error: null,
  });
  
  console.log('🧪 [TESTING] Store reset completed');
};
