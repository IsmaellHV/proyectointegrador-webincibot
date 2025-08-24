import { create } from 'zustand';
import { Usuario } from '../types/database';
import { supabase, getUserProfile, getCurrentUserProfile, signIn, signOut } from '../lib/supabase';

interface AuthStore {
  // Estado de autenticación
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  connectionError: boolean;
  sessionVerified: boolean;

  // Acciones
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  retryAuth: () => Promise<void>;
  updateUser: (userData: Partial<Usuario>) => void;
  clearError: () => void;
}

// Variables para cache y control
let cachedSession: any = null;
let cachedProfile: Usuario | null = null;
let lastProfileFetch = 0;
const PROFILE_CACHE_DURATION = 30_000; // 30s

// Control de inicialización
let isInitialized = false;
let authListenerUnsubscribe: (() => void) | null = null;

// Claves para localStorage
const STORAGE_KEYS = {
  USER_DATA: 'incibot_user_data',
  SESSION_TIMESTAMP: 'incibot_session_timestamp',
  PROFILE_CACHE: 'incibot_profile_cache',
};

// ---------- Persistencia local ----------
const saveUserToStorage = (userData: Usuario) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    localStorage.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString());
    console.log('💾 [STORAGE] User data saved to localStorage');
  } catch (error) {
    console.error('💾 [STORAGE] Error saving user data:', error);
  }
};

const getUserFromStorage = (): Usuario | null => {
  try {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    const timestamp = localStorage.getItem(STORAGE_KEYS.SESSION_TIMESTAMP);
    if (!userData || !timestamp) return null;

    const sessionAge = Date.now() - parseInt(timestamp);
    const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24h
    if (sessionAge > MAX_SESSION_AGE) {
      clearUserFromStorage();
      return null;
    }
    return JSON.parse(userData) as Usuario;
  } catch (error) {
    console.error('💾 [STORAGE] Error loading user data:', error);
    clearUserFromStorage();
    return null;
  }
};

const clearUserFromStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.SESSION_TIMESTAMP);
    localStorage.removeItem(STORAGE_KEYS.PROFILE_CACHE);
    console.log('💾 [STORAGE] User data cleared from localStorage');
  } catch (error) {
    console.error('💾 [STORAGE] Error clearing user data:', error);
  }
};

// ---------- Utilidades ----------
const buildUserData = (sessionUser: any, profile?: Usuario): Usuario => {
  return {
    id: sessionUser.id,
    email: sessionUser.email || '',
    nombre: profile?.nombre || '',
    rol: profile?.rol || 'personal',
    password_hash: '',
    activo: profile?.activo ?? true,
    created_at: profile?.created_at || new Date().toISOString(),
    updated_at: profile?.updated_at || new Date().toISOString(),
  };
};

/**
 * Aplica una sesión (o su ausencia) al store.
 * Cierra spinners y marca sessionVerified = true.
 */
const applySession = async (session: any, set: any) => {
  if (session?.user) {
    // Cache de perfil con TTL
    let profile = cachedProfile;
    const needFetch = !profile || Date.now() - lastProfileFetch > PROFILE_CACHE_DURATION;
    if (needFetch) {
      try {
        profile = await getCurrentUserProfile();
        if (profile) {
          cachedProfile = profile;
          lastProfileFetch = Date.now();
        }
      } catch (e) {
        console.warn('🔐 [AUTH_STORE] Error fetching profile (ignored):', e);
      }
    }

    const userData = buildUserData(session.user, profile || undefined);
    saveUserToStorage(userData);
    cachedSession = session;

    set({
      user: userData,
      isLoading: false,
      isAuthenticated: true,
      error: null,
      connectionError: false,
      sessionVerified: true,
    });
  } else {
    // sin sesión
    cachedSession = null;
    cachedProfile = null;
    lastProfileFetch = 0;
    clearUserFromStorage();
    set({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      connectionError: false,
      sessionVerified: true,
    });
  }
};

// ---------- Listener de Auth ----------
const setupAuthListener = (set: any) => {
  if (authListenerUnsubscribe) {
    console.log('🔐 [AUTH_STORE] Auth listener already configured');
    return;
  }
  console.log('🔐 [AUTH_STORE] Setting up auth listener');

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔐 [AUTH_STORE] Auth event:', event, session?.user?.email);

    switch (event) {
      case 'INITIAL_SESSION':
      case 'SIGNED_IN':
      case 'TOKEN_REFRESHED':
      case 'USER_UPDATED':
        await applySession(session, set);
        break;

      case 'SIGNED_OUT':
        cachedSession = null;
        cachedProfile = null;
        lastProfileFetch = 0;
        clearUserFromStorage();
        set({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
          connectionError: false,
          sessionVerified: true,
        });
        break;

      default:
        // Otros eventos: ignored
        break;
    }
  });

  authListenerUnsubscribe = () => subscription.unsubscribe();
};

