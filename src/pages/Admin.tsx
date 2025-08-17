import React, { useState, useEffect } from 'react'
import { BarChart3, Settings, Database, Users, MessageSquare, TrendingUp, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
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

const Admin: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalIncidencias: 0,
    incidenciasAbiertas: 0,
    incidenciasResueltas: 0,
    totalUsuarios: 0,
    usuariosActivos: 0,
    totalCategorias: 0,
    promedioResolucion: 0
  })
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    nombre: '',
    descripcion: '',
    activa: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([
        loadSystemStats(),
        loadCategoryStats(),
        loadCategorias()
      ])
    } catch (error) {
      console.error('Error loading admin data:', error)
      toast.error('Error al cargar los datos del panel')
    } finally {
      setLoading(false)
    }
  }

  const loadSystemStats = async () => {
    try {
      // Obtener estadísticas de incidencias
      const { data: incidencias, error: incidenciasError } = await supabase
        .from('incidencias')
        .select('estado, created_at, updated_at')

      if (incidenciasError) throw incidenciasError

      // Obtener estadísticas de usuarios
      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('activo')

      if (usuariosError) throw usuariosError

      // Obtener estadísticas de categorías
      const { data: categorias, error: categoriasError } = await supabase
        .from('categorias')
        .select('activo')

      if (categoriasError) throw categoriasError

      // Calcular estadísticas
      const totalIncidencias = incidencias?.length || 0
      const incidenciasAbiertas = incidencias?.filter(i => i.estado === 'abierta' || i.estado === 'en_progreso').length || 0
      const incidenciasResueltas = incidencias?.filter(i => i.estado === 'resuelta' || i.estado === 'cerrada').length || 0
      const totalUsuarios = usuarios?.length || 0
      const usuariosActivos = usuarios?.filter(u => u.activo).length || 0
      const totalCategorias = categorias?.length || 0

      // Calcular promedio de resolución (días)
      const incidenciasConResolucion = incidencias?.filter(i => 
        (i.estado === 'resuelta' || i.estado === 'cerrada') && i.updated_at
      ) || []
      
      let promedioResolucion = 0
      if (incidenciasConResolucion.length > 0) {
        const tiemposResolucion = incidenciasConResolucion.map(i => {
          const created = new Date(i.created_at)
          const resolved = new Date(i.updated_at)
          return (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) // días
        })
        promedioResolucion = tiemposResolucion.reduce((a, b) => a + b, 0) / tiemposResolucion.length
      }

      setStats({
        totalIncidencias,
        incidenciasAbiertas,
        incidenciasResueltas,
        totalUsuarios,
        usuariosActivos,
        totalCategorias,
        promedioResolucion: Math.round(promedioResolucion * 10) / 10
      })
    } catch (error) {
      console.error('Error loading system stats:', error)
    }
  }

  const loadCategoryStats = async () => {
    try {
      const { data, error } = await supabase
        .from('incidencias')
        .select(`
          estado,
          categorias(nombre)
        `)

      if (error) throw error

      // Agrupar por categoría
      const categoryMap = new Map<string, { total: number; abiertas: number; resueltas: number }>()
      
      data?.forEach(incidencia => {
        const categoria = (incidencia as any).categorias?.nombre || 'Sin categoría'
        const current = categoryMap.get(categoria) || { total: 0, abiertas: 0, resueltas: 0 }
        
        current.total++
        if (incidencia.estado === 'abierta' || incidencia.estado === 'en_progreso') {
          current.abiertas++
        } else if (incidencia.estado === 'resuelta' || incidencia.estado === 'cerrada') {
          current.resueltas++
        }
        
        categoryMap.set(categoria, current)
      })

      const categoryStatsArray = Array.from(categoryMap.entries()).map(([categoria, stats]) => ({
        categoria,
        ...stats
      }))

      setCategoryStats(categoryStatsArray)
    } catch (error) {
      console.error('Error loading category stats:', error)
    }
  }

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre')

      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!categoryForm.nombre.trim()) {
      toast.error('El nombre de la categoría es requerido')
      return
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categorias')
          .update({
            nombre: categoryForm.nombre.trim(),
            descripcion: categoryForm.descripcion.trim(),
            activa: categoryForm.activa,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCategory.id)

        if (error) throw error
        toast.success('Categoría actualizada exitosamente')
      } else {
        const { error } = await supabase
          .from('categorias')
          .insert({
            nombre: categoryForm.nombre.trim(),
            descripcion: categoryForm.descripcion.trim(),
            activa: categoryForm.activa
          })

        if (error) throw error
        toast.success('Categoría creada exitosamente')
      }

      loadCategorias()
      loadCategoryStats()
      closeCategoryModal()
    } catch (error: any) {
      console.error('Error saving category:', error)
      if (error.code === '23505') {
        toast.error('Ya existe una categoría con ese nombre')
      } else {
        toast.error('Error al guardar la categoría')
      }
    }
  }

  const deleteCategory = async (categoria: Categoria) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoria.nombre}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', categoria.id)

      if (error) throw error

      toast.success('Categoría eliminada exitosamente')
      loadCategorias()
      loadCategoryStats()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      if (error.code === '23503') {
        toast.error('No se puede eliminar la categoría porque tiene incidencias asociadas')
      } else {
        toast.error('Error al eliminar la categoría')
      }
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
      
      // Obtener todos los datos
      const { data: incidencias, error } = await supabase
        .from('incidencias')
        .select(`
          *,
          categorias(nombre),
          usuario:usuarios!incidencias_usuario_id_fkey(nombre, email),
          asignado:usuarios!incidencias_asignado_a_fkey(nombre, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Convertir a CSV
      const csvHeaders = [
        'ID', 'Título', 'Descripción', 'Estado', 'Prioridad', 'Categoría',
        'Usuario', 'Asignado', 'Fecha Creación', 'Última Actualización'
      ]
      
      const csvRows = incidencias?.map(inc => [
        inc.id,
        `"${inc.titulo}"`,
        `"${inc.descripcion}"`,
        inc.estado,
        inc.prioridad,
        (inc as any).categorias?.nombre || '',
        (inc as any).usuario?.nombre || '',
        (inc as any).asignado?.nombre || '',
        new Date(inc.created_at).toLocaleDateString('es-ES'),
        new Date(inc.updated_at).toLocaleDateString('es-ES')
      ]) || []

      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n')
      
      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `incidencias_${new Date().toISOString().split('T')[0]}.csv`)
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