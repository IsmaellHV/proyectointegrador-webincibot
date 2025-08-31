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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    }
  }, [conversacionActual]);

  // Cargar mensajes de la conversación local
  const cargarMensajes = () => {
    if (!conversacionActual) return;

    try {
      setCargando(true);
      const conversaciones = obtenerConversacionesLocal();
      const conversacion = conversaciones.find(c => c.id === conversacionActual);
      
      if (conversacion) {
        setMensajes(conversacion.mensajes);
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

      // Agregar mensaje del usuario
      agregarMensajeLocal(conversacionId, mensajeUsuario);
      
      // Actualizar estado local inmediatamente
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

  // Generar respuesta automática del bot (versión simplificada)
  const generarRespuestaBot = async (mensajeUsuario: string): Promise<string> => {
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mensaje = mensajeUsuario.toLowerCase()
    
    // Detectar si es un problema técnico
    const esProblema = mensaje.includes('problema') || mensaje.includes('error') || 
                      mensaje.includes('falla') || mensaje.includes('no funciona') ||
                      mensaje.includes('no puedo') || mensaje.includes('bloqueado') ||
                      mensaje.includes('lento') || mensaje.includes('demora') ||
                      mensaje.includes('crítico') || mensaje.includes('urgente') ||
                      mensaje.includes('sistema caído') || mensaje.includes('emergencia')
    
    // Si es un problema, simular creación de incidencia
    if (esProblema && user?.id) {
      const incidenciaId = Date.now().toString().slice(-6); // ID simulado
      console.log('🔍 Detectado problema técnico (modo demo), simulando incidencia...')
      
      return `He detectado que tienes un problema técnico y he registrado tu consulta como incidencia #${incidenciaId} (modo demostración).\n\n📋 **Detalles de la incidencia:**\n- **ID:** #${incidenciaId}\n- **Título:** ${mensajeUsuario.substring(0, 50)}...\n- **Prioridad:** Media\n- **Estado:** Pendiente\n\nEn un entorno real, nuestro equipo técnico revisaría tu caso. ¿Hay algo más en lo que pueda ayudarte?`
    }
    
    // Respuestas básicas del bot
    if (mensaje.includes('hola') || mensaje.includes('buenos') || mensaje.includes('saludos')) {
      return '¡Hola! Soy el asistente virtual de INCIBOT. ¿En qué puedo ayudarte hoy? Si tienes algún problema técnico, puedo registrar tu consulta para que nuestro equipo te asista.';
    }
    
    if (mensaje.includes('gracias') || mensaje.includes('perfecto') || mensaje.includes('excelente')) {
      return '¡De nada! Me alegra poder ayudarte. ¿Hay algo más en lo que pueda asistirte?';
    }
    
    if (mensaje.includes('incidencia') || mensaje.includes('ticket') || mensaje.includes('reporte')) {
      return 'Si necesitas reportar un problema técnico, simplemente descríbeme el inconveniente y registraré tu consulta para que nuestro equipo técnico pueda asistirte.';
    }
    
    if (mensaje.includes('adiós') || mensaje.includes('hasta luego') || mensaje.includes('chao')) {
      return '¡Hasta luego! No dudes en contactarme si necesitas ayuda en el futuro.';
    }
    
    if (mensaje.includes('chat') || mensaje.includes('funciona') || mensaje.includes('test')) {
      return '¡El chat está funcionando perfectamente! Estoy aquí para ayudarte con cualquier consulta o problema técnico que tengas.';
    }
    
    // Respuesta por defecto
    return 'Entiendo tu consulta. ¿Podrías proporcionar más detalles para poder asistirte mejor? Si se trata de un problema técnico, puedo registrar tu consulta para que nuestro equipo especializado te ayude.';
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
        ) : mensajes.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">¡Bienvenido al chat de INCIBOT!</p>
            <p className="text-sm mt-2">Escribe un mensaje para comenzar la conversación.</p>
          </div>
        ) : (
          mensajes.map((mensaje) => (
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
                    <p className="text-sm">{mensaje.contenido}</p>
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
          ))
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