import express, { type Request, type Response } from 'express';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar cliente de Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://hkrcpoomtoywtxqyakxi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrcmNwb29tdG95d3R4cXlha3hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTIwMDM0MCwiZXhwIjoyMDcwNzc2MzQwfQ.4dJYyjVniile7QDr4d_70lWjWxF3MC4Xv4hgAk4IpME'
);

const router = express.Router();

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

// Contexto del sistema para el chatbot de incidencias
const SYSTEM_CONTEXT = `Eres INCIBOT, un asistente especializado en recopilar información para generar tickets de incidencias en el sistema INCIBOT.

Tu función principal es:
- Recopilar información detallada sobre problemas técnicos de los usuarios
- Identificar automáticamente la categoría del problema (Hardware, Software, Red, Acceso, Otros)
- Generar tickets de incidencia con la información recopilada
- Informar al usuario sobre el código del ticket generado
- Mantener un tono profesional, empático y eficiente

Proceso de trabajo:
1. Saluda profesionalmente y pregunta en qué puedes ayudar
2. Recopila información específica: descripción del problema, equipo afectado, cuándo ocurrió, pasos previos realizados
3. Identifica la categoría basándote en palabras clave:
   - Hardware: computadora, monitor, teclado, mouse, impresora, equipo físico
   - Software: aplicación, programa, sistema operativo, instalación, actualización
   - Red: internet, conexión, wifi, red, navegador, correo
   - Acceso: contraseña, usuario, login, permisos, cuenta
   - Otros: cualquier problema que no encaje en las categorías anteriores
4. Una vez recopilada la información suficiente, genera un ticket automáticamente
5. Proporciona al usuario el código del ticket generado

NO proporciones soluciones ni pautas de resolución. Tu objetivo es únicamente recopilar información y generar el ticket correspondiente.`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  userId?: string;
}

// Nota: La generación de códigos de ticket se maneja automáticamente en la base de datos
// mediante el trigger trigger_codigo_incidencia que usa la función generar_codigo_incidencia()

// Función para identificar categoría basada en palabras clave
function identificarCategoria(mensaje: string): string {
  const mensajeLower = mensaje.toLowerCase();
  
  // Palabras clave para cada categoría
  const categorias = {
    hardware: ['computadora', 'monitor', 'teclado', 'mouse', 'impresora', 'equipo', 'pantalla', 'cpu', 'disco duro', 'memoria'],
    software: ['aplicación', 'programa', 'sistema operativo', 'instalación', 'actualización', 'windows', 'office', 'antivirus', 'navegador'],
    red: ['internet', 'conexión', 'wifi', 'red', 'navegador', 'correo', 'email', 'servidor', 'vpn'],
    acceso: ['contraseña', 'usuario', 'login', 'permisos', 'cuenta', 'acceso', 'autenticación', 'sesión']
  };
  
  for (const [categoria, palabras] of Object.entries(categorias)) {
    if (palabras.some(palabra => mensajeLower.includes(palabra))) {
      return categoria;
    }
  }
  
  return 'otros';
}

// Función para obtener ID de categoría desde la base de datos
async function obtenerCategoriaId(nombreCategoria: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('id')
      .eq('nombre', nombreCategoria.charAt(0).toUpperCase() + nombreCategoria.slice(1))
      .single();
    
    if (error || !data) {
      // Si no encuentra la categoría específica, buscar 'Otros'
      const { data: otrosData, error: otrosError } = await supabase
        .from('categorias')
        .select('id')
        .eq('nombre', 'Otros')
        .single();
      
      return otrosError ? null : otrosData.id;
    }
    
    return data.id;
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    return null;
  }
}

// Función para crear ticket en la base de datos
async function crearTicket(titulo: string, descripcion: string, categoriaId: string, usuarioId: string): Promise<string | null> {
  try {
    // No generar código aquí, dejar que la base de datos lo haga automáticamente con el trigger
    const { data, error } = await supabase
      .from('incidencias')
      .insert({
        titulo,
        descripcion,
        categoria_id: categoriaId,
        usuario_id: usuarioId,
        estado: 'abierta',
        prioridad: 'media'
      })
      .select('codigo')
      .single();
    
    if (error) {
      console.error('Error creando ticket:', error);
      return null;
    }
    
    return data.codigo;
  } catch (error) {
    console.error('Error creando ticket:', error);
    return null;
  }
}

