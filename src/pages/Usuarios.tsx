import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit3, Trash2, UserCheck, UserX, Mail, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import type { Usuario } from '../types/database'

interface UsuarioForm {
  nombre: string
  email: string
  rol: 'personal' | 'soporte' | 'administrador'
  activo: boolean
}



const Usuarios: React.FC = () => {
  const { user } = useAuthStore()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRol, setSelectedRol] = useState('todos')
  const [selectedEstado, setSelectedEstado] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [formData, setFormData] = useState<UsuarioForm>({
    nombre: '',
    email: '',
    rol: 'personal',
    activo: true
  })
  const [formErrors, setFormErrors] = useState<Partial<UsuarioForm>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadUsuarios()
  }, [])

  const loadUsuarios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error loading users:', error)
        toast.error('Error al cargar los usuarios')
        return
      }
      
      setUsuarios(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = async (): Promise<boolean> => {
    const errors: Partial<UsuarioForm> = {}

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido'
    }

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El email no es válido'
    } else if (!formData.email.endsWith('@empresa.com')) {
      errors.email = 'Debe usar un email corporativo (@empresa.com)'
    } else {
      // Verificar email único en la base de datos
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('id')
          .eq('email', formData.email.trim().toLowerCase())
          .single()
        
        if (!error && data && (!editingUser || data.id !== editingUser.id)) {
          errors.email = 'Este email ya está registrado'
        }
      } catch (error) {
        // Si no encuentra el email, está disponible
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!(await validateForm())) return

    setSubmitting(true)
    
    try {
      if (editingUser) {
        // Actualizar usuario existente
        const { error } = await supabase
          .from('usuarios')
          .update({
            nombre: formData.nombre.trim(),
            email: formData.email.trim().toLowerCase(),
            rol: formData.rol,
            activo: formData.activo,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id)
        
        if (error) {
          console.error('Error updating user:', error)
          toast.error('Error al actualizar el usuario')
          return
        }
        
        toast.success('Usuario actualizado exitosamente')
      } else {
        // Crear nuevo usuario
        const { error } = await supabase
          .from('usuarios')
          .insert({
            nombre: formData.nombre.trim(),
            email: formData.email.trim().toLowerCase(),
            rol: formData.rol,
            password_hash: '$2b$10$demo.hash.for.new.user',
            activo: formData.activo
          })
        
        if (error) {
          console.error('Error creating user:', error)
          toast.error('Error al crear el usuario')
          return
        }
        
        toast.success('Usuario creado exitosamente')
      }

      // Recargar la lista de usuarios
      await loadUsuarios()
      closeModal()
    } catch (error: any) {
      console.error('Error saving user:', error)
      toast.error('Error al guardar el usuario')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleUserStatus = async (usuario: Usuario) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          activo: !usuario.activo,
          updated_at: new Date().toISOString()
        })
        .eq('id', usuario.id)
      
      if (error) {
        console.error('Error toggling user status:', error)
        toast.error('Error al cambiar el estado del usuario')
        return
      }
      
      // Recargar la lista de usuarios
      await loadUsuarios()
      toast.success(`Usuario ${!usuario.activo ? 'activado' : 'desactivado'} exitosamente`)
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error('Error al cambiar el estado del usuario')
    }
  }

  const deleteUser = async (usuario: Usuario) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${usuario.nombre}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', usuario.id)
      
      if (error) {
        console.error('Error deleting user:', error)
        toast.error('Error al eliminar el usuario')
        return
      }
      
      // Recargar la lista de usuarios
      await loadUsuarios()
      toast.success('Usuario eliminado exitosamente')
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast.error('Error al eliminar el usuario')
    }
  }

  const openModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUser(usuario)
      setFormData({
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo
      })
    } else {
      setEditingUser(null)
      setFormData({
        nombre: '',
        email: '',
        rol: 'personal',
        activo: true
      })
    }
    setFormErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({
      nombre: '',
      email: '',
      rol: 'personal',
      activo: true
    })
    setFormErrors({})
  }

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'administrador':
        return 'bg-red-100 text-red-800'
      case 'soporte':
        return 'bg-blue-100 text-blue-800'
      case 'personal':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRolIcon = (rol: string) => {
    switch (rol) {
      case 'administrador':
        return <Shield className="h-4 w-4" />
      case 'soporte':
        return <UserCheck className="h-4 w-4" />
      case 'personal':
        return <Mail className="h-4 w-4" />
      default:
        return <Mail className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRol = selectedRol === 'todos' || usuario.rol === selectedRol
    const matchesEstado = selectedEstado === 'todos' || 
                         (selectedEstado === 'activo' && usuario.activo) ||
                         (selectedEstado === 'inactivo' && !usuario.activo)
    
    return matchesSearch && matchesRol && matchesEstado
  })

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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra los usuarios del sistema y sus permisos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => openModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Administradores</p>
              <p className="text-2xl font-semibold text-gray-900">
                {usuarios.filter(u => u.rol === 'administrador').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCheck className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Soporte</p>
              <p className="text-2xl font-semibold text-gray-900">
                {usuarios.filter(u => u.rol === 'soporte').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Mail className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Personal</p>
              <p className="text-2xl font-semibold text-gray-900">
                {usuarios.filter(u => u.rol === 'personal').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserX className="h-8 w-8 text-gray-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Inactivos</p>
              <p className="text-2xl font-semibold text-gray-900">
                {usuarios.filter(u => !u.activo).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <select
              value={selectedRol}
              onChange={(e) => setSelectedRol(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los roles</option>
              <option value="administrador">Administrador</option>
              <option value="soporte">Soporte</option>
              <option value="personal">Personal</option>
            </select>
          </div>

          <div>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {filteredUsuarios.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedRol !== 'todos' || selectedEstado !== 'todos'
                ? 'No se encontraron usuarios con los filtros aplicados.'
                : 'Aún no hay usuarios registrados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {usuario.nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{usuario.nombre}</div>
                          <div className="text-sm text-gray-500">{usuario.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRolIcon(usuario.rol)}
                        <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRolColor(usuario.rol)}`}>
                          {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(usuario.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openModal(usuario)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar usuario"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => toggleUserStatus(usuario)}
                          className={`${usuario.activo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {usuario.activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        
                        {usuario.id !== user?.id && (
                          <button
                            onClick={() => deleteUser(usuario)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.nombre ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ingresa el nombre completo"
                  />
                  {formErrors.nombre && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email corporativo
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="usuario@empresa.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData(prev => ({ ...prev, rol: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="personal">Personal</option>
                    <option value="soporte">Soporte</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                    Usuario activo
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {submitting ? 'Guardando...' : (editingUser ? 'Actualizar' : 'Crear')}
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

export default Usuarios