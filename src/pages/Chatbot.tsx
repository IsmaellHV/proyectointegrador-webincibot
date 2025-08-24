import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import type { ChatMessage, ChatCategoria } from '../types/database'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const Chatbot: React.FC = () => {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: '¡Hola! Soy tu asistente virtual de INCIBOT. Puedo ayudarte a reportar problemas técnicos, consultar el estado de tus incidencias o responder preguntas frecuentes. ¿En qué puedo ayudarte hoy?',
      sender: 'bot' as const,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [categorias, setCategorias] = useState<ChatCategoria[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategorias()
  }, [])

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user' as const,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Simular respuesta del chatbot (aquí iría la integración con OpenAI)
      const botResponse = await generateBotResponse(userMessage.content)
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: 'bot' as const,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Error al enviar el mensaje. Por favor, intenta nuevamente.')
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Lo siento, ha ocurrido un error. Por favor, intenta nuevamente o contacta al soporte técnico.',
        sender: 'bot' as const,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateBotResponse = async (userInput: string): Promise<string> => {
    // Aquí iría la integración real con OpenAI API
    // Por ahora, simulamos respuestas inteligentes basadas en palabras clave
    
    const input = userInput.toLowerCase()
    
    // Detectar intención de crear incidencia
    if (input.includes('problema') || input.includes('error') || input.includes('falla') || 
        input.includes('no funciona') || input.includes('incidencia') || input.includes('reportar')) {
      
      // Simular creación de incidencia
      const incidenciaCreada = await crearIncidencia(userInput)
      
      if (incidenciaCreada) {
        return `He registrado tu incidencia con el ID #${incidenciaCreada.id}. \n\n**Detalles:**\n- **Título:** ${incidenciaCreada.titulo}\n- **Categoría:** ${incidenciaCreada.categoria}\n- **Prioridad:** ${incidenciaCreada.prioridad}\n- **Estado:** Abierta\n\nNuestro equipo de soporte la revisará pronto. Recibirás notificaciones sobre cualquier actualización.`
      }
    }
    
    // Respuestas para consultas de estado
    if (input.includes('estado') || input.includes('seguimiento') || input.includes('actualización')) {
      return 'Para consultar el estado de tus incidencias, puedes ir a la sección "Mis Incidencias" en el menú lateral. Allí encontrarás todas tus incidencias con su estado actual y actualizaciones.'
    }
    
    // Respuestas para ayuda general
    if (input.includes('ayuda') || input.includes('cómo') || input.includes('help')) {
      return 'Puedo ayudarte con:\n\n• **Reportar incidencias:** Describe tu problema y yo lo registraré automáticamente\n• **Consultar estado:** Te guío para revisar tus incidencias\n• **Preguntas frecuentes:** Respondo dudas comunes\n• **Contacto:** Te proporciono información de contacto\n\n¿Qué necesitas hacer?'
    }
    
    // Respuesta por defecto
    return 'Entiendo tu consulta. Para brindarte la mejor ayuda, ¿podrías ser más específico sobre el problema que estás experimentando? Por ejemplo, puedes describir:\n\n• Qué sistema o aplicación está fallando\n• Qué error específico estás viendo\n• Cuándo comenzó el problema\n• Qué pasos has intentado para solucionarlo'
  }

  const crearIncidencia = async (descripcion: string): Promise<any> => {
    try {
      // Determinar categoría y prioridad basada en el contenido
      const categoria = determinarCategoria(descripcion)
      const prioridad = determinarPrioridad(descripcion)
      const titulo = generarTitulo(descripcion)

      const { data, error } = await supabase
        .from('incidencias')
        .insert({
          titulo,
          descripcion,
          categoria_id: Number(categoria.id),
          prioridad,
          estado: 'abierta',
          usuario_id: user?.id,
          usuario_reporta: user?.id
        })
        .select(`
          *,
          categoria:categorias(nombre)
        `)
        .single()

      if (error) throw error

      toast.success(`Incidencia #${data.id} creada exitosamente`)
      
      return {
        id: data.id,
        titulo: data.titulo,
        categoria: data.categoria?.nombre || 'General',
        prioridad: data.prioridad
      }
    } catch (error) {
      console.error('Error creating incident:', error)
      toast.error('Error al crear la incidencia')
      return null
    }
  }

  const determinarCategoria = (descripcion: string): ChatCategoria => {
    const desc = descripcion.toLowerCase()
    
    // Buscar palabras clave para determinar categoría
    if (desc.includes('red') || desc.includes('internet') || desc.includes('wifi') || desc.includes('conexión')) {
      return categorias.find(c => c.nombre.toLowerCase().includes('red')) || categorias[0]
    }
    if (desc.includes('software') || desc.includes('aplicación') || desc.includes('programa') || desc.includes('sistema')) {
      return categorias.find(c => c.nombre.toLowerCase().includes('software')) || categorias[0]
    }
    if (desc.includes('hardware') || desc.includes('computadora') || desc.includes('monitor') || desc.includes('teclado') || desc.includes('mouse')) {
      return categorias.find(c => c.nombre.toLowerCase().includes('hardware')) || categorias[0]
    }
    if (desc.includes('email') || desc.includes('correo') || desc.includes('outlook') || desc.includes('gmail')) {
      return categorias.find(c => c.nombre.toLowerCase().includes('email')) || categorias[0]
    }
    
    // Categoría por defecto
    return categorias.find(c => c.nombre.toLowerCase().includes('general')) || categorias[0] || {
      id: 1,
      nombre: 'General',
      descripcion: 'Categoría general',
      activa: true,
      created_at: new Date().toISOString()
    }
  }

  const determinarPrioridad = (descripcion: string): 'baja' | 'media' | 'alta' | 'critica' => {
    const desc = descripcion.toLowerCase()
    
    if (desc.includes('urgente') || desc.includes('crítico') || desc.includes('no puedo trabajar') || desc.includes('sistema caído')) {
      return 'critica'
    }
    if (desc.includes('importante') || desc.includes('afecta') || desc.includes('bloquea')) {
      return 'alta'
    }
    if (desc.includes('lento') || desc.includes('molesto') || desc.includes('ocasional')) {
      return 'media'
    }
    
    return 'media' // Prioridad por defecto
  }

  const generarTitulo = (descripcion: string): string => {
    // Generar un título conciso basado en la descripción
    const palabras = descripcion.split(' ').slice(0, 8)
    let titulo = palabras.join(' ')
    
    if (titulo.length > 50) {
      titulo = titulo.substring(0, 47) + '...'
    }
    
    return titulo || 'Incidencia reportada via chatbot'
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500 p-2 rounded-full">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Asistente Virtual</h1>
            <p className="text-blue-100 text-sm">INCIBOT - Gestión inteligente de incidencias</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.sender === 'user'
                  ? 'bg-gray-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {message.sender === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              <div
                className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-gray-300' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">Escribiendo...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-gray-50 p-4">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe tu problema o haz una pregunta..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        
        {/* Help text */}
        <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
          <AlertCircle className="h-3 w-3" />
          <span>Presiona Enter para enviar, Shift+Enter para nueva línea</span>
        </div>
      </div>
    </div>
  )
}

export default Chatbot