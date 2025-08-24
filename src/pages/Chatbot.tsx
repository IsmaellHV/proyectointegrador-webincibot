import React, { useState, useEffect } from 'react'
import { Bot, MessageSquare, Plus, Clock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import Chat from '../components/Chat'
import { obtenerConversacionesUsuario } from '../lib/supabase'
import type { ChatCategoria, Conversacion } from '../types/database'

const Chatbot: React.FC = () => {
  const { user } = useAuthStore()
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [conversacionActiva, setConversacionActiva] = useState<string | null>(null)
  const [mostrarListaConversaciones, setMostrarListaConversaciones] = useState(true)
  const [cargandoConversaciones, setCargandoConversaciones] = useState(false)
  const [categorias, setCategorias] = useState<ChatCategoria[]>([])

  // Cargar datos al montar el componente
  useEffect(() => {
    if (user) {
      loadCategorias()
      cargarConversaciones()
    }
  }, [user])

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nombre, descripcion, activa, created_at')
        .eq('activo', true)
        .order('nombre')

      if (error) throw error
      setCategorias(data?.map(cat => ({
        id: cat.id,
        nombre: cat.nombre,
        descripcion: cat.descripcion,
        activa: cat.activa,
        created_at: cat.created_at
      })) || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const cargarConversaciones = async () => {
    if (!user) return
    
    try {
      setCargandoConversaciones(true)
      const conversacionesData = await obtenerConversacionesUsuario(user.id)
      setConversaciones(conversacionesData)
    } catch (error) {
      console.error('Error cargando conversaciones:', error)
      toast.error('Error al cargar las conversaciones')
    } finally {
      setCargandoConversaciones(false)
    }
  }

  // Manejar selección de conversación
  const seleccionarConversacion = (conversacionId: string) => {
    setConversacionActiva(conversacionId)
    setMostrarListaConversaciones(false)
  }

  // Crear nueva conversación
  const crearNuevaConversacion = () => {
    setConversacionActiva(null)
    setMostrarListaConversaciones(false)
  }

  // Manejar cuando se crea una nueva conversación
  const handleConversacionCreada = (conversacionId: string) => {
    setConversacionActiva(conversacionId)
    cargarConversaciones() // Recargar la lista
  }

  // Volver a la lista de conversaciones
  const volverALista = () => {
    setMostrarListaConversaciones(true)
    setConversacionActiva(null)
  }

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha)
    const ahora = new Date()
    const diferencia = ahora.getTime() - date.getTime()
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))
    
    if (dias === 0) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    } else if (dias === 1) {
      return 'Ayer'
    } else if (dias < 7) {
      return `Hace ${dias} días`
    } else {
      return date.toLocaleDateString('es-ES')
    }
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Bot className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Requerido</h2>
          <p className="text-gray-600">Debes iniciar sesión para usar el chatbot.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar - Lista de conversaciones */}
      {mostrarListaConversaciones && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header del sidebar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Conversaciones</h2>
              <button
                onClick={crearNuevaConversacion}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Nueva conversación"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Lista de conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {cargandoConversaciones ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : conversaciones.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No tienes conversaciones aún</p>
                <button
                  onClick={crearNuevaConversacion}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Iniciar primera conversación
                </button>
              </div>
            ) : (
              <div className="p-2">
                {conversaciones.map((conversacion) => (
                  <button
                    key={conversacion.id}
                    onClick={() => seleccionarConversacion(conversacion.id)}
                    className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {conversacion.titulo}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            conversacion.estado === 'activa' 
                              ? 'bg-green-100 text-green-800'
                              : conversacion.estado === 'cerrada'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {conversacion.estado === 'activa' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {conversacion.estado === 'cerrada' && <Clock className="h-3 w-3 mr-1" />}
                            {conversacion.estado}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 ml-2">
                        {formatearFecha(conversacion.updated_at)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Área principal - Chat */}
      <div className="flex-1 flex flex-col">
        {!mostrarListaConversaciones ? (
          <>
            {/* Header del chat */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={volverALista}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                  >
                    ←
                  </button>
                  <div className="flex items-center space-x-2">
                    <Bot className="h-6 w-6 text-blue-600" />
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900">Asistente Virtual INCIBOT</h1>
                      <p className="text-sm text-gray-500">Gestión inteligente de incidencias</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={volverALista}
                  className="hidden lg:flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">Ver conversaciones</span>
                </button>
              </div>
            </div>

            {/* Componente Chat */}
            <div className="flex-1">
              <Chat
                conversacionId={conversacionActiva || undefined}
                onConversacionCreada={handleConversacionCreada}
              />
            </div>
          </>
        ) : (
          /* Vista de bienvenida cuando se muestra la lista */
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center max-w-md">
              <Bot className="h-20 w-20 mx-auto text-blue-600 mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Bienvenido al Asistente Virtual</h2>
              <p className="text-gray-600 mb-6">
                Selecciona una conversación existente o inicia una nueva para comenzar a chatear con nuestro asistente inteligente.
              </p>
              <button
                onClick={crearNuevaConversacion}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Nueva Conversación</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chatbot