import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore, useRole } from '../store/authStore'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  requireAuth?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true 
}) => {
  const { user, isLoading, error, connectionError, retryAuth, clearError, sessionVerified } = useAuthStore()
  const { canAccess } = useRole()
  const location = useLocation()

  // Timeout para evitar loading infinito
  useEffect(() => {
    if (isLoading && !sessionVerified) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ [PROTECTED_ROUTE] Loading timeout reached, forcing error state')
        clearError()
      }, 5000) // 5 segundos máximo de loading
      
      return () => clearTimeout(timeout)
    }
  }, [isLoading, sessionVerified, clearError])

  // Mostrar loading mientras se verifica la autenticación (con timeout)
  if (isLoading && !sessionVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticación...</p>
          <p className="text-xs text-gray-400 mt-2">Esto no debería tomar más de unos segundos</p>
        </div>
      </div>
    )
  }

  // Mostrar error de conexión con opción de reintentar
  if (connectionError || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error de Conexión</h2>
          <p className="text-gray-600 mb-4">
            {error || 'No se pudo conectar con el servidor de autenticación.'}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Por favor, verifica tu conexión a internet e intenta nuevamente.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                clearError()
                retryAuth()
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reintentando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </>
              )}
            </button>
            <br />
            <button
              onClick={() => window.location.href = '/login'}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ir al Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Si requiere autenticación y no hay usuario, redirigir al login
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Si hay roles específicos requeridos, verificar permisos
  if (allowedRoles.length > 0 && user && !canAccess(allowedRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta página.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Tu rol actual: <span className="font-medium">{user?.rol}</span>
            <br />
            Roles requeridos: <span className="font-medium">{allowedRoles.join(', ')}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  // Si todo está bien, renderizar los children
  return <>{children}</>
}

export default ProtectedRoute

// Componente específico para rutas públicas (como login)
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, error, connectionError, retryAuth, clearError, sessionVerified } = useAuthStore()
  const location = useLocation()

  // Timeout para evitar loading infinito en rutas públicas
  useEffect(() => {
    if (isLoading && !sessionVerified) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ [PUBLIC_ROUTE] Loading timeout reached, allowing access')
        clearError()
      }, 3000) // 3 segundos para rutas públicas
      
      return () => clearTimeout(timeout)
    }
  }, [isLoading, sessionVerified, clearError])

  // Si está cargando y no se ha verificado la sesión, mostrar loading breve
  if (isLoading && !sessionVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
          <p className="text-xs text-gray-400 mt-2">Verificando sesión existente</p>
        </div>
      </div>
    )
  }

  // Mostrar error de conexión con opción de reintentar (solo si no hay usuario)
  if ((connectionError || error) && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-yellow-100 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Problema de Conexión</h2>
          <p className="text-gray-600 mb-4">
            {error || 'Hay un problema con la conexión al servidor.'}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Puedes continuar sin autenticación o intentar reconectar.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                clearError()
                retryAuth()
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reintentando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar Conexión
                </>
              )}
            </button>
            <br />
            <button
              onClick={() => {
                clearError()
                // Continuar sin autenticación mostrando el children
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Continuar sin Conexión
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Si ya está autenticado, redirigir al dashboard
  if (user) {
    const from = (location.state as any)?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  // Si no está autenticado, mostrar la página pública
  return <>{children}</>
}

// Hook personalizado para verificar permisos en componentes
export const usePermissions = () => {
  const { user } = useAuthStore()
  const { canAccess } = useRole()

  const hasPermission = (allowedRoles: string[]) => {
    return user && canAccess(allowedRoles)
  }

  const isRole = (role: string) => {
    return user?.rol === role
  }

  return {
    hasPermission,
    isRole,
    isPersonal: isRole('personal'),
    isSoporte: isRole('soporte'),
    isAdmin: isRole('administrador'),
    currentRole: user?.rol
  }
}