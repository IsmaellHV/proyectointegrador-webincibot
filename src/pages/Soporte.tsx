import React, { useState, useEffect } from 'react'
import { Search, Filter, User, Clock, MessageSquare, CheckCircle, AlertTriangle, Eye, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import type { IncidenciaConRelaciones, Categoria, Respuesta, RespuestaConUsuario } from '../types/database'

const Soporte: React.FC = () => {
  // Datos de demostración
  const demoUser = {
    id: '1',
    nombre: 'Admin Soporte',
    email: 'admin@incibot.com',
    rol: 'administrador' as const,
    password_hash: '$2b$10$demo.hash',
    activo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  const demoUsuarios = [
    { id: '1', nombre: 'Admin Soporte', email: 'admin@incibot.com', rol: 'administrador' as const, password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
    { id: '2', nombre: 'Juan Pérez', email: 'juan@empresa.com', rol: 'personal' as const, password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
    { id: '3', nombre: 'María García', email: 'maria@empresa.com', rol: 'personal' as const, password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
    { id: '4', nombre: 'Carlos López', email: 'carlos@empresa.com', rol: 'personal' as const, password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
    { id: '5', nombre: 'Ana Martínez', email: 'ana@empresa.com', rol: 'personal' as const, password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
    { id: '6', nombre: 'Pedro Rodríguez', email: 'pedro@empresa.com', rol: 'personal' as const, password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
  ]

  const demoCategorias: Categoria[] = [
    { id: '1', nombre: 'Técnico', descripcion: 'Problemas técnicos del sistema', activa: true, created_at: '2024-01-01T00:00:00Z' },
    { id: '2', nombre: 'Acceso', descripcion: 'Problemas de acceso y autenticación', activa: true, created_at: '2024-01-01T00:00:00Z' },
    { id: '3', nombre: 'Funcionalidad', descripcion: 'Problemas con funcionalidades específicas', activa: true, created_at: '2024-01-01T00:00:00Z' },
    { id: '4', nombre: 'Rendimiento', descripcion: 'Problemas de rendimiento del sistema', activa: true, created_at: '2024-01-01T00:00:00Z' }
  ]

  const demoIncidencias: IncidenciaConRelaciones[] = [
    {
      id: '1',
      titulo: 'Error al cargar dashboard',
      descripcion: 'El dashboard principal no carga correctamente después del login. Se muestra una pantalla en blanco.',
      estado: 'abierta' as const,
      prioridad: 'alta' as const,
      categoria_id: '1',
      usuario_id: '2',
      asignado_a: null,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      resolved_at: null,
      categoria: { id: '1', nombre: 'Técnico', descripcion: 'Problemas técnicos del sistema', activa: true, created_at: '2024-01-01T00:00:00Z' },
      usuario: { id: '2', nombre: 'Juan Pérez', email: 'juan@empresa.com', rol: 'personal', password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      asignado: null,
      respuestas: []
    },
    {
      id: '2',
      titulo: 'No puedo acceder al sistema',
      descripcion: 'Cuando intento hacer login me dice que las credenciales son incorrectas, pero estoy seguro de que son correctas.',
      estado: 'en_progreso' as const,
      prioridad: 'media' as const,
      categoria_id: '2',
      usuario_id: '3',
      asignado_a: '1',
      created_at: '2024-01-14T14:20:00Z',
      updated_at: '2024-01-15T09:15:00Z',
      resolved_at: null,
      categoria: { id: '2', nombre: 'Acceso', descripcion: 'Problemas de acceso y autenticación', activa: true, created_at: '2024-01-01T00:00:00Z' },
      usuario: { id: '3', nombre: 'María García', email: 'maria@empresa.com', rol: 'personal', password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      asignado: { id: '1', nombre: 'Admin Soporte', email: 'admin@incibot.com', rol: 'administrador', password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      respuestas: [
        {
          id: '1',
          incidencia_id: '2',
          usuario_id: '1',
          contenido: 'Hola María, voy a revisar tu cuenta. ¿Podrías confirmarme tu email registrado?',
          tipo: 'respuesta' as const,
          created_at: '2024-01-15T09:15:00Z',
          usuario: { id: '1', nombre: 'Admin Soporte', email: 'admin@incibot.com', rol: 'administrador', password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
        }
      ]
    },
    {
      id: '3',
      titulo: 'Función de reportes no funciona',
      descripcion: 'Al intentar generar un reporte de incidencias, el sistema se queda cargando indefinidamente.',
      estado: 'resuelta' as const,
      prioridad: 'baja' as const,
      categoria_id: '3',
      usuario_id: '4',
      asignado_a: '1',
      created_at: '2024-01-13T16:45:00Z',
      updated_at: '2024-01-14T11:30:00Z',
      resolved_at: '2024-01-14T11:30:00Z',
      categoria: { id: '3', nombre: 'Funcionalidad', descripcion: 'Problemas con funcionalidades específicas', activa: true, created_at: '2024-01-01T00:00:00Z' },
      usuario: { id: '4', nombre: 'Carlos López', email: 'carlos@empresa.com', rol: 'personal', password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      asignado: { id: '1', nombre: 'Admin Soporte', email: 'admin@incibot.com', rol: 'administrador', password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      respuestas: [
        {
          id: '2',
          incidencia_id: '3',
          usuario_id: '1',
          contenido: 'Hemos identificado el problema. Era un error en la consulta de la base de datos. Ya está solucionado.',
          tipo: 'respuesta' as const,
          created_at: '2024-01-14T11:30:00Z',
          usuario: { id: '1', nombre: 'Admin Soporte', email: 'admin@incibot.com', rol: 'administrador', password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
        }
      ]
    },
    {
      id: '4',
      titulo: 'Sistema muy lento',
      descripcion: 'El sistema está funcionando muy lento desde ayer. Las páginas tardan mucho en cargar.',
      estado: 'cerrada' as const,
      prioridad: 'critica' as const,
      categoria_id: '4',
      usuario_id: '5',
      asignado_a: '1',
      created_at: '2024-01-12T08:00:00Z',
      updated_at: '2024-01-13T15:00:00Z',
      resolved_at: '2024-01-13T15:00:00Z',
      categoria: { id: '4', nombre: 'Rendimiento', descripcion: 'Problemas de rendimiento del sistema', activa: true, created_at: '2024-01-01T00:00:00Z' },
      usuario: { id: '5', nombre: 'Ana Martínez', email: 'ana@empresa.com', rol: 'personal', password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      asignado: { id: '1', nombre: 'Admin Soporte', email: 'admin@incibot.com', rol: 'administrador', password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      respuestas: [
        {
          id: '3',
          incidencia_id: '4',
          usuario_id: '1',
          contenido: 'Hemos optimizado la base de datos y actualizado el servidor. El rendimiento debería haber mejorado significativamente.',
          tipo: 'respuesta' as const,
          created_at: '2024-01-13T15:00:00Z',
          usuario: { id: '1', nombre: 'Admin Soporte', email: 'admin@incibot.com', rol: 'administrador', password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
        }
      ]
    },
    {
      id: '5',
      titulo: 'Error 500 al subir archivos',
      descripcion: 'Cuando intento subir un archivo adjunto a una incidencia, me aparece un error 500.',
      estado: 'abierta' as const,
      prioridad: 'media' as const,
      categoria_id: '1',
      usuario_id: '6',
      asignado_a: null,
      created_at: '2024-01-15T13:20:00Z',
      updated_at: '2024-01-15T13:20:00Z',
      resolved_at: null,
      categoria: { id: '1', nombre: 'Técnico', descripcion: 'Problemas técnicos del sistema', activa: true, created_at: '2024-01-01T00:00:00Z' },
      usuario: { id: '6', nombre: 'Pedro Rodríguez', email: 'pedro@empresa.com', rol: 'personal', password_hash: '$2b$10$demo.hash', activo: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      asignado: null,
      respuestas: []
    }
  ]

  const [incidencias, setIncidencias] = useState<IncidenciaConRelaciones[]>(demoIncidencias)
  const [categorias, setCategorias] = useState<Categoria[]>(demoCategorias)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState({
    estado: 'todas',
    prioridad: 'todas',
    categoria: 'todas',
    asignacion: 'todas'
  })
  const [selectedIncidencia, setSelectedIncidencia] = useState<IncidenciaConRelaciones | null>(null)
  const [respuestas, setRespuestas] = useState<RespuestaConUsuario[]>([])
  const [nuevaRespuesta, setNuevaRespuesta] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [loadingRespuesta, setLoadingRespuesta] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    loadIncidencias()
  }, [selectedFilter, searchTerm])

  const cargarDatos = async () => {
    try {
      // Simular carga asíncrona
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Los datos ya están inicializados en el estado
      loadIncidencias()
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const loadIncidencias = () => {
    try {
      let incidenciasFiltradas = [...demoIncidencias]

      // Aplicar filtros
      if (selectedFilter.estado !== 'todas') {
        incidenciasFiltradas = incidenciasFiltradas.filter(inc => inc.estado === selectedFilter.estado)
      }
      if (selectedFilter.prioridad !== 'todas') {
        incidenciasFiltradas = incidenciasFiltradas.filter(inc => inc.prioridad === selectedFilter.prioridad)
      }
      if (selectedFilter.categoria !== 'todas') {
        incidenciasFiltradas = incidenciasFiltradas.filter(inc => inc.categoria_id === selectedFilter.categoria)
      }
      if (selectedFilter.asignacion === 'mis_asignadas') {
        incidenciasFiltradas = incidenciasFiltradas.filter(inc => inc.asignado_a === demoUser.id)
      } else if (selectedFilter.asignacion === 'sin_asignar') {
        incidenciasFiltradas = incidenciasFiltradas.filter(inc => !inc.asignado_a)
      }

      // Aplicar búsqueda
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        incidenciasFiltradas = incidenciasFiltradas.filter(inc => 
          inc.titulo.toLowerCase().includes(searchLower) ||
          inc.descripcion.toLowerCase().includes(searchLower)
        )
      }

      // Ordenar por fecha de creación (más recientes primero)
      incidenciasFiltradas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setIncidencias(incidenciasFiltradas)
    } catch (error) {
      console.error('Error loading incidents:', error)
      toast.error('Error al cargar las incidencias')
    }
  }

  const loadRespuestas = (incidenciaId: string) => {
    try {
      // Buscar la incidencia en los datos demo
      const incidencia = demoIncidencias.find(inc => inc.id === incidenciaId)
      const respuestasIncidencia = incidencia?.respuestas || []
      
      // Ordenar por fecha de creación (más antiguas primero)
      const respuestasOrdenadas = respuestasIncidencia.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      
      setRespuestas(respuestasOrdenadas)
    } catch (error) {
      console.error('Error loading responses:', error)
      toast.error('Error al cargar las respuestas')
    }
  }

  const asignarIncidencia = async (incidenciaId: string) => {
    try {
      // Encontrar la incidencia en los datos demo
      const incidenciaIndex = demoIncidencias.findIndex(inc => inc.id === incidenciaId)
      if (incidenciaIndex !== -1) {
        // Actualizar la incidencia en los datos demo
        demoIncidencias[incidenciaIndex] = {
          ...demoIncidencias[incidenciaIndex],
          asignado_a: demoUser.id,
          asignado: { id: demoUser.id, nombre: demoUser.nombre, email: demoUser.email, rol: demoUser.rol, password_hash: demoUser.password_hash, activo: demoUser.activo, created_at: demoUser.created_at, updated_at: demoUser.updated_at },
          estado: 'en_progreso' as const,
          updated_at: new Date().toISOString()
        }
        
        toast.success('Incidencia asignada correctamente')
        loadIncidencias()
        
        // Actualizar la incidencia seleccionada si es la misma
        if (selectedIncidencia?.id === incidenciaId) {
          setSelectedIncidencia(demoIncidencias[incidenciaIndex])
        }
      }
    } catch (error) {
      console.error('Error assigning incident:', error)
      toast.error('Error al asignar la incidencia')
    }
  }

  const cambiarEstado = async (incidenciaId: string, nuevoEstado: string) => {
    try {
      // Encontrar la incidencia en los datos demo
      const incidenciaIndex = demoIncidencias.findIndex(inc => inc.id === incidenciaId)
      if (incidenciaIndex !== -1) {
        // Actualizar la incidencia en los datos demo
        demoIncidencias[incidenciaIndex] = {
          ...demoIncidencias[incidenciaIndex],
          estado: nuevoEstado as 'abierta' | 'en_progreso' | 'resuelta' | 'cerrada',
          updated_at: new Date().toISOString()
        }
        
        toast.success(`Estado cambiado a ${nuevoEstado.replace('_', ' ')}`)
        loadIncidencias()
        
        // Actualizar la incidencia seleccionada si es la misma
        if (selectedIncidencia?.id === incidenciaId) {
          setSelectedIncidencia(demoIncidencias[incidenciaIndex])
        }
      }
    } catch (error) {
      console.error('Error changing status:', error)
      toast.error('Error al cambiar el estado')
    }
  }

  const enviarRespuesta = () => {
    if (!nuevaRespuesta.trim() || !selectedIncidencia || loadingRespuesta) return

    setLoadingRespuesta(true)
    try {
      // Crear nueva respuesta
      const nuevaRespuestaObj: RespuestaConUsuario = {
        id: String(Date.now()), // ID temporal
        incidencia_id: selectedIncidencia.id,
        usuario_id: demoUser.id,
        contenido: nuevaRespuesta.trim(),
        tipo: 'respuesta' as const,
        created_at: new Date().toISOString(),
        usuario: { id: demoUser.id, nombre: demoUser.nombre, email: demoUser.email, rol: demoUser.rol, password_hash: demoUser.password_hash, activo: demoUser.activo, created_at: demoUser.created_at, updated_at: demoUser.updated_at }
      }
      
      // Encontrar la incidencia en los datos demo y agregar la respuesta
      const incidenciaIndex = demoIncidencias.findIndex(inc => inc.id === selectedIncidencia.id)
      if (incidenciaIndex !== -1) {
        if (!demoIncidencias[incidenciaIndex].respuestas) {
          demoIncidencias[incidenciaIndex].respuestas = []
        }
        demoIncidencias[incidenciaIndex].respuestas!.push(nuevaRespuestaObj)
        
        // Si la incidencia estaba abierta, cambiarla a en progreso
        if (selectedIncidencia.estado === 'abierta') {
          demoIncidencias[incidenciaIndex].estado = 'en_progreso'
          setSelectedIncidencia(demoIncidencias[incidenciaIndex])
        }
      }
      
      toast.success('Respuesta enviada exitosamente')
      setNuevaRespuesta('')
      loadRespuestas(selectedIncidencia.id)
      loadIncidencias()
    } catch (error) {
      console.error('Error sending response:', error)
      toast.error('Error al enviar la respuesta')
    } finally {
      setLoadingRespuesta(false)
    }
  }

  const abrirModal = (incidencia: IncidenciaConRelaciones) => {
    setSelectedIncidencia(incidencia)
    setShowModal(true)
    loadRespuestas(incidencia.id)
  }

  const cerrarModal = () => {
    setShowModal(false)
    setSelectedIncidencia(null)
    setRespuestas([])
    setNuevaRespuesta('')
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Soporte</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona y atiende las incidencias del sistema INCIBOT
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Abiertas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {incidencias.filter(i => i.estado === 'abierta').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">En Progreso</p>
              <p className="text-2xl font-semibold text-gray-900">
                {incidencias.filter(i => i.estado === 'en_progreso').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Mis Asignadas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {incidencias.filter(i => i.asignado_a === demoUser.id).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Resueltas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {incidencias.filter(i => i.estado === 'resuelta').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
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

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={selectedFilter.estado}
                onChange={(e) => setSelectedFilter(prev => ({ ...prev, estado: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas</option>
                <option value="abierta">Abierta</option>
                <option value="en_progreso">En Progreso</option>
                <option value="resuelta">Resuelta</option>
                <option value="cerrada">Cerrada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select
                value={selectedFilter.prioridad}
                onChange={(e) => setSelectedFilter(prev => ({ ...prev, prioridad: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas</option>
                <option value="critica">Crítica</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={selectedFilter.categoria}
                onChange={(e) => setSelectedFilter(prev => ({ ...prev, categoria: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id.toString()}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asignación</label>
              <select
                value={selectedFilter.asignacion}
                onChange={(e) => setSelectedFilter(prev => ({ ...prev, asignacion: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas</option>
                <option value="mis_asignadas">Mis Asignadas</option>
                <option value="sin_asignar">Sin Asignar</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Incidencias List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {incidencias.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay incidencias</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron incidencias con los filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {incidencias.map((incidencia) => (
              <div key={incidencia.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getPrioridadColor(incidencia.prioridad)}`}></div>
                      <h3 className="text-lg font-medium text-gray-900">
                        #{incidencia.id} - {incidencia.titulo}
                      </h3>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {incidencia.descripcion}
                    </p>
                    
                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(incidencia.estado)}`}>
                        {incidencia.estado.replace('_', ' ').toUpperCase()}
                      </span>
                      
                      <span>{(incidencia as any).categorias?.nombre}</span>
                      
                      <span>Por: {(incidencia as any).usuario?.nombre}</span>
                      
                      {(incidencia as any).asignado && (
                        <span>Asignado a: {(incidencia as any).asignado.nombre}</span>
                      )}
                      
                      <span>{formatDate(incidencia.created_at)}</span>
                      
                      {(incidencia as any).respuestas && (incidencia as any).respuestas.length > 0 && (
                        <div className="flex items-center text-xs text-gray-500">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          <span>{(incidencia as any).respuestas.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4 flex space-x-2">
                    {!incidencia.asignado_a && (
                      <button
                        onClick={() => asignarIncidencia(incidencia.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <User className="h-3 w-3 mr-1" />
                        Asignar
                      </button>
                    )}
                    
                    <button
                      onClick={() => abrirModal(incidencia)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {showModal && selectedIncidencia && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Incidencia #{selectedIncidencia.id} - {selectedIncidencia.titulo}
              </h3>
              <button
                onClick={cerrarModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Información de la incidencia */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Información</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Estado:</span>
                      <div className="mt-1">
                        <select
                          value={selectedIncidencia.estado}
                          onChange={(e) => cambiarEstado(selectedIncidencia.id, e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                        >
                          <option value="abierta">Abierta</option>
                          <option value="en_progreso">En Progreso</option>
                          <option value="resuelta">Resuelta</option>
                          <option value="cerrada">Cerrada</option>
                        </select>
                      </div>
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
                      <span className="font-medium text-gray-700">Reportado por:</span>
                      <span className="ml-2">{(selectedIncidencia as any).usuario?.nombre}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Asignado a:</span>
                      <span className="ml-2">{(selectedIncidencia as any).asignado?.nombre || 'Sin asignar'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Creada:</span>
                      <span className="ml-2">{formatDate(selectedIncidencia.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Descripción</h4>
                  <p className="text-sm text-gray-600">{selectedIncidencia.descripcion}</p>
                </div>
                
                {!(selectedIncidencia as any).asignado && (
                  <button
                    onClick={() => asignarIncidencia(selectedIncidencia.id)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Asignarme esta incidencia
                  </button>
                )}
              </div>
              
              {/* Conversación */}
              <div className="lg:col-span-2">
                <div className="bg-gray-50 p-4 rounded-lg h-96 flex flex-col">
                  <h4 className="font-medium text-gray-900 mb-3">Conversación</h4>
                  
                  {/* Mensajes */}
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                    {respuestas.map((respuesta) => (
                      <div key={respuesta.id} className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {(respuesta as any).usuario?.nombre}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(respuesta.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{respuesta.contenido}</p>
                      </div>
                    ))}
                    
                    {respuestas.length === 0 && (
                      <div className="text-center py-8">
                        <MessageSquare className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">No hay respuestas aún</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Input para nueva respuesta */}
                  <div className="border-t pt-3">
                    <div className="flex space-x-3">
                      <div className="flex-1">
                        <textarea
                          value={nuevaRespuesta}
                          onChange={(e) => setNuevaRespuesta(e.target.value)}
                          placeholder="Escribe tu respuesta..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={2}
                        />
                      </div>
                      <button
                        onClick={enviarRespuesta}
                        disabled={!nuevaRespuesta.trim() || loadingRespuesta}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {loadingRespuesta ? 'Enviando...' : 'Enviar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Soporte