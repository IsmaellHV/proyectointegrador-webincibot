import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { Usuario, AuthState } from '../types/database'
import { supabase, getCurrentUser, getUserProfile, getCurrentUserProfile, signIn, signOut } from '../lib/supabase'

interface AuthStore extends AuthState {
  // Acciones
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateUser: (userData: Partial<Usuario>) => void
  clearError: () => void
}

// Variables para controlar la inicialización
let authListenerConfigured = false
let initialCheckDone = false

export const useAuthStore = create<AuthStore>((set, get) => {
  // Configurar listener de autenticación inmediatamente
  if (!authListenerConfigured) {
    authListenerConfigured = true
    
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 [AUTH_STORE] Auth state changed:', event, session?.user?.email)
      console.log('🔐 [AUTH_STORE] Session details:', { hasSession: !!session, hasUser: !!session?.user })
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔐 [AUTH_STORE] Processing SIGNED_IN event for user:', session.user.id)
        try {
          console.log('🔐 [AUTH_STORE] Fetching user profile...')
          const profile = await getCurrentUserProfile()
          console.log('🔐 [AUTH_STORE] Profile fetched:', { hasProfile: !!profile, profileData: profile })
          
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
            console.log('🔐 [AUTH_STORE] Setting user data:', userData)
            set({ 
              user: userData, 
              isLoading: false,
              isAuthenticated: true,
              error: null
            })
            console.log('🔐 [AUTH_STORE] User state updated successfully')
          } else {
            console.log('🔐 [AUTH_STORE] No profile found, clearing user state')
            set({ user: null, isLoading: false, isAuthenticated: false, error: null })
          }
        } catch (error) {
          console.error('🔐 [AUTH_STORE] Error obteniendo perfil en auth state change:', error)
          set({ user: null, isLoading: false, isAuthenticated: false, error: null })
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🔐 [AUTH_STORE] Processing SIGNED_OUT event')
        set({ user: null, isLoading: false, isAuthenticated: false, error: null })
      } else {
        console.log('🔐 [AUTH_STORE] Unhandled auth event:', event)
      }
    })
    
    // Realizar verificación inicial inmediatamente
    if (!initialCheckDone) {
      initialCheckDone = true
      
      // Timeout de seguridad para evitar carga infinita
      const safetyTimeout = setTimeout(() => {
        console.warn('🔐 [AUTH_STORE] Safety timeout reached, forcing loading to false')
        const currentState = get()
        if (currentState.isLoading) {
          set({ user: null, isLoading: false, isAuthenticated: false, error: 'Timeout en verificación de autenticación' })
        }
      }, 10000) // 10 segundos timeout
      
      // Verificación inicial sin setTimeout
      console.log('🔐 [AUTH_STORE] Starting initial session check...')
      supabase.auth.getSession().then(async ({ data: { session }, error }) => {
        try {
          console.log('🔐 [AUTH_STORE] Initial session check result:', { hasSession: !!session, hasUser: !!session?.user, error })
          
          if (error) {
            console.error('🔐 [AUTH_STORE] Error obteniendo sesión inicial:', error)
            clearTimeout(safetyTimeout)
            set({ user: null, isLoading: false, isAuthenticated: false, error: null })
            return
          }

          if (!session?.user) {
            console.log('🔐 [AUTH_STORE] No session or user found, setting unauthenticated state')
            clearTimeout(safetyTimeout)
            set({ user: null, isLoading: false, isAuthenticated: false, error: null })
            return
          }

          console.log('🔐 [AUTH_STORE] Session found, fetching user profile for:', session.user.id)
          // Obtener el perfil del usuario
          const profile = await getCurrentUserProfile()
          console.log('🔐 [AUTH_STORE] Initial profile fetch result:', { hasProfile: !!profile, profileData: profile })
          
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
            console.log('🔐 [AUTH_STORE] Setting initial user data:', userData)
            clearTimeout(safetyTimeout)
            set({ 
              user: userData, 
              isLoading: false,
              isAuthenticated: true,
              error: null
            })
            console.log('🔐 [AUTH_STORE] Initial authentication completed successfully')
          } else {
            console.log('🔐 [AUTH_STORE] No profile found in initial check, clearing state')
            clearTimeout(safetyTimeout)
            set({ user: null, isLoading: false, isAuthenticated: false, error: null })
          }
        } catch (error) {
          console.error('🔐 [AUTH_STORE] Error en verificación inicial:', error)
          clearTimeout(safetyTimeout)
          set({ user: null, isLoading: false, isAuthenticated: false, error: null })
        }
      }).catch(error => {
        console.error('🔐 [AUTH_STORE] Promise rejection in initial session check:', error)
        clearTimeout(safetyTimeout)
        set({ user: null, isLoading: false, isAuthenticated: false, error: null })
      })
    }
  }
  
  return {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

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
      set({ user: null, isLoading: false, isAuthenticated: false, error: null })
    } catch (error) {
      console.error('Error en logout:', error)
      set({ user: null, isLoading: false, isAuthenticated: false, error: null }) // Limpiar estado aunque haya error
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

  clearError: () => {
    set({ error: null })
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