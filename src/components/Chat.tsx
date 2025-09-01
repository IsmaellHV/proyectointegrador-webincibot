import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Clock, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
// Importaciones de Supabase removidas para versión demo

// Tipos simplificados para el chat demo
interface MensajeDemo {
  id: string;
  contenido: string;
  tipo: 'usuario' | 'bot' | 'sistema';
  timestamp: string;
  usuario_id?: string;
  categoria?: string;
  esBienvenida?: boolean;
  esSeleccionCategoria?: boolean;
}

type CategoriaIncidente = 'Hardware' | 'Software' | 'Red' | 'Seguridad';

interface EstadoChat {
  mostrarBienvenida: boolean;
  mostrarCategorias: boolean;
  categoriaSeleccionada: CategoriaIncidente | null;
  conversacionIniciada: boolean;
}

interface ConversacionDemo {
  id: string;
  titulo: string;
  mensajes: MensajeDemo[];
  usuario_id: string;
  created_at: string;
}

interface ChatProps {
  conversacionId?: string;
  onConversacionCreada?: (conversacionId: string) => void;
}

// Funciones locales para simular el chat
const obtenerConversacionesLocal = (): ConversacionDemo[] => {
  const conversaciones = localStorage.getItem('chat_conversaciones');
  return conversaciones ? JSON.parse(conversaciones) : [];
};

const guardarConversacionesLocal = (conversaciones: ConversacionDemo[]) => {
  localStorage.setItem('chat_conversaciones', JSON.stringify(conversaciones));
};

const crearConversacionLocal = (usuarioId: string, titulo: string): ConversacionDemo => {
  const nuevaConversacion: ConversacionDemo = {
    id: Date.now().toString(),
    titulo,
    mensajes: [],
    usuario_id: usuarioId,
    created_at: new Date().toISOString()
  };
  
  const conversaciones = obtenerConversacionesLocal();
  conversaciones.push(nuevaConversacion);
  guardarConversacionesLocal(conversaciones);
  
  return nuevaConversacion;
};

const agregarMensajeLocal = (conversacionId: string, mensaje: MensajeDemo) => {
  const conversaciones = obtenerConversacionesLocal();
  const conversacion = conversaciones.find(c => c.id === conversacionId);
  
  if (conversacion) {
    conversacion.mensajes.push(mensaje);
    guardarConversacionesLocal(conversaciones);
  }
};

