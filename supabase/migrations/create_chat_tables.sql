-- Crear tabla conversaciones
CREATE TABLE IF NOT EXISTS conversaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'cerrada', 'archivada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla mensajes
CREATE TABLE IF NOT EXISTS mensajes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversacion_id UUID NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    contenido TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'usuario' CHECK (tipo IN ('usuario', 'bot', 'sistema')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_conversaciones_usuario_id ON conversaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_estado ON conversaciones(estado);
CREATE INDEX IF NOT EXISTS idx_conversaciones_created_at ON conversaciones(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion_id ON mensajes(conversacion_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_usuario_id ON mensajes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_tipo ON mensajes(tipo);
CREATE INDEX IF NOT EXISTS idx_mensajes_created_at ON mensajes(created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en conversaciones
CREATE TRIGGER update_conversaciones_updated_at
    BEFORE UPDATE ON conversaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para conversaciones
CREATE POLICY "Los usuarios pueden ver sus propias conversaciones" ON conversaciones
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Los usuarios pueden crear sus propias conversaciones" ON conversaciones
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias conversaciones" ON conversaciones
    FOR UPDATE USING (auth.uid() = usuario_id);

-- Políticas de seguridad para mensajes
CREATE POLICY "Los usuarios pueden ver mensajes de sus conversaciones" ON mensajes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversaciones 
            WHERE conversaciones.id = mensajes.conversacion_id 
            AND conversaciones.usuario_id = auth.uid()
        )
    );

CREATE POLICY "Los usuarios pueden crear mensajes en sus conversaciones" ON mensajes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversaciones 
            WHERE conversaciones.id = mensajes.conversacion_id 
            AND conversaciones.usuario_id = auth.uid()
        )
    );

-- Permitir que el sistema (bot) cree mensajes sin restricciones de usuario
CREATE POLICY "El sistema puede crear mensajes de bot" ON mensajes
    FOR INSERT WITH CHECK (tipo = 'bot' OR tipo = 'sistema');

-- Otorgar permisos a los roles
GRANT ALL PRIVILEGES ON conversaciones TO authenticated;
GRANT ALL PRIVILEGES ON mensajes TO authenticated;
GRANT SELECT ON conversaciones TO anon;
GRANT SELECT ON mensajes TO anon;