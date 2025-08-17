import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

const supabaseUrl = 'https://hkrcpoomtoywtxqyakxi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrcmNwb29tdG95d3R4cXlha3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDAzNDAsImV4cCI6MjA3MDc3NjM0MH0.YQT8ogB0WdjQlG4nWctnqNhIpDERrzSFlieqEw8OfSY'

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

// Función para obtener el perfil del usuario con rol
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

// Función para obtener el perfil del usuario actual
export const getCurrentUserProfile = async () => {
  try {
    console.log('🔍 [SUPABASE] Iniciando getCurrentUserProfile()');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('🔍 [SUPABASE] Error obteniendo usuario de auth:', authError);
      return null;
    }
    
    if (!user) {
      console.log('🔍 [SUPABASE] No hay usuario autenticado');
      return null;
    }

    console.log('🔍 [SUPABASE] Usuario encontrado, buscando perfil para ID:', user.id);

    const { data: profile, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('🔍 [SUPABASE] Error obteniendo perfil de tabla usuarios:', {
        error,
        userId: user.id,
        errorCode: error.code,
        errorMessage: error.message
      });
      return null;
    }

    if (!profile) {
      console.warn('🔍 [SUPABASE] Perfil no encontrado para usuario:', user.id);
      return null;
    }

    console.log('🔍 [SUPABASE] Perfil obtenido exitosamente:', {
      id: profile.id,
      email: profile.email,
      nombre: profile.nombre,
      rol: profile.rol,
      activo: profile.activo
    });

    return profile;
  } catch (error) {
    console.error('🔍 [SUPABASE] Error inesperado en getCurrentUserProfile():', {
      error,
      message: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
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