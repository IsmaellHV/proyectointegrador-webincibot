# APLICACIÓN WEB DE CHATBOT PARA SOPORTE INTERNO Y GESTIÓN DE INCIDENCIAS
## InciBot

### Descripción del Proyecto

InciBot es una aplicación web innovadora diseñada para optimizar el soporte interno y la gestión eficiente de incidencias en organizaciones. Esta plataforma integra un sistema de chatbot inteligente con herramientas de administración que permiten un manejo centralizado y automatizado de solicitudes de soporte técnico.

### Información Académica

**Instituto:** Cibertec  
**Curso:** Proyecto Integrador  
**Tipo de Proyecto:** Aplicación Web Full-Stack  

### Características Principales

#### Sistema de Chatbot Inteligente
- Interfaz conversacional intuitiva para usuarios finales
- Procesamiento automatizado de consultas de soporte
- Respuestas contextuales y personalizadas
- Escalamiento automático a agentes humanos cuando es necesario

#### Gestión de Incidencias
- Registro y seguimiento centralizado de incidencias
- Categorización automática de problemas
- Sistema de priorización y asignación
- Historial completo de interacciones

#### Panel de Administración
- Dashboard ejecutivo con métricas en tiempo real
- Gestión de usuarios y permisos
- Configuración del sistema de chatbot
- Reportes y análisis de rendimiento

#### Autenticación y Seguridad
- Sistema de autenticación seguro
- Control de acceso basado en roles
- Protección de datos sensibles
- Sesiones seguras y encriptadas

### Tecnologías Utilizadas

#### Frontend
- **React 18** con TypeScript para una interfaz moderna y tipada
- **Vite** como herramienta de desarrollo y construcción
- **Tailwind CSS** para diseño responsivo y estilizado
- **Zustand** para gestión de estado global
- **React Router** para navegación SPA

#### Backend
- **Node.js** con Express.js para API RESTful
- **TypeScript** para desarrollo backend tipado
- **Supabase** como backend-as-a-service
- **PostgreSQL** como base de datos principal

#### Infraestructura y Herramientas
- **Supabase Auth** para autenticación y autorización
- **Supabase Realtime** para actualizaciones en tiempo real
- **ESLint** y **Prettier** para calidad de código
- **Vercel** para despliegue y hosting

### Estructura del Proyecto

#### Organización de Directorios
- **`/src`** - Código fuente del frontend React
  - **`/components`** - Componentes reutilizables de la interfaz
  - **`/pages`** - Páginas principales de la aplicación
  - **`/hooks`** - Hooks personalizados de React
  - **`/store`** - Gestión de estado con Zustand
  - **`/lib`** - Utilidades y configuraciones
  - **`/types`** - Definiciones de tipos TypeScript

- **`/api`** - Código del servidor backend
  - **`/routes`** - Rutas y endpoints de la API
  - Lógica de negocio y controladores

- **`/supabase`** - Configuración de base de datos
  - **`/migrations`** - Scripts de migración SQL
  - Esquemas y políticas de seguridad

#### Páginas Principales
- **Inicio** - Landing page y presentación del sistema
- **Autenticación** - Login y registro de usuarios
- **Dashboard** - Panel principal con métricas y resumen
- **Chatbot** - Interfaz de conversación con el bot
- **Incidencias** - Gestión y seguimiento de tickets
- **Usuarios** - Administración de cuentas de usuario
- **Soporte** - Herramientas para agentes de soporte
- **Administración** - Panel de configuración del sistema

### Objetivos del Proyecto

1. **Automatización del Soporte:** Reducir la carga de trabajo manual mediante respuestas automatizadas inteligentes
2. **Mejora de la Experiencia del Usuario:** Proporcionar una interfaz intuitiva y respuestas rápidas
3. **Centralización de Incidencias:** Unificar todos los canales de soporte en una plataforma única
4. **Análisis y Métricas:** Generar insights valiosos sobre patrones de soporte y rendimiento
5. **Escalabilidad:** Diseñar una arquitectura que permita crecimiento futuro

### Beneficios Esperados

- **Reducción de Tiempos de Respuesta:** Atención inmediata 24/7 a través del chatbot
- **Mejora en la Satisfacción del Usuario:** Resolución más rápida y eficiente de problemas
- **Optimización de Recursos:** Mejor distribución de la carga de trabajo del equipo de soporte
- **Trazabilidad Completa:** Registro detallado de todas las interacciones y resoluciones
- **Toma de Decisiones Informada:** Dashboards con métricas clave para la gestión

---

*Este proyecto representa la culminación del aprendizaje en desarrollo full-stack, integrando tecnologías modernas para crear una solución práctica y escalable en el ámbito del soporte técnico empresarial.*
