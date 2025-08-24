import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { Usuario, AuthState } from '../types/database'
import { supabase, getCurrentUser, getUserProfile, getCurrentUserProfile, signIn, signOut } from '../lib/supabase'

interface AuthStore {
  // Estado de autenticación
  user: Usuario | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  connectionError: boolean
  sessionVerified: boolean
  
  // Acciones
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  retryAuth: () => Promise<void>
  updateUser: (userData: Partial<Usuario>) => void
  clearError: () => void
}

// Variables para cache (sin variables globales problemáticas)
let cachedSession: any = null
let cachedProfile: Usuario | null = null
let lastProfileFetch = 0
const PROFILE_CACHE_DURATION = 30000 // 30 segundos

// Claves para localStorage
const STORAGE_KEYS = {
  USER_DATA: 'incibot_user_data',
  SESSION_TIMESTAMP: 'incibot_session_timestamp',
  PROFILE_CACHE: 'incibot_profile_cache'
}

// Funciones de persistencia local
const saveUserToStorage = (userData: Usuario) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
    localStorage.setItem(STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString())
    console.log('💾 [STORAGE] User data saved to localStorage')
  } catch (error) {
    console.error('💾 [STORAGE] Error saving user data:', error)
  }
}

const getUserFromStorage = (): Usuario | null => {
  try {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    const timestamp = localStorage.getItem(STORAGE_KEYS.SESSION_TIMESTAMP)
    
    if (!userData || !timestamp) {
      console.log('💾 [STORAGE] No user data in localStorage')
      return null
    }
    
    // Verificar que los datos no sean muy antiguos (máximo 24 horas)
    const sessionAge = Date.now() - parseInt(timestamp)
    const MAX_SESSION_AGE = 24 * 60 * 60 * 1000 // 24 horas
    
    if (sessionAge > MAX_SESSION_AGE) {
      console.log('💾 [STORAGE] Session data too old, clearing')
      clearUserFromStorage()
      return null
    }
    
    const user = JSON.parse(userData)
    console.log('💾 [STORAGE] User data loaded from localStorage:', user.email)
    return user
  } catch (error) {
    console.error('💾 [STORAGE] Error loading user data:', error)
    clearUserFromStorage()
    return null
  }
}

const clearUserFromStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)
    localStorage.removeItem(STORAGE_KEYS.SESSION_TIMESTAMP)
    localStorage.removeItem(STORAGE_KEYS.PROFILE_CACHE)
    console.log('💾 [STORAGE] User data cleared from localStorage')
  } catch (error) {
    console.error('💾 [STORAGE] Error clearing user data:', error)
  }
}

