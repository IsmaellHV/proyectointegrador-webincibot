-- Confirmar manualmente usuarios existentes para desarrollo
-- Solo actualizamos email_confirmed_at ya que confirmed_at es una columna generada

-- Confirmar manualmente todos los usuarios existentes
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Actualizar metadatos para marcar emails como verificados
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"email_verified": true}'::jsonb
WHERE email IN (
    'admin.sistema@gmail.com',
    'soporte.tecnico@gmail.com', 
    'usuario.personal@gmail.com'
);

-- Verificar que los usuarios estén confirmados
SELECT email, email_confirmed_at, confirmed_at 
FROM auth.users 
WHERE email IN (
    'admin.sistema@gmail.com',
    'soporte.tecnico@gmail.com',
    'usuario.personal@gmail.com'
);