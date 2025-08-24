import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Función para obtener el usuario actual
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error obteniendo usuario:', error)
    return null
  }
  return user
}

// Función para obtener el perfil del usuario con rol (optimizada)
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error obteniendo perfil:', error)
    return null
  }
  
  return data
}

// Función para obtener el perfil del usuario actual (optimizada)
export const getCurrentUserProfile = async () => {
  try {
    // Obtener usuario y perfil en paralelo para mayor eficiencia
    const [authResult, profileResult] = await Promise.allSettled([
      supabase.auth.getUser(),
      supabase.from('usuarios').select('*')
    ]);

    // Verificar resultado de autenticación
    if (authResult.status === 'rejected') {
      console.error('🔍 [SUPABASE] Error obteniendo usuario:', authResult.reason);
      return null;
    }

    const { data: { user }, error: authError } = authResult.value;
    
    if (authError || !user) {
      return null;
    }

    // Verificar resultado de perfil
    if (profileResult.status === 'rejected') {
      console.error('🔍 [SUPABASE] Error obteniendo perfiles:', profileResult.reason);
      return null;
    }

    const { data: profiles, error: profileError } = profileResult.value;
    
    if (profileError) {
      console.error('🔍 [SUPABASE] Error en consulta de perfil:', profileError.message);
      return null;
    }

    // Buscar el perfil del usuario actual
    const profile = profiles?.find(p => p.id === user.id);
    
    if (!profile) {
      // Fallback: consulta directa si no se encuentra en la consulta general
       const { data: directProfile, error: directError } = await supabase
         .from('usuarios')
         .select('*')
         .eq('id', user.id)
         .single();
        
      if (directError) {
        console.error('🔍 [SUPABASE] Error en consulta directa:', directError.message);
        return null;
      }
      
      return directProfile;
    }

    return profile;
  } catch (error) {
    console.error('🔍 [SUPABASE] Error inesperado en getCurrentUserProfile():', error instanceof Error ? error.message : 'Error desconocido');
    return null;
  }
}

// Función para login
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) {
    console.error('Error en login:', error)
    return { user: null, error }
  }
  
  return { user: data.user, error: null }
}

// Función para logout
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error en logout:', error)
  }
  return error
}

// Función para registrar usuario
export const signUp = async (email: string, password: string, nombre: string, rol: string = 'personal') => {
  try {
    // Crear el usuario en Supabase Auth con metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          rol
        }
      }
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario');
    }

    // El perfil se crea automáticamente con el trigger
    return { user: authData.user };
  } catch (error) {
    console.error('Error en registro:', error);
    throw error;
  }
};

// ===== FUNCIONES DE CHAT =====

