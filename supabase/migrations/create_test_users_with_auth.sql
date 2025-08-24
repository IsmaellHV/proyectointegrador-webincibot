-- Crear usuarios de prueba en Supabase Auth y tabla usuarios
-- Este script crea usuarios con autenticación y perfiles completos

-- Primero, insertar usuarios en auth.users (tabla de autenticación de Supabase)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin.sistema@gmail.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  '',
  '',
  '',
  ''
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'soporte.tecnico@gmail.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  '',
  '',
  '',
  ''
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'usuario.personal@gmail.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  '',
  '',
  '',
  ''
);

-- Ahora insertar los perfiles en la tabla usuarios
-- Usar los IDs de los usuarios recién creados
WITH user_ids AS (
  SELECT id, email FROM auth.users WHERE email IN ('admin.sistema@gmail.com', 'soporte.tecnico@gmail.com', 'usuario.personal@gmail.com')
)
INSERT INTO public.usuarios (id, email, nombre, rol, activo, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  CASE 
    WHEN u.email = 'admin.sistema@gmail.com' THEN 'Administrador Sistema'
    WHEN u.email = 'soporte.tecnico@gmail.com' THEN 'Soporte Técnico'
    WHEN u.email = 'usuario.personal@gmail.com' THEN 'Usuario Personal'
  END as nombre,
  CASE 
    WHEN u.email = 'admin.sistema@gmail.com' THEN 'administrador'
    WHEN u.email = 'soporte.tecnico@gmail.com' THEN 'soporte'
    WHEN u.email = 'usuario.personal@gmail.com' THEN 'personal'
  END as rol,
  true as activo,
  NOW() as created_at,
  NOW() as updated_at
FROM user_ids u
ON CONFLICT (email) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo,
  updated_at = NOW();

-- Verificar que los usuarios se crearon correctamente
SELECT 
  u.email,
  u.nombre,
  u.rol,
  u.activo,
  au.email_confirmed_at IS NOT NULL as email_confirmed
FROM public.usuarios u
JOIN auth.users au ON u.id = au.id
WHERE u.email IN ('admin.sistema@gmail.com', 'soporte.tecnico@gmail.com', 'usuario.personal@gmail.com')
ORDER BY u.email;