import React, { useState, useEffect } from 'react'
import { Search, Filter, Plus, Eye, MessageSquare, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../store/authStore'
import type { Incidencia, Categoria, IncidenciaFilter, IncidenciaConRelaciones } from '../types/database'
import { obtenerIncidenciasUsuario, obtenerCategorias } from '../lib/supabase'

function Incidencias() {
  console.log('🎯 [INCIDENCIAS] Componente Incidencias iniciando...')
  
  const { user } = useAuthStore()
  const [incidencias, setIncidencias] = useState<IncidenciaConRelaciones[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState<IncidenciaConRelaciones | null>(null)
  const [filtros, setFiltros] = useState<IncidenciaFilter>({
    busqueda: '',
    estado: 'todas',
    prioridad: 'todas',
    categoria: 'todas'
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  console.log('🎯 [INCIDENCIAS] Estado inicial - Usuario:', user)

  // Función para formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para limpiar datos de prueba y forzar reautenticación
  const limpiarDatosPrueba = () => {
    console.log('🧹 [DEBUG] Limpiando datos de prueba...')
    
    // Verificar si el usuario actual tiene ID numérico
    if (user && (user.id === '1' || typeof user.id === 'number')) {
      console.log('🧹 [DEBUG] Usuario con ID numérico detectado:', user.id)
      console.log('🧹 [DEBUG] Limpiando localStorage y forzando logout...')
      
      // Limpiar localStorage
      localStorage.removeItem('incibot_user_data')
      localStorage.removeItem('auth-storage')
      localStorage.clear()
      
      // Mostrar mensaje al usuario
      toast.error('Datos de prueba detectados. Por favor, inicia sesión con credenciales reales de Supabase.')
      
      // Forzar logout y redirección
      setTimeout(() => {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }, 1000)
      
      return true // Indica que se detectaron datos de prueba
    }
    
    // Verificar localStorage adicional
    const userData = localStorage.getItem('incibot_user_data')
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        console.log('🔍 [DEBUG] Datos en localStorage:', parsed)
        
        if (parsed.id === '1' || typeof parsed.id === 'number') {
          console.log('🧹 [DEBUG] Removiendo datos de prueba del localStorage')
          localStorage.removeItem('incibot_user_data')
          localStorage.removeItem('auth-storage')
          localStorage.clear()
          
          toast.error('Datos de prueba detectados. Por favor, inicia sesión con credenciales reales.')
          
          setTimeout(() => {
            useAuthStore.getState().logout()
            window.location.href = '/login'
          }, 1000)
          
          return true
        }
      } catch (e) {
        console.error('❌ [DEBUG] Error parseando datos de usuario:', e)
        localStorage.removeItem('incibot_user_data')
        localStorage.removeItem('auth-storage')
      }
    }
    
    console.log('✅ [DEBUG] Verificación completada - No se detectaron datos de prueba')
    return false
  }

  useEffect(() => {
    console.log('🚀 Componente Incidencias montado')
    console.log('👤 Usuario en useEffect inicial:', user)
    
    // FORZAR limpieza inmediata si hay datos de prueba
    if (user && (user.id === '1' || typeof user.id === 'number')) {
      console.log('🧹 [FORZADO] Detectado usuario con ID numérico:', user.id)
      console.log('🧹 [FORZADO] Limpiando localStorage y forzando logout...')
      
      // Limpiar todo el localStorage
      localStorage.clear()
      
      // Mostrar mensaje al usuario
      toast.error('Datos de prueba detectados. Redirigiendo al login para usar credenciales reales de Supabase.')
      
      // Forzar logout inmediato
      useAuthStore.getState().logout()
      
      // Redirección inmediata
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
      
      return // No cargar datos
    }
    
    // Limpiar datos de prueba antes de cargar datos
    const tieneDatosPrueba = limpiarDatosPrueba()
    
    // Solo cargar datos si no se detectaron datos de prueba
    if (!tieneDatosPrueba) {
      cargarDatos()
    }
  }, [user])

  useEffect(() => {
    cargarIncidencias()
  }, [user, filtros])

  const cargarDatos = async () => {
    try {
      console.log('🔄 Iniciando carga de datos...')
      
      // Cargar categorías
      console.log('📂 Cargando categorías...')
      const categoriasData = await obtenerCategorias()
      console.log('📂 Categorías obtenidas:', categoriasData)
      setCategorias(categoriasData)
      
      // Cargar incidencias
      console.log('📋 Cargando incidencias...')
      await cargarIncidencias()
    } catch (err) {
      console.error('❌ Error cargando datos:', err)
      setError('Error al cargar los datos')
      setCargando(false)
    }
  }

  const cargarIncidencias = async () => {
    console.log('🔍 [DEBUG] cargarIncidencias iniciado')
    console.log('🔍 [DEBUG] Usuario actual:', user)
    console.log('🔍 [DEBUG] User ID:', user?.id)
    console.log('🔍 [DEBUG] User email:', user?.email)
    
    if (!user?.id) {
      console.log('❌ Usuario no autenticado')
      setError('Usuario no autenticado')
      setCargando(false)
      return
    }

    try {
      setCargando(true)
      setError(null)
      
      console.log('🔍 Obteniendo incidencias para usuario ID:', user.id)
      console.log('🔄 Tipo de user.id:', typeof user.id)
      // Obtener incidencias del usuario desde Supabase
      const incidenciasUsuario = await obtenerIncidenciasUsuario(user.id)
      console.log('📋 Incidencias obtenidas de Supabase:', incidenciasUsuario)
      console.log('📊 Cantidad de incidencias:', incidenciasUsuario?.length || 0)
      
      // Debug específico para el campo codigo
      incidenciasUsuario.forEach((inc, index) => {
        console.log(`🎫 Incidencia ${index + 1}:`, {
          id: inc.id,
          titulo: inc.titulo,
          codigo: inc.codigo,
          codigo_type: typeof inc.codigo,
          codigo_exists: inc.codigo !== null && inc.codigo !== undefined
        })
      })
      
      // Aplicar filtros locales
      let incidenciasFiltradas = [...incidenciasUsuario]

      // Filtrar por búsqueda
      if (filtros.busqueda) {
        incidenciasFiltradas = incidenciasFiltradas.filter(inc => 
          inc.titulo.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
          inc.descripcion.toLowerCase().includes(filtros.busqueda.toLowerCase())
        )
      }

      // Filtrar por estado
      if (filtros.estado !== 'todas') {
        incidenciasFiltradas = incidenciasFiltradas.filter(inc => inc.estado === filtros.estado)
      }

      // Filtrar por prioridad
      if (filtros.prioridad !== 'todas') {
        incidenciasFiltradas = incidenciasFiltradas.filter(inc => inc.prioridad === filtros.prioridad)
      }

      // Filtrar por categoría
      if (filtros.categoria !== 'todas') {
        incidenciasFiltradas = incidenciasFiltradas.filter(inc => inc.categoria_id === filtros.categoria)
      }

      console.log('✅ Estableciendo incidencias filtradas:', incidenciasFiltradas)
      setIncidencias(incidenciasFiltradas)
    } catch (err) {
      console.error('❌ Error cargando incidencias:', err)
      setError('Error al cargar las incidencias')
    } finally {
      setCargando(false)
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'abierta':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'en_progreso':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'resuelta':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cerrada':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'abierta':
        return 'bg-red-100 text-red-800'
      case 'en_progreso':
        return 'bg-yellow-100 text-yellow-800'
      case 'resuelta':
        return 'bg-green-100 text-green-800'
      case 'cerrada':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'critica':
        return 'bg-red-500'
      case 'alta':
        return 'bg-orange-500'
      case 'media':
        return 'bg-yellow-500'
      case 'baja':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Verificar si el usuario está autenticado
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso restringido</h3>
          <p className="text-gray-500">Debes iniciar sesión para ver tus incidencias.</p>
        </div>
      </div>
    )
  }

  if (cargando && incidencias.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Incidencias</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona y da seguimiento a tus incidencias reportadas
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => window.location.href = '/chatbot'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Incidencia
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar incidencias..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={cargando}
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={cargando}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
        </div>

        {/* Filters */}
        {mostrarFiltros && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value as any })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={cargando}
              >
                <option value="todas">Todas</option>
                <option value="abierta">Abierta</option>
                <option value="en_progreso">En Progreso</option>
                <option value="resuelta">Resuelta</option>
                <option value="cerrada">Cerrada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <select
                value={filtros.prioridad}
                onChange={(e) => setFiltros({ ...filtros, prioridad: e.target.value as any })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={cargando}
              >
                <option value="todas">Todas</option>
                <option value="critica">Crítica</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={filtros.categoria}
                onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={cargando}
              >
                <option value="todas">Todas</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id.toString()}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Incidencias List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {cargando ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando incidencias...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar incidencias</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={cargarIncidencias}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : incidencias.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay incidencias</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filtros.busqueda || filtros.estado !== 'todas' || filtros.prioridad !== 'todas' || filtros.categoria !== 'todas'
                ? 'No se encontraron incidencias con los filtros aplicados.'
                : 'Aún no has reportado ninguna incidencia.'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.location.href = '/chatbot'}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Reportar Primera Incidencia
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {incidencias.map((incidencia) => (
              <div
                key={incidencia.id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setIncidenciaSeleccionada(incidencia)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getPrioridadColor(incidencia.prioridad)}`}></div>
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {incidencia.codigo || `#${incidencia.id.substring(0, 8)}`} - {incidencia.titulo}
                      </h3>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {incidencia.descripcion}
                    </p>
                    
                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        {getEstadoIcon(incidencia.estado)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(incidencia.estado)}`}>
                          {incidencia.estado.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <span className="text-gray-400">•</span>
                      
                      <span>{(incidencia as any).categorias?.nombre}</span>
                      
                      <span className="text-gray-400">•</span>
                      
                      <span>{formatDate(incidencia.created_at)}</span>
                      
                      {(incidencia as any).respuestas && (incidencia as any).respuestas.length > 0 && (
                        <>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{(incidencia as any).respuestas.length} respuestas</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <Eye className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {incidenciaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{incidenciaSeleccionada.codigo || `#${incidenciaSeleccionada.id.substring(0, 8)}`} - {incidenciaSeleccionada.titulo}</h2>
                <button
                  onClick={() => setIncidenciaSeleccionada(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getEstadoColor(incidenciaSeleccionada.estado)
                  }`}>
                    {incidenciaSeleccionada.estado.charAt(0).toUpperCase() + incidenciaSeleccionada.estado.slice(1)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getPrioridadColor(incidenciaSeleccionada.prioridad)
                  }`}>
                    {incidenciaSeleccionada.prioridad.charAt(0).toUpperCase() + incidenciaSeleccionada.prioridad.slice(1)}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Descripción</h3>
                  <p className="text-gray-600">{incidenciaSeleccionada.descripcion}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Fecha de creación</h3>
                    <p className="text-gray-600">{formatearFecha(incidenciaSeleccionada.created_at)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Código de incidencia</h3>
                    <p className="text-gray-600">{incidenciaSeleccionada.codigo || `#${incidenciaSeleccionada.id.substring(0, 8)}`}</p>
                  </div>
                </div>
                
                {(incidenciaSeleccionada as any).categorias && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Categoría</h3>
                    <p className="text-gray-600">{(incidenciaSeleccionada as any).categorias.nombre}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Incidencias