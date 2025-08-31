import React, { useState, useEffect } from 'react'
import { Bot, MessageSquare, Plus, Clock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../store/authStore'
import Chat from '../components/Chat'
import type { ChatCategoria, Conversacion } from '../types/database'

const Chatbot: React.FC = () => {
  const { user } = useAuthStore()
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [conversacionActiva, setConversacionActiva] = useState<string | null>(null)
  const [mostrarListaConversaciones, setMostrarListaConversaciones] = useState(true)
  const [cargandoConversaciones, setCargandoConversaciones] = useState(false)
  const [categorias, setCategorias] = useState<ChatCategoria[]>([])

  // Datos de demostración
  const datosDemo = {
    categorias: [
      {
        id: '1',
        nombre: 'Soporte Técnico',
        descripcion: 'Problemas técnicos y de sistema',
        activa: true,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        nombre: 'Consultas Generales',
        descripcion: 'Preguntas generales sobre servicios',
        activa: true,
        created_at: new Date().toISOString()
      }
    ],
    conversaciones: [
      {
        id: '1',
        titulo: 'Problema con el sistema de login',
        estado: 'activa' as const,
        updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutos atrás
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hora atrás
        mensajes: [
          {
            id: '1-1',
            contenido: 'Hola, tengo problemas para acceder al sistema. No puedo hacer login.',
            tipo: 'usuario' as const,
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            usuario_id: 'demo-user'
          },
          {
            id: '1-2',
            contenido: 'Hola, entiendo tu problema. He registrado tu consulta como incidencia #123456. ¿Podrías decirme qué mensaje de error específico ves cuando intentas hacer login?',
            tipo: 'bot' as const,
            timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString()
          },
          {
            id: '1-3',
            contenido: 'Me aparece "Credenciales inválidas" pero estoy seguro de que mi contraseña es correcta.',
            tipo: 'usuario' as const,
            timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
            usuario_id: 'demo-user'
          },
          {
            id: '1-4',
            contenido: 'Perfecto, he actualizado la incidencia con esta información. Nuestro equipo técnico revisará tu caso. Mientras tanto, intenta restablecer tu contraseña desde el enlace "¿Olvidaste tu contraseña?"',
            tipo: 'bot' as const,
            timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString()
          }
        ]
      },
      {
        id: '2',
        titulo: 'Consulta sobre funcionalidades',
        estado: 'cerrada' as const,
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 día atrás
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
        mensajes: [
          {
            id: '2-1',
            contenido: '¿Podrían explicarme cómo funciona el sistema de reportes?',
            tipo: 'usuario' as const,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
            usuario_id: 'demo-user'
          },
          {
            id: '2-2',
            contenido: '¡Por supuesto! El sistema de reportes te permite generar informes detallados sobre incidencias. Puedes filtrar por fecha, categoría, estado y prioridad. ¿Te gustaría que te guíe paso a paso?',
            tipo: 'bot' as const,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24.5).toISOString()
          },
          {
            id: '2-3',
            contenido: 'Sí, por favor. Me interesa especialmente cómo exportar los datos.',
            tipo: 'usuario' as const,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24.3).toISOString(),
            usuario_id: 'demo-user'
          },
          {
            id: '2-4',
            contenido: 'Perfecto. Para exportar: 1) Ve a la sección "Reportes", 2) Selecciona los filtros deseados, 3) Haz clic en "Generar reporte", 4) Usa el botón "Exportar" para descargar en Excel o PDF. ¿Esto responde tu consulta?',
            tipo: 'bot' as const,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24.1).toISOString()
          },
          {
            id: '2-5',
            contenido: 'Perfecto, muchas gracias por la explicación. Todo muy claro.',
            tipo: 'usuario' as const,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            usuario_id: 'demo-user'
          }
        ]
      },
      {
        id: '3',
        titulo: 'Reporte de incidencia',
        estado: 'pendiente' as const,
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 horas atrás
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        mensajes: [
          {
            id: '3-1',
            contenido: 'Necesito reportar un problema crítico con el servidor de base de datos.',
            tipo: 'usuario' as const,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
            usuario_id: 'demo-user'
          },
          {
            id: '3-2',
            contenido: 'He detectado que tienes un problema técnico y he registrado tu consulta como incidencia #789012 (modo demostración).\n\n📋 **Detalles de la incidencia:**\n- **ID:** #789012\n- **Título:** Problema crítico con el servidor de base de datos\n- **Prioridad:** Alta\n- **Estado:** Pendiente\n\n¿Podrías proporcionar más detalles sobre el problema específico?',
            tipo: 'bot' as const,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.8).toISOString()
          },
          {
            id: '3-3',
            contenido: 'El servidor se desconecta cada 10 minutos aproximadamente y afecta a todos los usuarios.',
            tipo: 'usuario' as const,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(),
            usuario_id: 'demo-user'
          },
          {
            id: '3-4',
            contenido: 'Gracias por la información adicional. He actualizado la incidencia con estos detalles críticos. Dado que es un problema que afecta a múltiples usuarios, he escalado la prioridad a "Crítica". Nuestro equipo de infraestructura ha sido notificado inmediatamente.',
            tipo: 'bot' as const,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
          }
        ]
      }
    ]
  }

  // Cargar datos de demostración al montar el componente
  useEffect(() => {
    if (user) {
      setCategorias(datosDemo.categorias)
      setConversaciones(datosDemo.conversaciones)
    }
  }, [user])

  const cargarConversaciones = () => {
    // Simular carga de conversaciones con datos de demostración
    setConversaciones(datosDemo.conversaciones)
  }

  // Manejar selección de conversación
  const seleccionarConversacion = (conversacionId: string) => {
    // Encontrar la conversación seleccionada
    const conversacionSeleccionada = datosDemo.conversaciones.find(c => c.id === conversacionId)
    
    if (conversacionSeleccionada && conversacionSeleccionada.mensajes) {
      // Crear la estructura de conversación que espera el componente Chat
      const conversacionParaChat = {
        id: conversacionSeleccionada.id,
        titulo: conversacionSeleccionada.titulo,
        mensajes: conversacionSeleccionada.mensajes.map(mensaje => ({
          ...mensaje,
          created_at: mensaje.timestamp // El componente Chat espera created_at en lugar de timestamp
        })),
        usuario_id: user?.id || 'demo-user',
        created_at: conversacionSeleccionada.created_at
      }
      
      // Cargar los mensajes en localStorage para que el componente Chat los pueda leer
      const conversacionesExistentes = localStorage.getItem('chat_conversaciones')
      let conversaciones = conversacionesExistentes ? JSON.parse(conversacionesExistentes) : []
      
      // Verificar si la conversación ya existe en localStorage
      const indiceExistente = conversaciones.findIndex((c: any) => c.id === conversacionId)
      
      if (indiceExistente >= 0) {
        // Actualizar conversación existente
        conversaciones[indiceExistente] = conversacionParaChat
      } else {
        // Agregar nueva conversación
        conversaciones.push(conversacionParaChat)
      }
      
      // Guardar en localStorage
      localStorage.setItem('chat_conversaciones', JSON.stringify(conversaciones))
    }
    
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
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Conversaciones</h2>
              <button
                onClick={crearNuevaConversacion}
                className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shadow-sm border border-blue-200 hover:border-blue-300"
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
              <div className="p-6 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm mb-4">No tienes conversaciones aún</p>
                <button
                  onClick={crearNuevaConversacion}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
                >
                  Iniciar primera conversación
                </button>
              </div>
            ) : (
              <div className="p-3">
                {conversaciones.map((conversacion) => (
                  <button
                    key={conversacion.id}
                    onClick={() => seleccionarConversacion(conversacion.id)}
                    className="w-full p-4 mb-2 text-left hover:bg-gray-50 rounded-lg transition-colors border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md"
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
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={volverALista}
                    className="p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors lg:hidden border border-gray-200 hover:border-gray-300"
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
                  className="hidden lg:flex items-center space-x-2 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 hover:border-gray-300 shadow-sm"
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
                className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
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