// Función para analizar si el mensaje contiene información suficiente para crear un ticket
function analizarInformacionCompleta(mensaje: string, historial: ChatMessage[]): boolean {
  const mensajeLower = mensaje.toLowerCase();
  const historialCompleto = historial.map(m => m.content.toLowerCase()).join(' ') + ' ' + mensajeLower;
  
  // Verificar si hay descripción del problema
  const tieneProblema = /problema|error|falla|no funciona|no puedo|ayuda|soporte|no enciende|no responde|no imprime|lento|atascado|urgente/.test(historialCompleto);
  
  // Verificar si menciona equipos específicos o detalles técnicos
  const tieneDetallesTecnicos = /computadora|impresora|servidor|red|internet|sistema|aplicación|software|hardware|dell|hp|windows|mac|optiplex/.test(historialCompleto);
  
  // Verificar si describe acciones realizadas o detalles específicos
  const tieneAcciones = /intenté|probé|verifiqué|reinicié|conecté|desconecté|instalé|presiono|cable|alimentación|botón/.test(historialCompleto);
  
  // Verificar si el mensaje es suficientemente descriptivo (al menos 20 palabras)
  const palabras = historialCompleto.split(' ').filter(palabra => palabra.length > 2);
  const esSuficientementeDescriptivo = palabras.length >= 20;
  
  // Crear ticket automáticamente si cumple los criterios básicos
  const resultado = tieneProblema && tieneDetallesTecnicos && (tieneAcciones || esSuficientementeDescriptivo);
  
  // Análisis completado para determinar si crear ticket automáticamente
  
  return resultado;
}

// Endpoint para procesar mensajes del chat
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory = [], userId = 'demo-user' }: ChatRequest = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Mensaje requerido'
      });
    }

    // Analizar si hay información suficiente para crear un ticket
    const informacionCompleta = analizarInformacionCompleta(message, conversationHistory);
    
    // Identificar categoría del problema
    const categoriaDetectada = identificarCategoria(message);
    
    let ticketCreado = null;
    
    // Si hay información suficiente, intentar crear el ticket
    if (informacionCompleta) {
      const categoriaId = await obtenerCategoriaId(categoriaDetectada);
      
      if (categoriaId) {
        // Generar título basado en el mensaje
        const titulo = message.length > 50 ? message.substring(0, 47) + '...' : message;
        
        // Crear descripción completa del historial
        const descripcionCompleta = conversationHistory
          .filter(msg => msg.role === 'user')
          .map(msg => msg.content)
          .join('\n') + '\n' + message;
        
        ticketCreado = await crearTicket(titulo, descripcionCompleta, categoriaId, userId);
      }
    }

    // Construir el contexto adicional para OpenAI
    let contextoAdicional = '';
    if (ticketCreado) {
      contextoAdicional = `\n\nIMPORTANTE: Se ha generado automáticamente el ticket ${ticketCreado} para este problema. Debes informar al usuario sobre este código de ticket al final de tu respuesta.`;
    } else if (informacionCompleta) {
      contextoAdicional = `\n\nEl usuario ha proporcionado información suficiente. Pregunta si desea que generes un ticket para su problema.`;
    }

    // Construir el historial de conversación
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_CONTEXT + contextoAdicional },
      ...conversationHistory.slice(-10), // Limitar a los últimos 10 mensajes para controlar costos
      { role: 'user', content: message }
    ];

    // Llamar a la API de OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Modelo más económico
      messages: messages,
      max_tokens: 500, // Limitar tokens para controlar costos
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const assistantMessage = completion.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No se recibió respuesta de OpenAI');
    }

    res.json({
      success: true,
      data: {
        message: assistantMessage,
        usage: completion.usage,
        ticketCreado: ticketCreado,
        categoriaDetectada: categoriaDetectada
      }
    });

  } catch (error: any) {
    console.error('Error en chat endpoint:', error);
    
    // Manejar errores específicos de OpenAI
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({
        success: false,
        error: 'Cuota de API agotada. Por favor, intenta más tarde.'
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        success: false,
        error: 'Límite de velocidad excedido. Por favor, espera un momento.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor. Por favor, intenta más tarde.'
    });
  }
});

// Endpoint para obtener información del modelo
router.get('/info', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      model: 'gpt-3.5-turbo',
      description: 'Chatbot especializado en soporte técnico para incidencias',
      capabilities: [
        'Diagnóstico de problemas técnicos',
        'Sugerencias de soluciones',
        'Categorización de incidencias',
        'Consejos de prevención'
      ]
    }
  });
});

export default router;