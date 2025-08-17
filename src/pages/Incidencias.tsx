import React, { useState, useEffect } from 'react'
import { Search, Filter, Plus, Eye, MessageSquare, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import type { Incidencia, Categoria, IncidenciaFilter } from '../types/database'

const Incidencias: React.FC = () => {
  const { user } = useAuthStore()
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<IncidenciaFilter>({
    estado: 'todas',
    prioridad: 'todas',
    categoria: 'todas'
  })
  const [selectedIncidencia, setSelectedIncidencia] = useState<Incidencia | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadIncidencias()
  }, [selectedFilter, searchTerm])

  const loadData = async () => {
    try {
      await Promise.all([
        loadCategorias(),
        loadIncidencias()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadIncidencias = async () => {
    console.log('🔄 Iniciando carga de incidencias para usuario:', user?.id)
    
    try {
      // Primero intentar cargar con consulta simplificada
      console.log('📊 Intentando consulta simplificada...')
      let query = supabase
        .from('incidencias')
        .select(`
          *,
          categorias(nombre, descripcion)
        `)
        .eq('usuario_id', user?.id)
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (selectedFilter.estado !== 'todas') {
        query = query.eq('estado', selectedFilter.estado)
        console.log('🔍 Filtro estado aplicado:', selectedFilter.estado)
      }
      if (selectedFilter.prioridad !== 'todas') {
        query = query.eq('prioridad', selectedFilter.prioridad)
        console.log('🔍 Filtro prioridad aplicado:', selectedFilter.prioridad)
      }
      if (selectedFilter.categoria !== 'todas') {
        query = query.eq('categoria_id', parseInt(selectedFilter.categoria))
        console.log('🔍 Filtro categoría aplicado:', selectedFilter.categoria)
      }

      // Aplicar búsqueda
      if (searchTerm) {
        query = query.or(`titulo.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`)
        console.log('🔍 Búsqueda aplicada:', searchTerm)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Error en consulta completa:', error)
        throw error
      }
      
      console.log('✅ Consulta completa exitosa, incidencias cargadas:', data?.length || 0)
      setIncidencias(data || [])
      
    } catch (error) {
      console.error('❌ Error en consulta completa, intentando fallback...', error)
      
      // Fallback: cargar solo incidencias básicas
      try {
        console.log('🔄 Ejecutando consulta de fallback (solo incidencias básicas)...')
        
        let fallbackQuery = supabase
          .from('incidencias')
          .select('*')
          .eq('usuario_id', user?.id)
          .order('created_at', { ascending: false })

        // Aplicar filtros básicos
        if (selectedFilter.estado !== 'todas') {
          fallbackQuery = fallbackQuery.eq('estado', selectedFilter.estado)
        }
        if (selectedFilter.prioridad !== 'todas') {
          fallbackQuery = fallbackQuery.eq('prioridad', selectedFilter.prioridad)
        }
        if (selectedFilter.categoria !== 'todas') {
          fallbackQuery = fallbackQuery.eq('categoria_id', parseInt(selectedFilter.categoria))
        }
        if (searchTerm) {
          fallbackQuery = fallbackQuery.or(`titulo.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`)
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery

        if (fallbackError) {
          console.error('❌ Error en consulta de fallback:', fallbackError)
          throw fallbackError
        }

        console.log('✅ Consulta de fallback exitosa, incidencias cargadas:', fallbackData?.length || 0)
        setIncidencias(fallbackData || [])
        
        // Mostrar advertencia al usuario
        toast.error('Algunas funciones pueden estar limitadas. Datos básicos cargados correctamente.')
        
      } catch (fallbackError) {
        console.error('❌ Error crítico en ambas consultas:', fallbackError)
        setIncidencias([])
        toast.error('Error al cargar las incidencias. Por favor, recarga la página.')
      }
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

  const filteredIncidencias = incidencias

  if (loading) {
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={selectedFilter.estado}
                onChange={(e) => setSelectedFilter(prev => ({ ...prev, estado: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                value={selectedFilter.prioridad}
                onChange={(e) => setSelectedFilter(prev => ({ ...prev, prioridad: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                value={selectedFilter.categoria}
                onChange={(e) => setSelectedFilter(prev => ({ ...prev, categoria: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        {filteredIncidencias.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay incidencias</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedFilter.estado !== 'todas' || selectedFilter.prioridad !== 'todas' || selectedFilter.categoria !== 'todas'
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
            {filteredIncidencias.map((incidencia) => (
              <div
                key={incidencia.id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedIncidencia(incidencia)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getPrioridadColor(incidencia.prioridad)}`}></div>
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        #{incidencia.id} - {incidencia.titulo}
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

      {/* Modal de detalle (placeholder) */}
      {selectedIncidencia && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Incidencia #{selectedIncidencia.id}
                </h3>
                <button
                  onClick={() => setSelectedIncidencia(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedIncidencia.titulo}</h4>
                  <p className="mt-1 text-sm text-gray-600">{selectedIncidencia.descripcion}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Estado:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(selectedIncidencia.estado)}`}>
                      {selectedIncidencia.estado.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Prioridad:</span>
                    <span className="ml-2 capitalize">{selectedIncidencia.prioridad}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Categoría:</span>
                    <span className="ml-2">{(selectedIncidencia as any).categorias?.nombre}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Creada:</span>
                    <span className="ml-2">{formatDate(selectedIncidencia.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedIncidencia(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Incidencias