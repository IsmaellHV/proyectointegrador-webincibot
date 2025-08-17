import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  MessageSquare,
  Activity
} from 'lucide-react'
import { useAuthStore, useRole } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { DashboardMetrics } from '../types/database'

interface MetricCard {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

const Dashboard: React.FC = () => {
  const { user } = useAuthStore()
  const { isPersonal, isSoporte, isAdmin } = useRole()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentIncidencias, setRecentIncidencias] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Cargar métricas según el rol del usuario
      if (isPersonal) {
        await loadPersonalMetrics()
      } else {
        await loadGeneralMetrics()
      }
      
      await loadRecentIncidencias()
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPersonalMetrics = async () => {
    if (!user) return

    const { data: incidencias, error } = await supabase
      .from('incidencias')
      .select('*')
      .eq('usuario_id', user.id)

    if (error) {
      console.error('Error cargando incidencias personales:', error)
      return
    }

    const totalIncidencias = incidencias?.length || 0
    const abiertas = incidencias?.filter(i => i.estado === 'abierta').length || 0
    const enProgreso = incidencias?.filter(i => i.estado === 'en_progreso').length || 0
    const resueltas = incidencias?.filter(i => i.estado === 'resuelta').length || 0
    const cerradas = incidencias?.filter(i => i.estado === 'cerrada').length || 0

    setMetrics({
      totalIncidencias,
      incidenciasAbiertas: abiertas,
      incidenciasEnProgreso: enProgreso,
      incidenciasResueltas: resueltas,
      incidenciasCerradas: cerradas,
      incidenciasPorPrioridad: {
        baja: incidencias?.filter(i => i.prioridad === 'baja').length || 0,
        media: incidencias?.filter(i => i.prioridad === 'media').length || 0,
        alta: incidencias?.filter(i => i.prioridad === 'alta').length || 0,
        critica: incidencias?.filter(i => i.prioridad === 'critica').length || 0
      },
      promedioResolucion: 0
    })
  }

  const loadGeneralMetrics = async () => {
    const { data: incidencias, error } = await supabase
      .from('incidencias')
      .select('*')

    if (error) {
      console.error('Error cargando incidencias generales:', error)
      return
    }

    const totalIncidencias = incidencias?.length || 0
    const abiertas = incidencias?.filter(i => i.estado === 'abierta').length || 0
    const enProgreso = incidencias?.filter(i => i.estado === 'en_progreso').length || 0
    const resueltas = incidencias?.filter(i => i.estado === 'resuelta').length || 0
    const cerradas = incidencias?.filter(i => i.estado === 'cerrada').length || 0

    setMetrics({
      totalIncidencias,
      incidenciasAbiertas: abiertas,
      incidenciasEnProgreso: enProgreso,
      incidenciasResueltas: resueltas,
      incidenciasCerradas: cerradas,
      incidenciasPorPrioridad: {
        baja: incidencias?.filter(i => i.prioridad === 'baja').length || 0,
        media: incidencias?.filter(i => i.prioridad === 'media').length || 0,
        alta: incidencias?.filter(i => i.prioridad === 'alta').length || 0,
        critica: incidencias?.filter(i => i.prioridad === 'critica').length || 0
      },
      promedioResolucion: 0
    })
  }

  const loadRecentIncidencias = async () => {
    let query = supabase
      .from('incidencias')
      .select(`
        *,
        usuario:usuarios(nombre),
        categoria:categorias(nombre)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // Si es personal, solo mostrar sus incidencias
    if (isPersonal && user) {
      query = query.eq('usuario_id', user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error cargando incidencias recientes:', error)
      return
    }

    setRecentIncidencias(data || [])
  }

  const getMetricCards = (): MetricCard[] => {
    if (!metrics) return []

    const baseCards: MetricCard[] = [
      {
        title: 'Total Incidencias',
        value: metrics.totalIncidencias,
        icon: BarChart3,
        color: 'bg-blue-500'
      },
      {
        title: 'Abiertas',
        value: metrics.incidenciasAbiertas,
        icon: AlertTriangle,
        color: 'bg-yellow-500'
      },
      {
        title: 'En Progreso',
        value: metrics.incidenciasEnProgreso,
        icon: Clock,
        color: 'bg-orange-500'
      },
      {
        title: 'Resueltas',
        value: metrics.incidenciasResueltas,
        icon: CheckCircle,
        color: 'bg-green-500'
      }
    ]

    return baseCards
  }

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'critica':
        return 'bg-red-100 text-red-800'
      case 'alta':
        return 'bg-orange-100 text-orange-800'
      case 'media':
        return 'bg-yellow-100 text-yellow-800'
      case 'baja':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isPersonal ? 'Vista personal de tus incidencias' : 
             isSoporte ? 'Panel de control para soporte técnico' :
             'Panel de administración del sistema'}
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <span className="text-sm text-gray-500">
            Última actualización: {new Date().toLocaleString()}
          </span>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {getMetricCards().map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${card.color} p-3 rounded-md`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.title}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {card.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              {card.trend && (
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className={`font-medium ${
                      card.trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.trend.isPositive ? '+' : ''}{card.trend.value}%
                    </span>
                    <span className="text-gray-500"> vs mes anterior</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Gráficos y estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidencias por prioridad */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Incidencias por Prioridad</h3>
          <div className="space-y-3">
            {metrics && [
              { prioridad: 'critica', cantidad: metrics.incidenciasPorPrioridad.critica, color: 'bg-red-500' },
              { prioridad: 'alta', cantidad: metrics.incidenciasPorPrioridad.alta, color: 'bg-orange-500' },
              { prioridad: 'media', cantidad: metrics.incidenciasPorPrioridad.media, color: 'bg-yellow-500' },
              { prioridad: 'baja', cantidad: metrics.incidenciasPorPrioridad.baja, color: 'bg-green-500' }
            ].map(({ prioridad, cantidad, color }) => (
              <div key={prioridad} className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    getPriorityColor(prioridad)
                  }`}>
                    {prioridad}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">{cantidad}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {recentIncidencias.map((incidencia, index) => (
                <li key={incidencia.id}>
                  <div className="relative pb-8">
                    {index !== recentIncidencias.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                          <MessageSquare className="h-4 w-4 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">{incidencia.titulo}</span>
                          </p>
                          <div className="mt-1 flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              getEstadoColor(incidencia.estado)
                            }`}>
                              {incidencia.estado.replace('_', ' ')}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              getPriorityColor(incidencia.prioridad)
                            }`}>
                              {incidencia.prioridad}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {new Date(incidencia.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <MessageSquare className="h-8 w-8 text-blue-600 mr-3" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Crear Incidencia</p>
              <p className="text-xs text-gray-500">Usar chatbot</p>
            </div>
          </button>
          
          {(isSoporte || isAdmin) && (
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Activity className="h-8 w-8 text-green-600 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Atender Incidencias</p>
                <p className="text-xs text-gray-500">Panel de soporte</p>
              </div>
            </button>
          )}
          
          {isAdmin && (
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-8 w-8 text-purple-600 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">Gestionar Usuarios</p>
                <p className="text-xs text-gray-500">Administración</p>
              </div>
            </button>
          )}
          
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <BarChart3 className="h-8 w-8 text-orange-600 mr-3" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Ver Reportes</p>
              <p className="text-xs text-gray-500">Estadísticas</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard