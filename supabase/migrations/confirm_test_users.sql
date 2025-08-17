-- Confirmar emails de usuarios de prueba
-- Este script confirma manualmente los emails de los usuarios de prueba

-- Actualizar usuarios en auth.users para confirmar sus emails
-- Solo actualizamos email_confirmed_at ya que confirmed_at es una columna generada
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email IN (
    'admin.sistema@gmail.com',
    'soporte.tecnico@gmail.com', 
    'usuario.personal@gmail.com'
) AND email_confirmed_at IS NULL;

-- Verificar que los usuarios están confirmados
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at
FROM auth.users 
WHERE email IN (
    'admin.sistema@gmail.com',
    'soporte.tecnico@gmail.com',
    'usuario.personal@gmail.com'
);

-- Verificar perfiles en tabla usuarios
SELECT 
    u.id,
    u.email,
    u.nombre,
    u.rol,
    u.activo
FROM usuarios u
JOIN auth.users au ON u.id = au.id
WHERE au.email IN (
    'admin.sistema@gmail.com',
    'soporte.tecnico@gmail.com',
    'usuario.personal@gmail.com'
);