export const useAuthStore = create<AuthStore>((set, get) => {
  // Configurar listener de autenticación una sola vez
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔐 [AUTH_STORE] Auth state changed:', event, session?.user?.email)
    
    if (event === 'SIGNED_IN' && session?.user) {
      console.log('🔐 [AUTH_STORE] Processing SIGNED_IN event for user:', session.user.id)
      try {
        const profile = await getCurrentUserProfile()
        
        if (profile) {
          const userData = {
            id: session.user.id,
            email: session.user.email || '',
            nombre: profile.nombre || '',
            rol: profile.rol || 'personal',
            password_hash: '',
            activo: profile.activo || true,
            created_at: profile.created_at || new Date().toISOString(),
            updated_at: profile.updated_at || new Date().toISOString()
          }
          
          // Actualizar cache y localStorage
          cachedProfile = profile
          lastProfileFetch = Date.now()
          saveUserToStorage(userData)
          
          set({ 
            user: userData, 
            isLoading: false,
            isAuthenticated: true,
            error: null,
            connectionError: false,
            sessionVerified: true
          })
          console.log('🔐 [AUTH_STORE] User authenticated successfully')
        }
      } catch (error) {
        console.error('🔐 [AUTH_STORE] Error getting profile:', error)
      }
    } else if (event === 'SIGNED_OUT') {
      console.log('🔐 [AUTH_STORE] Processing SIGNED_OUT event')
      // Limpiar cache y localStorage
      cachedSession = null
      cachedProfile = null
      lastProfileFetch = 0
      clearUserFromStorage()
      set({ user: null, isLoading: false, isAuthenticated: false, error: null, connectionError: false, sessionVerified: true })
    }
  })
  
  // VERIFICACIÓN INICIAL SIMPLIFICADA - PRIORIDAD ABSOLUTA A LOCALSTORAGE
  const initializeAuth = () => {
    console.log('🔐 [AUTH_STORE] Initializing authentication...')
    
    // 1. PRIMERO: Verificar localStorage INMEDIATAMENTE para refresh instantáneo
    const storedUser = getUserFromStorage()
    if (storedUser) {
      console.log('🔐 [AUTH_STORE] ✅ INSTANT REFRESH: Found user in localStorage:', storedUser.email)
      set({ 
        user: storedUser, 
        isLoading: false,
        isAuthenticated: true,
        error: null,
        connectionError: false,
        sessionVerified: true
      })
      
      // Verificar sesión en background (sin bloquear UI)
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error || !session?.user) {
          console.log('🔐 [AUTH_STORE] Background validation failed, clearing localStorage')
          clearUserFromStorage()
          set({ user: null, isLoading: false, isAuthenticated: false, error: null, connectionError: false, sessionVerified: true })
        } else {
          console.log('🔐 [AUTH_STORE] Background validation successful')
        }
      }).catch(() => {
        // Ignorar errores de background validation
        console.log('🔐 [AUTH_STORE] Background validation error (ignored)')
      })
      
      return // SALIR INMEDIATAMENTE con datos de localStorage
    }
    
    // 2. SEGUNDO: Si no hay localStorage, verificar sesión con timeout corto
    console.log('🔐 [AUTH_STORE] No localStorage, checking session...')
    
    const timeout = setTimeout(() => {
      console.log('🔐 [AUTH_STORE] Session check timeout, setting unauthenticated')
      set({ user: null, isLoading: false, isAuthenticated: false, error: null, connectionError: false, sessionVerified: true })
    }, 3000) // Timeout más corto
    
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      clearTimeout(timeout)
      
      if (error || !session?.user) {
        console.log('🔐 [AUTH_STORE] No valid session found')
        set({ user: null, isLoading: false, isAuthenticated: false, error: null, connectionError: false, sessionVerified: true })
        return
      }
      
      try {
        const profile = await getCurrentUserProfile()
        if (profile) {
          const userData = {
            id: session.user.id,
            email: session.user.email || '',
            nombre: profile.nombre || '',
            rol: profile.rol || 'personal',
            password_hash: '',
            activo: profile.activo || true,
            created_at: profile.created_at || new Date().toISOString(),
            updated_at: profile.updated_at || new Date().toISOString()
          }
          
          saveUserToStorage(userData)
          set({ 
            user: userData, 
            isLoading: false,
            isAuthenticated: true,
            error: null,
            connectionError: false,
            sessionVerified: true
          })
        } else {
          set({ user: null, isLoading: false, isAuthenticated: false, error: null, connectionError: false, sessionVerified: true })
        }
      } catch (error) {
        console.error('🔐 [AUTH_STORE] Error getting profile:', error)
        set({ user: null, isLoading: false, isAuthenticated: false, error: 'Error de conexión', connectionError: true, sessionVerified: false })
      }
    }).catch(() => {
      clearTimeout(timeout)
      set({ user: null, isLoading: false, isAuthenticated: false, error: 'Error de conexión', connectionError: true, sessionVerified: false })
    })
  }
  
  // Ejecutar inicialización
  initializeAuth()
  
  return {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  connectionError: false,
  sessionVerified: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const { user: authUser, error } = await signIn(email, password)
      
      if (error) {
        set({ isLoading: false, error: error.message })
        return { success: false, error: error.message }
      }
      
      if (authUser) {
        // Obtener el perfil del usuario con rol
        const userProfile = await getUserProfile(authUser.id)
        
        if (userProfile) {
          // Guardar en localStorage para persistencia
          saveUserToStorage(userProfile)
          set({ user: userProfile, isLoading: false, isAuthenticated: true, error: null })
          return { success: true }
        } else {
          set({ isLoading: false, error: 'No se pudo obtener el perfil del usuario' })
          return { success: false, error: 'No se pudo obtener el perfil del usuario' }
        }
      }
      
      set({ isLoading: false, error: 'Error desconocido en el login' })
      return { success: false, error: 'Error desconocido en el login' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ isLoading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  },

  logout: async () => {
    set({ isLoading: true })
    
    try {
      await signOut()
      // Limpiar cache y localStorage al hacer logout
      cachedSession = null
      cachedProfile = null
      lastProfileFetch = 0
      clearUserFromStorage()
      set({ user: null, isLoading: false, isAuthenticated: false, error: null, sessionVerified: true })
    } catch (error) {
      console.error('Error en logout:', error)
      // Limpiar estado y localStorage aunque haya error
      cachedSession = null
      cachedProfile = null
      lastProfileFetch = 0
      clearUserFromStorage()
      set({ user: null, isLoading: false, isAuthenticated: false, error: null, sessionVerified: true })
    }
  },

  checkAuth: async () => {
    // Función simplificada que ya no se usa automáticamente
    // Solo para uso manual si es necesario
    const currentState = get()
    
    if (currentState.isLoading) {
      return
    }
    
    set({ isLoading: true, error: null })
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session?.user) {
        set({ user: null, isLoading: false, isAuthenticated: false, error: null })
        return
      }

      const profile = await getCurrentUserProfile()
      
      if (profile) {
        set({ 
          user: {
            id: session.user.id,
            email: session.user.email || '',
            nombre: profile.nombre || '',
            rol: profile.rol || 'personal',
            password_hash: '',
            activo: profile.activo || true,
            created_at: profile.created_at || new Date().toISOString(),
            updated_at: profile.updated_at || new Date().toISOString()
          }, 
          isLoading: false,
          isAuthenticated: true,
          error: null
        })
      } else {
        set({ user: null, isLoading: false, isAuthenticated: false, error: null })
      }
    } catch (error) {
      console.error('Error en checkAuth:', error)
      set({ user: null, isLoading: false, isAuthenticated: false, error: null })
    }
  },

  updateUser: (userData: Partial<Usuario>) => {
    const currentUser = get().user
    if (currentUser) {
      set({ user: { ...currentUser, ...userData } })
    }
  },

  retryAuth: async () => {
    console.log('🔐 [AUTH_STORE] Retrying authentication...')
    set({ isLoading: true, error: null, connectionError: false, sessionVerified: false })
    
    // Limpiar cache para forzar nueva verificación
    cachedSession = null
    cachedProfile = null
    lastProfileFetch = 0
    
    // Timeout reducido para retry
    const safetyTimeout = setTimeout(() => {
      console.warn('🔐 [AUTH_STORE] Retry safety timeout reached')
      const currentState = get()
      if (currentState.isLoading) {
        set({ user: null, isLoading: false, isAuthenticated: false, error: 'Timeout en reintento de autenticación', connectionError: true, sessionVerified: false })
      }
    }, 2000) // 2 segundos para retry
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('🔐 [AUTH_STORE] Error in retry:', error)
        clearTimeout(safetyTimeout)
        set({ user: null, isLoading: false, isAuthenticated: false, error: 'Error de conexión en reintento', connectionError: true, sessionVerified: false })
        return
      }

      if (!session?.user) {
        console.log('🔐 [AUTH_STORE] No session in retry, setting unauthenticated')
        clearTimeout(safetyTimeout)
        set({ user: null, isLoading: false, isAuthenticated: false, error: null, connectionError: false, sessionVerified: true })
        return
      }

      const profile = await getCurrentUserProfile()
      
      if (profile) {
        const userData = {
          id: session.user.id,
          email: session.user.email || '',
          nombre: profile.nombre || '',
          rol: profile.rol || 'personal',
          password_hash: '',
          activo: profile.activo || true,
          created_at: profile.created_at || new Date().toISOString(),
          updated_at: profile.updated_at || new Date().toISOString()
        }
        // Actualizar cache y localStorage después del retry exitoso
        cachedSession = session
        cachedProfile = profile
        lastProfileFetch = Date.now()
        saveUserToStorage(userData)
        
        clearTimeout(safetyTimeout)
        set({ 
          user: userData, 
          isLoading: false,
          isAuthenticated: true,
          error: null,
          connectionError: false,
          sessionVerified: true
        })
        console.log('🔐 [AUTH_STORE] Retry successful')
      } else {
        clearTimeout(safetyTimeout)
        set({ user: null, isLoading: false, isAuthenticated: false, error: null, connectionError: false, sessionVerified: true })
      }
    } catch (error) {
      console.error('🔐 [AUTH_STORE] Error in retry:', error)
      clearTimeout(safetyTimeout)
      set({ user: null, isLoading: false, isAuthenticated: false, error: 'Error en reintento de conexión', connectionError: true, sessionVerified: false })
    }
  },

  clearError: () => {
    set({ error: null, connectionError: false })
  }
}})

// Hook personalizado para verificar roles
export const useRole = () => {
  const user = useAuthStore(state => state.user)
  
  return {
    isPersonal: user?.rol === 'personal',
    isSoporte: user?.rol === 'soporte',
    isAdmin: user?.rol === 'administrador',
    hasRole: (role: string) => user?.rol === role,
    canAccess: (allowedRoles: string[]) => user ? allowedRoles.includes(user.rol) : false
  }
}

// Hook para verificar si el usuario está autenticado
export const useAuth = () => {
  const { user, isLoading, error } = useAuthStore()
  
  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user
  }
}