-- Corregir recursión infinita en políticas RLS de usuarios
-- El problema está en la política de DELETE que consulta la misma tabla

-- Eliminar la política problemática
DROP POLICY IF EXISTS "usuarios_delete_admin" ON usuarios;

-- Crear una política de DELETE más simple que no cause recursión
-- Solo permitir DELETE a través de funciones administrativas específicas
CREATE POLICY "usuarios_delete_restricted" ON usuarios
  FOR DELETE
  USING (false); -- Bloquear DELETE directo, solo permitir a través de funciones

-- Crear función para eliminar usuarios (solo para administradores)
CREATE OR REPLACE FUNCTION delete_user_admin(user_id_to_delete UUID)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Verificar que el usuario actual es administrador
  SELECT rol INTO current_user_role
  FROM auth.users au
  JOIN usuarios u ON au.id = u.id
  WHERE au.id = auth.uid();
  
  IF current_user_role != 'administrador' THEN
    RAISE EXCEPTION 'Solo los administradores pueden eliminar usuarios';
  END IF;
  
  -- Eliminar el usuario
  DELETE FROM usuarios WHERE id = user_id_to_delete;
  
  RETURN TRUE;
END;
$$;

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION delete_user_admin(UUID) TO authenticated;

-- Verificar que las políticas están funcionando correctamente
-- Crear política adicional para administradores que puedan ver todos los usuarios
CREATE POLICY "usuarios_select_admin_all" ON usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.raw_user_meta_data->>'rol' = 'administrador'
    )
  );

-- Política para que soporte pueda ver usuarios activos
CREATE POLICY "usuarios_select_soporte" ON usuarios
  FOR SELECT
  USING (
    activo = true AND
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.raw_user_meta_data->>'rol' IN ('soporte', 'administrador')
    )
  );