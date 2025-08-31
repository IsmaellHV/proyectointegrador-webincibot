import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Schema de validación
const loginSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Formato de email inválido'),
  password: z.string().min(1, 'La contraseña es requerida').min(6, 'La contraseña debe tener al menos 6 caracteres'),
  recordarPassword: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Limpiar errores cuando el componente se monta y cargar datos guardados
  useEffect(() => {
    clearError();

    // Cargar email guardado si existe
    const emailGuardado = localStorage.getItem('recordarEmail');
    if (emailGuardado) {
      setValue('email', emailGuardado);
      setValue('recordarPassword', true);
    }
  }, [clearError, setValue]);

  // Limpiar errores cuando el usuario empieza a escribir
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Manejar recordar contraseña
      if (data.recordarPassword) {
        localStorage.setItem('recordarEmail', data.email);
      } else {
        localStorage.removeItem('recordarEmail');
      }

      const result = await login(data.email, data.password);

      if (result.success) {
        toast.success('¡Bienvenido al sistema!');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Error en el login');
      }
    } catch (error) {
      console.error('Error en login:', error);
      toast.error('Error inesperado. Intente nuevamente.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-6">
            <img src="/src/assets/logo_texto_incibot.png" alt="INCIBOT" className="h-20 mx-auto" />
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input {...register('email')} type="email" id="email" className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-300'}`} placeholder="usuario@ejemplo.com" disabled={isSubmitting || isLoading} />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input {...register('password')} type={showPassword ? 'text' : 'password'} id="password" className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.password ? 'border-red-300' : 'border-gray-300'}`} placeholder="••••••••" disabled={isSubmitting || isLoading} />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={togglePasswordVisibility} disabled={isSubmitting || isLoading}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" /> : <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Checkbox Recordar Contraseña */}
            <div className="flex items-center">
              <input {...register('recordarPassword')} type="checkbox" id="recordarPassword" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" disabled={isSubmitting || isLoading} />
              <label htmlFor="recordarPassword" className="ml-2 block text-sm text-gray-700">
                Recordar Usuario
              </label>
            </div>

            {/* Error general */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </p>
              </div>
            )}

            {/* Botón de envío */}
            <button type="submit" disabled={isSubmitting || isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {isSubmitting || isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </div>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button type="button" onClick={() => navigate('/recuperar-password')} className="text-blue-600 hover:text-blue-700 font-medium text-sm focus:outline-none focus:underline">
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Enlaces adicionales */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <button type="button" className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline" onClick={() => navigate('/registro')}>
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Usuarios de Prueba:</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p>
                <strong>Admin:</strong> admin.sistema@gmail.com
              </p>
              <p>
                <strong>Soporte:</strong> soporte.tecnico@gmail.com
              </p>
              <p>
                <strong>Usuario:</strong> usuario.personal@gmail.com
              </p>
              <p className="text-blue-600 mt-2">
                <strong>Contraseña:</strong> password123
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2025 INCIBOT</p>
          <p>Proyecto Integrador</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
