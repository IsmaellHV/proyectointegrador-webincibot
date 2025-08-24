-- Deshabilitar Row Level Security para todas las tablas
-- Esto permitirá que las operaciones de escritura funcionen sin restricciones
-- Nota: Esto es temporal para desarrollo, se debe regularizar después

-- Deshabilitar RLS en tabla usuarios
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tabla incidencias
ALTER TABLE incidencias DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tabla respuestas
ALTER TABLE respuestas DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tabla categorias
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tabla conversaciones (si existe)
ALTER TABLE conversaciones DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tabla mensajes (si existe)
ALTER TABLE mensajes DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS esté deshabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'incidencias', 'respuestas', 'categorias', 'conversaciones', 'mensajes');