// ---------- Inicialización ----------
const initializeAuth = async (set: any) => {
  if (isInitialized) {
    console.log('🔐 [AUTH_STORE] Already initialized, skipping');
    return;
  }
  isInitialized = true;
  console.log('🔐 [AUTH_STORE] Initializing authentication...');

  // 1) Listener primero para no perder INITIAL_SESSION
  setupAuthListener(set);

  // 2) Hidratar desde localStorage (Instant UI)
  const storedUser = getUserFromStorage();
  if (storedUser) {
    set({
      user: storedUser,
      isLoading: false,
      isAuthenticated: true,
      error: null,
      connectionError: false,
      sessionVerified: true,
    });
  } else {
    // Mostrar "verificando..." hasta que INITIAL_SESSION o getSession respondan
    set({ isLoading: true, sessionVerified: false });
  }

  // 3) Fallback: confirmar sesión actual por si el INITIAL_SESSION no llega
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    await applySession(session, set);
  } catch (error) {
    console.warn('🔐 [AUTH_STORE] getSession fallback error:', error);
    set({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: 'Error de conexión',
      connectionError: true,
      sessionVerified: true,
    });
  }
};

// ---------- Store ----------
export const useAuthStore = create<AuthStore>((set, get) => {
  // Ejecutar inicialización (dentro configura el listener)
  initializeAuth(set);

  return {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
    connectionError: false,
    sessionVerified: false,

    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null, sessionVerified: false });
      try {
        const { user: authUser, error } = await signIn(email, password);
        if (error) {
          set({ isLoading: false, error: error.message, sessionVerified: true });
          return { success: false, error: error.message };
        }
        if (authUser) {
          const userProfile = await getUserProfile(authUser.id);
          if (userProfile) {
            saveUserToStorage(userProfile);
            set({
              user: userProfile,
              isLoading: false,
              isAuthenticated: true,
              error: null,
              sessionVerified: true,
            });
            return { success: true };
          } else {
            set({ isLoading: false, error: 'No se pudo obtener el perfil del usuario', sessionVerified: true });
            return { success: false, error: 'No se pudo obtener el perfil del usuario' };
          }
        }
        set({ isLoading: false, error: 'Error desconocido en el login', sessionVerified: true });
        return { success: false, error: 'Error desconocido en el login' };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        set({ isLoading: false, error: errorMessage, sessionVerified: true });
        return { success: false, error: errorMessage };
      }
    },

    logout: async () => {
      set({ isLoading: true });
      try {
        await signOut();
      } catch (error) {
        console.error('Error en logout:', error);
      } finally {
        cachedSession = null;
        cachedProfile = null;
        lastProfileFetch = 0;
        clearUserFromStorage();
        set({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
          sessionVerified: true,
        });
      }
    },

    checkAuth: async () => {
      const current = get();
      if (current.isLoading) return;

      set({ isLoading: true, error: null, sessionVerified: false });
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await applySession(session, set);
      } catch (error) {
        console.error('Error en checkAuth:', error);
        set({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
          sessionVerified: true,
        });
      }
    },

    updateUser: (userData: Partial<Usuario>) => {
      const currentUser = get().user;
      if (currentUser) {
        const updated = { ...currentUser, ...userData };
        saveUserToStorage(updated as Usuario);
        set({ user: updated as Usuario });
      }
    },

    retryAuth: async () => {
      console.log('🔐 [AUTH_STORE] Retrying authentication...');
      set({ isLoading: true, error: null, connectionError: false, sessionVerified: false });

      // Limpiar caches para forzar nueva verificación
      cachedSession = null;
      cachedProfile = null;
      lastProfileFetch = 0;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await applySession(session, set);
        console.log('🔐 [AUTH_STORE] Retry finished');
      } catch (error) {
        console.error('🔐 [AUTH_STORE] Error in retry:', error);
        set({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: 'Error en reintento de conexión',
          connectionError: true,
          sessionVerified: true,
        });
      }
    },

    clearError: () => {
      set({ error: null, connectionError: false });
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