// Función para crear una nueva conversación
export const crearConversacion = async (usuarioId: string, titulo: string) => {
  try {
    const { data, error } = await supabase
      .from('conversaciones')
      .insert({
        usuario_id: usuarioId,
        titulo,
        estado: 'activa'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando conversación:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error en crearConversacion:', error);
    throw error;
  }
};

// Función para enviar un mensaje
export const enviarMensaje = async (
  conversacionId: string,
  contenido: string,
  tipo: 'usuario' | 'bot' | 'sistema' = 'usuario',
  usuarioId?: string | null,
  metadata: any = {}
) => {
  try {
    const { data, error } = await supabase
      .from('mensajes')
      .insert({
        conversacion_id: conversacionId,
        usuario_id: usuarioId || null,
        contenido,
        tipo,
        metadata
      })
      .select(`
        *,
        usuario:usuarios(*)
      `)
      .single();

    if (error) {
      console.error('Error enviando mensaje:', error);
      throw error;
    }

    // Actualizar la fecha de última actividad de la conversación
    await supabase
      .from('conversaciones')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversacionId);

    return data;
  } catch (error) {
    console.error('Error en enviarMensaje:', error);
    throw error;
  }
};

// Función para obtener el historial de mensajes de una conversación
export const obtenerMensajesConversacion = async (conversacionId: string) => {
  try {
    const { data, error } = await supabase
      .from('mensajes')
      .select(`
        *,
        usuario:usuarios(*)
      `)
      .eq('conversacion_id', conversacionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error obteniendo mensajes:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error en obtenerMensajesConversacion:', error);
    throw error;
  }
};

// Función para obtener las conversaciones de un usuario
export const obtenerConversacionesUsuario = async (usuarioId: string) => {
  try {
    const { data, error } = await supabase
      .from('conversaciones')
      .select(`
        *,
        usuario:usuarios(*),
        mensajes:mensajes(
          id,
          contenido,
          tipo,
          created_at,
          usuario:usuarios(*)
        )
      `)
      .eq('usuario_id', usuarioId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo conversaciones:', error);
      throw error;
    }

    // Agregar el último mensaje a cada conversación
    const conversacionesConUltimoMensaje = data?.map(conversacion => {
      const mensajes = conversacion.mensajes || [];
      const ultimoMensaje = mensajes.length > 0 ? mensajes[mensajes.length - 1] : null;
      
      return {
        ...conversacion,
        ultimo_mensaje: ultimoMensaje
      };
    });

    return conversacionesConUltimoMensaje || [];
  } catch (error) {
    console.error('Error en obtenerConversacionesUsuario:', error);
    throw error;
  }
};

// Función para obtener una conversación específica con sus mensajes
export const obtenerConversacion = async (conversacionId: string) => {
  try {
    const { data, error } = await supabase
      .from('conversaciones')
      .select(`
        *,
        usuario:usuarios(*),
        mensajes:mensajes(
          *,
          usuario:usuarios(*)
        )
      `)
      .eq('id', conversacionId)
      .single();

    if (error) {
      console.error('Error obteniendo conversación:', error);
      throw error;
    }

    // Ordenar mensajes por fecha
    if (data.mensajes) {
      data.mensajes.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    return data;
  } catch (error) {
    console.error('Error en obtenerConversacion:', error);
    throw error;
  }
};

// Función para cerrar una conversación
export const cerrarConversacion = async (conversacionId: string) => {
  try {
    const { data, error } = await supabase
      .from('conversaciones')
      .update({ estado: 'cerrada' })
      .eq('id', conversacionId)
      .select()
      .single();

    if (error) {
      console.error('Error cerrando conversación:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error en cerrarConversacion:', error);
    throw error;
  }
};

// Función para suscribirse a nuevos mensajes en tiempo real
export const suscribirseAMensajes = (conversacionId: string, callback: (mensaje: any) => void) => {
  return supabase
    .channel(`mensajes:${conversacionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
        filter: `conversacion_id=eq.${conversacionId}`
      },
      async (payload) => {
        // Obtener el mensaje completo con datos del usuario
        const { data: mensaje } = await supabase
          .from('mensajes')
          .select(`
            *,
            usuario:usuarios(nombre, email)
          `)
          .eq('id', payload.new.id)
          .single()

        if (mensaje) {
          callback(mensaje)
        }
      }
    )
    .subscribe()
}

// ===== FUNCIONES DE INCIDENCIAS =====

// Función para determinar la prioridad basada en palabras clave
export const determinarPrioridad = (descripcion: string): 'baja' | 'media' | 'alta' | 'critica' => {
  const texto = descripcion.toLowerCase()
  
  // Palabras clave para prioridad crítica
  if (texto.includes('crítico') || texto.includes('critico') || 
      texto.includes('urgente') || texto.includes('sistema caído') ||
      texto.includes('no funciona nada') || texto.includes('emergencia')) {
    return 'critica'
  }
  
  // Palabras clave para prioridad alta
  if (texto.includes('importante') || texto.includes('bloquea') ||
      texto.includes('no puedo trabajar') || texto.includes('error grave') ||
      texto.includes('falla total')) {
    return 'alta'
  }
  
  // Palabras clave para prioridad baja
  if (texto.includes('sugerencia') || texto.includes('mejora') ||
      texto.includes('cuando puedas') || texto.includes('no es urgente')) {
    return 'baja'
  }
  
  // Por defecto: prioridad media
  return 'media'
}

// Función para generar un título basado en la descripción
export const generarTitulo = (descripcion: string): string => {
  const texto = descripcion.trim()
  
  // Si la descripción es corta, usarla como título
  if (texto.length <= 50) {
    return texto
  }
  
  // Extraer las primeras palabras significativas
  const palabras = texto.split(' ')
  let titulo = ''
  
  for (const palabra of palabras) {
    if (titulo.length + palabra.length + 1 <= 47) { // 47 + "..." = 50
      titulo += (titulo ? ' ' : '') + palabra
    } else {
      break
    }
  }
  
  return titulo + '...'
}

// Función para determinar la categoría basada en palabras clave
export const determinarCategoria = async (descripcion: string): Promise<number> => {
  const texto = descripcion.toLowerCase()
  
  try {
    // Obtener todas las categorías
    const { data: categorias } = await supabase
      .from('categorias')
      .select('id, nombre, descripcion')
      .eq('activa', true)
    
    if (!categorias || categorias.length === 0) {
      return 1 // Categoría por defecto
    }
    
    // Buscar coincidencias por palabras clave
    for (const categoria of categorias) {
      const nombreCat = categoria.nombre.toLowerCase()
      const descCat = categoria.descripcion?.toLowerCase() || ''
      
      if (texto.includes(nombreCat) || 
          (descCat && texto.includes(descCat)) ||
          nombreCat.includes('software') && (texto.includes('aplicación') || texto.includes('programa')) ||
          nombreCat.includes('hardware') && (texto.includes('equipo') || texto.includes('computadora')) ||
          nombreCat.includes('red') && (texto.includes('internet') || texto.includes('conexión'))) {
        return categoria.id
      }
    }
    
    // Si no hay coincidencias, devolver la primera categoría
    return categorias[0].id
  } catch (error) {
    console.error('Error determinando categoría:', error)
    return 1 // Categoría por defecto en caso de error
  }
}

// Función principal para crear una incidencia
export const crearIncidencia = async (descripcion: string, usuarioId: string): Promise<any> => {
  try {
    console.log('🔄 Iniciando creación de incidencia...')
    console.log('📝 Descripción:', descripcion)
    console.log('👤 Usuario ID:', usuarioId)
    
    // Generar datos de la incidencia
    const prioridad = determinarPrioridad(descripcion)
    const titulo = generarTitulo(descripcion)
    const categoriaId = await determinarCategoria(descripcion)
    
    console.log('📊 Datos generados:')
    console.log('  - Título:', titulo)
    console.log('  - Prioridad:', prioridad)
    console.log('  - Categoría ID:', categoriaId)
    
    // Crear la incidencia en la base de datos
    const { data, error } = await supabase
      .from('incidencias')
      .insert({
        titulo,
        descripcion,
        prioridad,
        categoria_id: categoriaId,
        usuario_id: usuarioId,
        estado: 'abierta'
      })
      .select(`
        *,
        categorias(nombre, descripcion)
      `)
      .single()
    
    if (error) {
      console.error('❌ Error al crear incidencia:', error)
      throw error
    }
    
    console.log('✅ Incidencia creada exitosamente:', data)
    return data
    
  } catch (error) {
    console.error('❌ Error en crearIncidencia:', error)
    throw error
  }
}

// Función para obtener incidencias de un usuario
export const obtenerIncidenciasUsuario = async (usuarioId: string) => {
  try {
    const { data, error } = await supabase
      .from('incidencias')
      .select(`
        *,
        categorias(nombre, descripcion),
        respuestas(id, contenido, created_at)
      `)
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error obteniendo incidencias:', error)
    throw error
  }
}

// Función para obtener una incidencia específica
export const obtenerIncidencia = async (incidenciaId: string) => {
  try {
    const { data, error } = await supabase
      .from('incidencias')
      .select(`
        *,
        categorias(nombre, descripcion),
        usuarios(nombre, email),
        respuestas(
          *,
          usuarios(nombre, email)
        )
      `)
      .eq('id', incidenciaId)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error obteniendo incidencia:', error)
    throw error
  }
};