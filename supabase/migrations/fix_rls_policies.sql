-- Eliminar todas las políticas existentes que pueden estar causando recursión infinita
DROP POLICY IF EXISTS "usuarios_select_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete_policy" ON usuarios;
DROP POLICY IF EXISTS "Enable read access for all users" ON usuarios;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON usuarios;
DROP POLICY IF EXISTS "Enable update for users based on email" ON usuarios;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON usuarios;

-- Crear políticas RLS simples y seguras
-- Política para SELECT: Los usuarios pueden ver su propio perfil
CREATE POLICY "usuarios_select_own" ON usuarios
  FOR SELECT
  USING (auth.uid() = id);

-- Política para INSERT: Solo usuarios autenticados pueden insertar (para registro)
CREATE POLICY "usuarios_insert_authenticated" ON usuarios
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política para UPDATE: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "usuarios_update_own" ON usuarios
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política para DELETE: Solo administradores pueden eliminar usuarios
CREATE POLICY "usuarios_delete_admin" ON usuarios
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() 
      AND rol = 'administrador'
    )
  );

-- Otorgar permisos básicos a los roles
GRANT SELECT, INSERT, UPDATE ON usuarios TO authenticated;
GRANT SELECT ON usuarios TO anon;