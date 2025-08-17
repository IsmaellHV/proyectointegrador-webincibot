-- Sistema de Gestión de Incidencias con Chatbot
-- Migración inicial: Creación de tablas y configuración

-- Crear tabla de usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(20) DEFAULT 'personal' CHECK (rol IN ('personal', 'soporte', 'administrador')),
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- Crear tabla de categorías
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de incidencias
CREATE TABLE incidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,
    categoria_id UUID NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'en_progreso', 'resuelta', 'cerrada')),
    prioridad VARCHAR(20) DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
    asignado_a UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Crear índices para incidencias
CREATE INDEX idx_incidencias_usuario_id ON incidencias(usuario_id);
CREATE INDEX idx_incidencias_estado ON incidencias(estado);
CREATE INDEX idx_incidencias_prioridad ON incidencias(prioridad);
CREATE INDEX idx_incidencias_asignado_a ON incidencias(asignado_a);
CREATE INDEX idx_incidencias_created_at ON incidencias(created_at DESC);

-- Crear tabla de respuestas
CREATE TABLE respuestas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incidencia_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    contenido TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'respuesta' CHECK (tipo IN ('respuesta', 'nota_interna', 'solucion')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para respuestas
CREATE INDEX idx_respuestas_incidencia_id ON respuestas(incidencia_id);
CREATE INDEX idx_respuestas_usuario_id ON respuestas(usuario_id);
CREATE INDEX idx_respuestas_created_at ON respuestas(created_at DESC);

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers para actualizar updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidencias_updated_at BEFORE UPDATE ON incidencias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar categorías iniciales
INSERT INTO categorias (nombre, descripcion) VALUES
('Hardware', 'Problemas relacionados con equipos físicos'),
('Software', 'Problemas con aplicaciones y sistemas'),
('Red', 'Problemas de conectividad y red'),
('Acceso', 'Problemas de autenticación y permisos'),
('Otros', 'Incidencias que no encajan en otras categorías');

-- Configurar permisos para Supabase
GRANT SELECT ON usuarios TO anon;
GRANT ALL PRIVILEGES ON usuarios TO authenticated;

GRANT SELECT ON categorias TO anon;
GRANT ALL PRIVILEGES ON categorias TO authenticated;

GRANT SELECT ON incidencias TO anon;
GRANT ALL PRIVILEGES ON incidencias TO authenticated;

GRANT SELECT ON respuestas TO anon;
GRANT ALL PRIVILEGES ON respuestas TO authenticated;

-- Crear usuario administrador inicial
INSERT INTO usuarios (email, nombre, rol, password_hash) VALUES
('admin@empresa.com', 'Administrador del Sistema', 'administrador', '$2a$10$example.hash.for.admin.password');

-- Comentarios finales
-- Este script crea la estructura básica de la base de datos
-- Las contraseñas deben ser hasheadas usando bcrypt en la aplicación
-- Los permisos RLS (Row Level Security) se configurarán en una migración posterior