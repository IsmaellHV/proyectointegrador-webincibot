import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './store/authStore'
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Registro from './pages/Registro'
import RecuperarPassword from './pages/RecuperarPassword'
import Dashboard from './pages/Dashboard'
import Chatbot from './pages/Chatbot'
import Incidencias from './pages/Incidencias'
import Soporte from './pages/Soporte'
import Usuarios from './pages/Usuarios'
import Admin from './pages/Admin'

// Páginas placeholder que crearemos después

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-700 mb-4">Página no encontrada</h2>
      <p className="text-gray-600 mb-8">La página que buscas no existe o ha sido movida.</p>
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Volver
      </button>
    </div>
  </div>
)

function App() {
  // Removemos la llamada manual a checkAuth() para evitar bucles infinitos
  // El authStore se inicializará automáticamente cuando sea necesario

  return (
    <Router>
      <div className="App">
        {/* Configuración de notificaciones */}
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          duration={4000}
        />
        
        <Routes>
          {/* Rutas públicas */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/registro" 
            element={
              <PublicRoute>
                <Registro />
              </PublicRoute>
            } 
          />
          <Route 
            path="/recuperar-password" 
            element={
              <PublicRoute>
                <RecuperarPassword />
              </PublicRoute>
            } 
          />
          
          {/* Rutas protegidas con layout */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard - Accesible para todos los roles autenticados */}
            <Route 
              index 
              element={<Navigate to="/dashboard" replace />} 
            />
            <Route 
              path="dashboard" 
              element={
                <ProtectedRoute allowedRoles={['personal', 'soporte', 'administrador']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Chatbot - Accesible para todos los roles */}
            <Route 
              path="chatbot" 
              element={
                <ProtectedRoute allowedRoles={['personal', 'soporte', 'administrador']}>
                  <Chatbot />
                </ProtectedRoute>
              } 
            />
            
            {/* Incidencias - Accesible para todos los roles */}
            <Route 
              path="incidencias" 
              element={
                <ProtectedRoute allowedRoles={['personal', 'soporte', 'administrador']}>
                  <Incidencias />
                </ProtectedRoute>
              } 
            />
            
            {/* Soporte - Solo para soporte y administrador */}
            <Route 
              path="soporte" 
              element={
                <ProtectedRoute allowedRoles={['soporte', 'administrador']}>
                  <Soporte />
                </ProtectedRoute>
              } 
            />
            
            {/* Usuarios - Solo para administrador */}
            <Route 
              path="usuarios" 
              element={
                <ProtectedRoute allowedRoles={['administrador']}>
                  <Usuarios />
                </ProtectedRoute>
              } 
            />
            
            {/* Administración - Solo para administrador */}
            <Route 
              path="admin" 
              element={
                <ProtectedRoute allowedRoles={['administrador']}>
                  <Admin />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          {/* Ruta 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App