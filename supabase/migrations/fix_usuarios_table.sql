-- Migración para corregir la tabla usuarios para usar Supabase Auth

-- Primero eliminamos la tabla existente
DROP TABLE IF EXISTS usuarios CASCADE;

-- Recreamos la tabla usuarios con la estructura correcta
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'personal' CHECK (rol IN ('personal', 'soporte', 'administrador')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON usuarios
    FOR SELECT USING (auth.uid() = id);

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON usuarios
    FOR UPDATE USING (auth.uid() = id);

-- Política para que administradores puedan ver todos los usuarios
CREATE POLICY "Admins can view all users" ON usuarios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND rol = 'administrador'
        )
    );

-- Política para que administradores puedan actualizar todos los usuarios
CREATE POLICY "Admins can update all users" ON usuarios
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND rol = 'administrador'
        )
    );

-- Política para insertar nuevos usuarios (solo durante el registro)
CREATE POLICY "Enable insert for authenticated users" ON usuarios
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Otorgar permisos a los roles de Supabase
GRANT SELECT, INSERT, UPDATE ON usuarios TO authenticated;
GRANT SELECT ON usuarios TO anon;

-- Función para crear perfil de usuario automáticamente después del registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios (id, email, nombre, rol)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'rol', 'personal')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Recrear las tablas que dependen de usuarios con las nuevas referencias
-- Actualizar tabla incidencias
ALTER TABLE incidencias DROP CONSTRAINT IF EXISTS incidencias_usuario_id_fkey;
ALTER TABLE incidencias DROP CONSTRAINT IF EXISTS incidencias_asignado_a_fkey;
ALTER TABLE incidencias ADD CONSTRAINT incidencias_usuario_id_fkey 
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE incidencias ADD CONSTRAINT incidencias_asignado_a_fkey 
    FOREIGN KEY (asignado_a) REFERENCES usuarios(id) ON DELETE SET NULL;

-- Actualizar tabla respuestas
ALTER TABLE respuestas DROP CONSTRAINT IF EXISTS respuestas_usuario_id_fkey;
ALTER TABLE respuestas ADD CONSTRAINT respuestas_usuario_id_fkey 
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- Otorgar permisos para las otras tablas
GRANT ALL PRIVILEGES ON categorias TO authenticated;
GRANT SELECT ON categorias TO anon;

GRANT ALL PRIVILEGES ON incidencias TO authenticated;
GRANT SELECT ON incidencias TO anon;

GRANT ALL PRIVILEGES ON respuestas TO authenticated;
GRANT SELECT ON respuestas TO anon;