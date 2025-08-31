import React, { useState, useEffect } from 'react'
import { BarChart3, Settings, Database, Users, MessageSquare, TrendingUp, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../store/authStore'
import type { Categoria } from '../types/database'

interface SystemStats {
  totalIncidencias: number
  incidenciasAbiertas: number
  incidenciasResueltas: number
  totalUsuarios: number
  usuariosActivos: number
  totalCategorias: number
  promedioResolucion: number
}

interface CategoryStats {
  categoria: string
  total: number
  abiertas: number
  resueltas: number
}

// Datos de demostración
const DEMO_CATEGORIAS: Categoria[] = [
  {
    id: '1',
    nombre: 'Hardware',
    descripcion: 'Problemas con equipos físicos',
    activa: true,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    nombre: 'Software',
    descripcion: 'Problemas con aplicaciones y sistemas operativos',
    activa: true,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '3',
    nombre: 'Red',
    descripcion: 'Problemas de conectividad y red',
    activa: true,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '4',
    nombre: 'Seguridad',
    descripcion: 'Incidentes de seguridad informática',
    activa: false,
    created_at: '2024-01-15T10:00:00Z'
  }
]

const DEMO_STATS: SystemStats = {
  totalIncidencias: 45,
  incidenciasAbiertas: 12,
  incidenciasResueltas: 33,
  totalUsuarios: 25,
  usuariosActivos: 22,
  totalCategorias: 4,
  promedioResolucion: 2.5
}

const DEMO_CATEGORY_STATS: CategoryStats[] = [
  { categoria: 'Hardware', total: 18, abiertas: 5, resueltas: 13 },
  { categoria: 'Software', total: 15, abiertas: 4, resueltas: 11 },
  { categoria: 'Red', total: 8, abiertas: 2, resueltas: 6 },
  { categoria: 'Seguridad', total: 4, abiertas: 1, resueltas: 3 }
]

const Admin: React.FC = () => {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<SystemStats>(DEMO_STATS)
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>(DEMO_CATEGORY_STATS)
  const [categorias, setCategorias] = useState<Categoria[]>(DEMO_CATEGORIAS)
  const [loading, setLoading] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    nombre: '',
    descripcion: '',
    activa: true
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Los datos ya están cargados desde DEMO_STATS, DEMO_CATEGORY_STATS y DEMO_CATEGORIAS
      toast.success('Datos actualizados')
    } catch (error) {
      console.error('Error loading admin data:', error)
      toast.error('Error al cargar los datos del panel')
    } finally {
      setLoading(false)
    }
  }

  // Funciones convertidas a modo demo - ya no necesarias pero mantenidas para compatibilidad
  const loadSystemStats = async () => {
    // Los datos ya están cargados desde DEMO_STATS
  }

  const loadCategoryStats = async () => {
    // Los datos ya están cargados desde DEMO_CATEGORY_STATS
  }

  const loadCategorias = async () => {
    // Los datos ya están cargados desde DEMO_CATEGORIAS
  }

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!categoryForm.nombre.trim()) {
      toast.error('El nombre de la categoría es requerido')
      return
    }

    try {
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 300))
      
      if (editingCategory) {
        // Actualizar categoría existente
        const updatedCategorias = categorias.map(cat => 
          cat.id === editingCategory.id 
            ? {
                ...cat,
                nombre: categoryForm.nombre.trim(),
                descripcion: categoryForm.descripcion.trim(),
                activa: categoryForm.activa
              }
            : cat
        )
        setCategorias(updatedCategorias)
        toast.success('Categoría actualizada exitosamente')
      } else {
        // Verificar si ya existe una categoría con ese nombre
        const existeCategoria = categorias.some(cat => 
          cat.nombre.toLowerCase() === categoryForm.nombre.trim().toLowerCase()
        )
        
        if (existeCategoria) {
          toast.error('Ya existe una categoría con ese nombre')
          return
        }
        
        // Crear nueva categoría
        const newCategory: Categoria = {
          id: (categorias.length + 1).toString(),
          nombre: categoryForm.nombre.trim(),
          descripcion: categoryForm.descripcion.trim(),
          activa: categoryForm.activa,
          created_at: new Date().toISOString()
        }
        
        setCategorias([...categorias, newCategory])
        toast.success('Categoría creada exitosamente')
      }

      closeCategoryModal()
    } catch (error: any) {
      console.error('Error saving category:', error)
      toast.error('Error al guardar la categoría')
    }
  }

  const deleteCategory = async (categoria: Categoria) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoria.nombre}"?`)) {
      return
    }

    try {
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Verificar si la categoría tiene incidencias asociadas (simulado)
      const categoryStats = DEMO_CATEGORY_STATS.find(stat => stat.categoria === categoria.nombre)
      if (categoryStats && categoryStats.total > 0) {
        toast.error('No se puede eliminar la categoría porque tiene incidencias asociadas')
        return
      }
      
      // Eliminar categoría
      const updatedCategorias = categorias.filter(cat => cat.id !== categoria.id)
      setCategorias(updatedCategorias)
      
      // Actualizar estadísticas de categorías
      const updatedCategoryStats = DEMO_CATEGORY_STATS.filter(stat => stat.categoria !== categoria.nombre)
      setCategoryStats(updatedCategoryStats)
      
      toast.success('Categoría eliminada exitosamente')
    } catch (error: any) {
      console.error('Error deleting category:', error)
      toast.error('Error al eliminar la categoría')
    }
  }

  const openCategoryModal = (categoria?: Categoria) => {
    if (categoria) {
      setEditingCategory(categoria)
      setCategoryForm({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || '',
        activa: categoria.activa
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({
        nombre: '',
        descripcion: '',
        activa: true
      })
    }
    setShowCategoryModal(true)
  }

  const closeCategoryModal = () => {
    setShowCategoryModal(false)
    setEditingCategory(null)
    setCategoryForm({
      nombre: '',
      descripcion: '',
      activa: true
    })
  }

  const exportData = async () => {
    try {
      toast.info('Preparando exportación...')
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Datos de demostración para exportar
      const demoIncidencias = [
        {
          id: '1',
          titulo: 'Problema con impresora',
          descripcion: 'La impresora no responde',
          estado: 'abierta',
          prioridad: 'media',
          categoria: 'Hardware',
          usuario: 'Juan Pérez',
          asignado: 'Ana García',
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        },
        {
          id: '2',
          titulo: 'Error en sistema',
          descripcion: 'El sistema se cierra inesperadamente',
          estado: 'en_progreso',
          prioridad: 'alta',
          categoria: 'Software',
          usuario: 'María López',
          asignado: 'Carlos Ruiz',
          created_at: '2024-01-14',
          updated_at: '2024-01-16'
        },
        {
          id: '3',
          titulo: 'Conexión lenta',
          descripcion: 'La conexión a internet está muy lenta',
          estado: 'resuelta',
          prioridad: 'baja',
          categoria: 'Red',
          usuario: 'Pedro Martín',
          asignado: 'Ana García',
          created_at: '2024-01-13',
          updated_at: '2024-01-17'
        }
      ]

      // Convertir a CSV
      const csvHeaders = [
        'ID', 'Título', 'Descripción', 'Estado', 'Prioridad', 'Categoría',
        'Usuario', 'Asignado', 'Fecha Creación', 'Última Actualización'
      ]
      
      const csvRows = demoIncidencias.map(inc => [
        inc.id,
        `"${inc.titulo}"`,
        `"${inc.descripcion}"`,
        inc.estado,
        inc.prioridad,
        inc.categoria,
        inc.usuario,
        inc.asignado,
        inc.created_at,
        inc.updated_at
      ])

      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n')
      
      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `incidencias_demo_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Datos exportados exitosamente')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Error al exportar los datos')
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configuración y estadísticas del sistema
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={loadData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </button>
          <button
            onClick={exportData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Datos
          </button>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Incidencias</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalIncidencias}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Incidencias Abiertas</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.incidenciasAbiertas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Usuarios Activos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.usuariosActivos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Promedio Resolución</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.promedioResolucion} días</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Estadísticas por Categoría</h2>
          <button
            onClick={() => openCategoryModal()}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            Nueva Categoría
          </button>
        </div>
        
        {categoryStats.length === 0 ? (
          <div className="text-center py-8">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos</h3>
            <p className="mt-1 text-sm text-gray-500">Aún no hay incidencias registradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abiertas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resueltas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasa de Resolución
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryStats.map((stat, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stat.categoria}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.abiertas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.resueltas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.total > 0 ? Math.round((stat.resueltas / stat.total) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Management */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Gestión de Categorías</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorias.map((categoria) => (
            <div key={categoria.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{categoria.nombre}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  categoria.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {categoria.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              
              {categoria.descripcion && (
                <p className="text-sm text-gray-600 mb-3">{categoria.descripcion}</p>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={() => openCategoryModal(categoria)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteCategory(categoria)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                <button
                  onClick={closeCategoryModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={saveCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={categoryForm.nombre}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre de la categoría"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={categoryForm.descripcion}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción de la categoría"
                    rows={3}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={categoryForm.activa}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, activa: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                    Categoría activa
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeCategoryModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingCategory ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin