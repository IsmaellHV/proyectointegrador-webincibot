export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          nombre: string
          rol: 'personal' | 'soporte' | 'administrador'
          password_hash: string
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          nombre: string
          rol?: 'personal' | 'soporte' | 'administrador'
          password_hash: string
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nombre?: string
          rol?: 'personal' | 'soporte' | 'administrador'
          password_hash?: string
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categorias: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          activa: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          activa?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          activa?: boolean
          created_at?: string
        }
      }
      incidencias: {
        Row: {
          id: string
          usuario_id: string
          categoria_id: string
          titulo: string
          descripcion: string
          estado: 'abierta' | 'en_progreso' | 'resuelta' | 'cerrada'
          prioridad: 'baja' | 'media' | 'alta' | 'critica'
          asignado_a: string | null
          created_at: string
          updated_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          categoria_id: string
          titulo: string
          descripcion: string
          estado?: 'abierta' | 'en_progreso' | 'resuelta' | 'cerrada'
          prioridad?: 'baja' | 'media' | 'alta' | 'critica'
          asignado_a?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          categoria_id?: string
          titulo?: string
          descripcion?: string
          estado?: 'abierta' | 'en_progreso' | 'resuelta' | 'cerrada'
          prioridad?: 'baja' | 'media' | 'alta' | 'critica'
          asignado_a?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
      }
      respuestas: {
        Row: {
          id: string
          incidencia_id: string
          usuario_id: string
          contenido: string
          tipo: 'respuesta' | 'nota_interna' | 'solucion'
          created_at: string
        }
        Insert: {
          id?: string
          incidencia_id: string
          usuario_id: string
          contenido: string
          tipo?: 'respuesta' | 'nota_interna' | 'solucion'
          created_at?: string
        }
        Update: {
          id?: string
          incidencia_id?: string
          usuario_id?: string
          contenido?: string
          tipo?: 'respuesta' | 'nota_interna' | 'solucion'
          created_at?: string
        }
      }
      conversaciones: {
        Row: {
          id: string
          usuario_id: string
          titulo: string
          estado: 'activa' | 'cerrada' | 'archivada'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          titulo: string
          estado?: 'activa' | 'cerrada' | 'archivada'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          titulo?: string
          estado?: 'activa' | 'cerrada' | 'archivada'
          created_at?: string
          updated_at?: string
        }
      }
      mensajes: {
        Row: {
          id: string
          conversacion_id: string
          usuario_id: string | null
          contenido: string
          tipo: 'usuario' | 'bot' | 'sistema'
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversacion_id: string
          usuario_id?: string | null
          contenido: string
          tipo?: 'usuario' | 'bot' | 'sistema'
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversacion_id?: string
          usuario_id?: string | null
          contenido?: string
          tipo?: 'usuario' | 'bot' | 'sistema'
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Tipos de conveniencia para usar en la aplicación
export type Usuario = Database['public']['Tables']['usuarios']['Row']
export type UsuarioInsert = Database['public']['Tables']['usuarios']['Insert']
export type UsuarioUpdate = Database['public']['Tables']['usuarios']['Update']

export type Categoria = Database['public']['Tables']['categorias']['Row']
export type CategoriaInsert = Database['public']['Tables']['categorias']['Insert']
export type CategoriaUpdate = Database['public']['Tables']['categorias']['Update']

export type Incidencia = Database['public']['Tables']['incidencias']['Row']
export type IncidenciaInsert = Database['public']['Tables']['incidencias']['Insert']
export type IncidenciaUpdate = Database['public']['Tables']['incidencias']['Update']

export type Respuesta = Database['public']['Tables']['respuestas']['Row']
export type RespuestaInsert = Database['public']['Tables']['respuestas']['Insert']
export type RespuestaUpdate = Database['public']['Tables']['respuestas']['Update']

export type Conversacion = Database['public']['Tables']['conversaciones']['Row']
export type ConversacionInsert = Database['public']['Tables']['conversaciones']['Insert']
export type ConversacionUpdate = Database['public']['Tables']['conversaciones']['Update']

export type Mensaje = Database['public']['Tables']['mensajes']['Row']
export type MensajeInsert = Database['public']['Tables']['mensajes']['Insert']
export type MensajeUpdate = Database['public']['Tables']['mensajes']['Update']

// Tipos extendidos con relaciones
export type IncidenciaConRelaciones = Incidencia & {
  usuario?: Usuario
  categoria?: Categoria
  asignado?: Usuario
  respuestas?: RespuestaConUsuario[]
}

export type RespuestaConUsuario = Respuesta & {
  usuario?: Usuario
}

export type ConversacionConMensajes = Conversacion & {
  usuario?: Usuario
  mensajes?: MensajeConUsuario[]
  ultimo_mensaje?: MensajeConUsuario
}

export type MensajeConUsuario = Mensaje & {
  usuario?: Usuario
}

// Tipos adicionales para la aplicación
export interface AuthState {
  user: Usuario | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface DashboardMetrics {
  totalIncidencias: number
  incidenciasAbiertas: number
  incidenciasEnProgreso: number
  incidenciasResueltas: number
  incidenciasCerradas: number
  incidenciasPorPrioridad: {
    baja: number
    media: number
    alta: number
    critica: number
  }
  promedioResolucion: number
}

export interface IncidenciaFilter {
  estado?: string
  prioridad?: string
  categoria?: string
  fechaInicio?: string
  fechaFin?: string
  busqueda?: string
}

export interface ChatMessage {
  id: string
  content: string
  timestamp: Date
  sender: 'user' | 'bot'
  type?: 'text' | 'incident_created' | 'error'
}

// Tipo para categorías en el chatbot
export interface ChatCategoria {
  id: number
  nombre: string
  descripcion?: string
  activa?: boolean
  created_at?: string
}

export interface ContextoChatbot {
  mensajes: ChatMessage[]
  incidenciaEnProceso?: {
    titulo?: string
    descripcion?: string
    categoria?: string
    prioridad?: string
  }
  esperandoRespuesta: boolean
}