const Chat: React.FC<ChatProps> = ({ conversacionId, onConversacionCreada }) => {
  const { user } = useAuthStore();
  const [mensajes, setMensajes] = useState<MensajeDemo[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [conversacionActual, setConversacionActual] = useState<string | null>(conversacionId || null);
  const [estadoChat, setEstadoChat] = useState<EstadoChat>({
    mostrarBienvenida: true,
    mostrarCategorias: false,
    categoriaSeleccionada: null,
    conversacionIniciada: false
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const categorias: CategoriaIncidente[] = ['Hardware', 'Software', 'Red', 'Seguridad'];

  // Scroll automático al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  // Cargar mensajes cuando cambia la conversación
  useEffect(() => {
    if (conversacionActual) {
      cargarMensajes();
    } else {
      // Si no hay conversación, mostrar bienvenida
      mostrarMensajeBienvenida();
    }
  }, [conversacionActual]);

  // Mostrar mensaje de bienvenida automático
  const mostrarMensajeBienvenida = () => {
    if (!estadoChat.conversacionIniciada && estadoChat.mostrarBienvenida) {
      const mensajeBienvenida: MensajeDemo = {
        id: 'bienvenida-' + Date.now(),
        contenido: '¡Bienvenido/a al Sistema de Gestión de Incidencias INCIBOT! 🎯\n\nSoy tu asistente especializado en la **recopilación de información** para generar tickets de soporte técnico de manera automática.\n\n📋 **Mi función principal es:**\n• Recopilar todos los detalles de tu problema\n• Identificar la categoría correcta\n• Generar automáticamente tu ticket de incidencia\n• Proporcionarte el código de seguimiento\n\n🚀 **Para comenzar, selecciona la categoría que mejor describe tu consulta:**',
        tipo: 'bot',
        timestamp: new Date().toISOString(),
        esBienvenida: true
      };
      
      setMensajes([mensajeBienvenida]);
      setEstadoChat(prev => ({
        ...prev,
        mostrarCategorias: true,
        mostrarBienvenida: false
      }));
    }
  };

  // Manejar selección de categoría
  const seleccionarCategoria = (categoria: CategoriaIncidente) => {
    if (!user) return;

    // Crear mensaje del usuario seleccionando categoría
    const mensajeCategoria: MensajeDemo = {
      id: Date.now().toString(),
      contenido: `He seleccionado la categoría: ${categoria}`,
      tipo: 'usuario',
      timestamp: new Date().toISOString(),
      usuario_id: user.id,
      categoria
    };

    // Crear respuesta del bot
    const respuestaBot: MensajeDemo = {
      id: (Date.now() + 1).toString(),
      contenido: obtenerRespuestaCategoria(categoria),
      tipo: 'bot',
      timestamp: new Date().toISOString()
    };

    // Crear nueva conversación si no existe
    let conversacionId = conversacionActual;
    if (!conversacionId) {
      conversacionId = crearNuevaConversacion(`Consulta de ${categoria}`);
      if (!conversacionId) return;
    }

    // Agregar mensajes al localStorage y estado
    agregarMensajeLocal(conversacionId, mensajeCategoria);
    agregarMensajeLocal(conversacionId, respuestaBot);

    // Actualizar estado directamente sin recargar desde localStorage
    setMensajes(prev => [...prev, mensajeCategoria, respuestaBot]);
    setEstadoChat(prev => ({
      ...prev,
      categoriaSeleccionada: categoria,
      mostrarCategorias: false,
      conversacionIniciada: true
    }));
  };

  // Obtener respuesta según categoría seleccionada
  const obtenerRespuestaCategoria = (categoria: CategoriaIncidente): string => {
    const respuestas = {
      'Hardware': '🔧 **Categoría seleccionada: Hardware**\n\nPerfecto, ahora recopilaré toda la información necesaria para generar tu ticket de incidencia de hardware.\n\n📝 **Para crear tu ticket, necesito que me proporciones:**\n• Descripción detallada del problema\n• Equipo o componente afectado\n• Cuándo comenzó el problema\n• Pasos que ya intentaste\n• Impacto en tu trabajo\n\n💬 **Cuéntame con el mayor detalle posible qué está ocurriendo:**',
      'Software': '💻 **Categoría seleccionada: Software**\n\nExcelente, procederé a recopilar la información necesaria para generar tu ticket de incidencia de software.\n\n📝 **Para crear tu ticket, necesito que me proporciones:**\n• Aplicación o sistema afectado\n• Descripción del error o problema\n• Mensajes de error (si los hay)\n• Cuándo ocurre el problema\n• Impacto en tus actividades\n\n💬 **Describe detalladamente el problema que estás experimentando:**',
      'Red': '🌐 **Categoría seleccionada: Red**\n\nEntendido, recopilaré todos los detalles para generar tu ticket de incidencia de red.\n\n📝 **Para crear tu ticket, necesito que me proporciones:**\n• Tipo de problema de conectividad\n• Dispositivos afectados\n• Cuándo comenzó el problema\n• Velocidad o servicios impactados\n• Ubicación donde ocurre\n\n💬 **Explícame en detalle qué dificultades tienes con la red:**',
      'Seguridad': '🔒 **Categoría seleccionada: Seguridad**\n\nMuy bien, recopilaré la información crítica para generar tu ticket de incidencia de seguridad con la prioridad adecuada.\n\n📝 **Para crear tu ticket, necesito que me proporciones:**\n• Tipo de amenaza o problema de seguridad\n• Sistemas o datos potencialmente afectados\n• Cuándo detectaste el problema\n• Acciones que ya tomaste\n• Urgencia del caso\n\n💬 **Describe detalladamente la situación de seguridad:**'
    };
    
    return respuestas[categoria];
  };

  // Cargar mensajes de la conversación local
  const cargarMensajes = () => {
    if (!conversacionActual) return;

    try {
      setCargando(true);
      const conversaciones = obtenerConversacionesLocal();
      const conversacion = conversaciones.find(c => c.id === conversacionActual);
      
      if (conversacion) {
        setMensajes(conversacion.mensajes);
        // Si ya hay mensajes, la conversación está iniciada
        if (conversacion.mensajes.length > 0) {
          setEstadoChat(prev => ({
            ...prev,
            conversacionIniciada: true,
            mostrarBienvenida: false,
            mostrarCategorias: false
          }));
        }
      } else {
        setMensajes([]);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      toast.error('Error al cargar los mensajes');
    } finally {
      setCargando(false);
    }
  };

  // Crear nueva conversación local
  const crearNuevaConversacion = (primerMensaje: string) => {
    if (!user) return null;

    try {
      const titulo = primerMensaje.length > 50 
        ? primerMensaje.substring(0, 50) + '...'
        : primerMensaje;
      
      const nuevaConversacion = crearConversacionLocal(user.id, titulo);
      setConversacionActual(nuevaConversacion.id);
      
      if (onConversacionCreada) {
        onConversacionCreada(nuevaConversacion.id);
      }
      
      return nuevaConversacion.id;
    } catch (error) {
      console.error('Error creando conversación:', error);
      toast.error('Error al crear la conversación');
      return null;
    }
  };

  // Enviar mensaje local
  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoMensaje.trim() || !user || enviando) return;

    const contenidoMensaje = nuevoMensaje.trim();
    setNuevoMensaje('');
    setEnviando(true);

    try {
      let conversacionId = conversacionActual;
      
      // Crear conversación si no existe
      if (!conversacionId) {
        conversacionId = crearNuevaConversacion(contenidoMensaje);
        if (!conversacionId) return;
      }

      // Crear mensaje del usuario
      const mensajeUsuario: MensajeDemo = {
        id: Date.now().toString(),
        contenido: contenidoMensaje,
        tipo: 'usuario',
        timestamp: new Date().toISOString(),
        usuario_id: user.id
      };

      // Agregar mensaje del usuario al estado y localStorage
      agregarMensajeLocal(conversacionId, mensajeUsuario);
      setMensajes(prev => [...prev, mensajeUsuario]);

      // Simular respuesta del bot después de un breve delay
      setTimeout(async () => {
        try {
          const respuestaBot = await generarRespuestaBot(contenidoMensaje);
          
          const mensajeBot: MensajeDemo = {
            id: (Date.now() + 1).toString(),
            contenido: respuestaBot,
            tipo: 'bot',
            timestamp: new Date().toISOString()
          };
          
          // Agregar respuesta del bot al estado y localStorage
          agregarMensajeLocal(conversacionId!, mensajeBot);
          setMensajes(prev => [...prev, mensajeBot]);
        } catch (error) {
          console.error('Error enviando respuesta del bot:', error);
        }
      }, 1000 + Math.random() * 2000); // Delay aleatorio entre 1-3 segundos

    } catch (error) {
      console.error('Error enviando mensaje:', error);
      toast.error('Error al enviar el mensaje');
    } finally {
      setEnviando(false);
    }
  };

  // Generar respuesta usando OpenAI API
  const generarRespuestaBot = async (mensajeUsuario: string): Promise<string> => {
    try {
      // Construir historial de conversación para contexto
      const historialConversacion = mensajes
        .filter(m => m.tipo !== 'sistema')
        .map(m => ({
          role: m.tipo === 'usuario' ? 'user' as const : 'assistant' as const,
          content: m.contenido
        }));

      // Llamar al endpoint del backend
      const response = await fetch('http://localhost:3002/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: mensajeUsuario,
          conversationHistory: historialConversacion
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la respuesta del servidor');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error procesando la respuesta');
      }

      return data.data.message;

    } catch (error: any) {
      console.error('Error llamando a OpenAI API:', error);
      
      // Fallback a respuestas locales en caso de error
      if (error.message.includes('fetch')) {
        return 'Lo siento, hay un problema de conexión con el servidor. Por favor, intenta más tarde o contacta al administrador del sistema.';
      }
      
      if (error.message.includes('quota') || error.message.includes('rate_limit')) {
        return 'El servicio está temporalmente sobrecargado. Por favor, intenta nuevamente en unos minutos.';
      }
      
      // Respuesta de fallback genérica
      return 'Disculpa, estoy experimentando dificultades técnicas en este momento. ¿Podrías intentar reformular tu pregunta o contactar directamente al equipo de soporte?';
    }
  };



  // Obtener prioridad según categoría
  const obtenerPrioridadPorCategoria = (categoria: CategoriaIncidente | null): string => {
    const prioridades = {
      'Seguridad': 'Alta',
      'Hardware': 'Media',
      'Software': 'Media',
      'Red': 'Media'
    };
    
    return categoria ? prioridades[categoria] : 'Media';
  };

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border">
      {/* Header del chat */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Asistente INCIBOT</h3>
            <p className="text-sm text-gray-500">En línea</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Conectado</span>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {cargando ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : mensajes.length === 0 && !estadoChat.mostrarBienvenida ? (
          <div className="text-center text-gray-500 mt-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">¡Bienvenido al chat de INCIBOT!</p>
            <p className="text-sm mt-2">Escribe un mensaje para comenzar la conversación.</p>
          </div>
        ) : (
          <>
            {mensajes.map((mensaje) => (
              <div
                key={mensaje.id}
                className={`flex ${mensaje.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    mensaje.tipo === 'usuario'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {mensaje.tipo !== 'usuario' && (
                      <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                    )}
                    {mensaje.tipo === 'usuario' && (
                      <User className="h-4 w-4 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-line">{mensaje.contenido}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs ${
                          mensaje.tipo === 'usuario' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatearFecha(mensaje.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Botones de categorías */}
            {estadoChat.mostrarCategorias && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-3">Selecciona una categoría:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {categorias.map((categoria) => (
                          <button
                            key={categoria}
                            onClick={() => seleccionarCategoria(categoria)}
                            className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          >
                            {categoria === 'Hardware' && '🔧'}
                            {categoria === 'Software' && '💻'}
                            {categoria === 'Red' && '🌐'}
                            {categoria === 'Seguridad' && '🔒'}
                            <span className="ml-1">{categoria}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {enviando && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input para nuevo mensaje */}
      <div className="border-t p-4">
        <form onSubmit={handleEnviarMensaje} className="flex space-x-2">
          <input
            type="text"
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={enviando}
          />
          <button
            type="submit"
            disabled={!nuevoMensaje.trim() || enviando}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;