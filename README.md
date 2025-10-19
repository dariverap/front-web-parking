# 🚗 Parking Management System - Frontend Web

<div align="center">

![Parking System](https://img.shields.io/badge/Parking-System-blue?style=for-the-badge&logo=react&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14.2.16-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)
[![GitHub stars](https://img.shields.io/github/stars/dariverap/parking-system-frontend?style=for-the-badge)](https://github.com/dariverap/parking-system-frontend/stargazers)

*🌟 Panel de administración web para gestión completa de estacionamientos*

[📖 Documentación](#-documentación) • [🚀 Instalación](#-instalación) • [🎯 Características](#-características) • [🤝 Contribuir](#-cómo-contribuir)

</div>

---

## 📋 Descripción del Proyecto

**Parking Management System - Frontend Web** es la interfaz de administración web del sistema completo de gestión de estacionamientos desarrollado para el curso de **Curso Integrador II: Sistemas** de la **UTP**. Construida con las últimas tecnologías web, ofrece una experiencia de usuario intuitiva y moderna para la gestión diaria de parkings, empleados, reservas y facturación.

Este frontend forma parte del sistema completo **Parking Management System**:
- 🖥️ **Frontend Web** (este proyecto) - Panel de administración
- 🔧 **Backend API** - API RESTful con Node.js
- 📱 **Mobile App** - App móvil para usuarios finales

### 🎯 ¿Qué puedes hacer con Parking Management System?

- 👥 **Gestión de Empleados**: Alta, baja y administración de personal
- 🅿️ **Administración de Parkings**: Crear y gestionar múltiples estacionamientos
- 💰 **Sistema de Tarifas**: Configurar precios por hora, día o tipo de vehículo
- 📊 **Dashboard en Tiempo Real**: Métricas de ocupación, ingresos y estadísticas
- 🔐 **Control de Accesos**: Sistema de roles y permisos granulares
- 📍 **Mapas Interactivos**: Ubicación geográfica de parkings con Leaflet

---

## 🎓 Información del Proyecto

**🏫 Universidad**: Universidad Tecnológica del Perú (UTP)  
**� Carrera**: Ingeniería de Sistemas  
**� Curso**: Curso Integrador II: Sistemas  
**👨‍🏫 Profesora**: CLAUDIA YOLANDA VILLALTA FLORES  
**📅 Año**: 2025  
**👥 Equipo**: Estudiantes de Ingeniería de Sistemas  

Este proyecto es parte del portafolio académico desarrollado durante el curso de **Curso Integrador II: Sistemas**, demostrando la aplicación práctica de conceptos aprendidos en desarrollo web, APIs RESTful, bases de datos y arquitectura de software.

---

## ✨ Características Principales

<div align="center">

| 🚀 **Rendimiento** | 🎨 **UI/UX** | 🔒 **Seguridad** | 📱 **Responsive** |
|:---:|:---:|:---:|:---:|
| Next.js 14 App Router | Shadcn/ui + Tailwind | JWT Authentication | Mobile-first Design |
| Server Components | Tema Dark/Light | Role-based Access | Progressive Web App |
| Optimized Bundling | Loading States | Secure API Calls | Cross-browser |

</div>

### 🔧 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **HTTP Client**: Axios con interceptores
- **Maps**: Leaflet (CDN) + OpenStreetMap
- **Forms**: React Hook Form + Zod validation
- **State**: React Hooks + Context API
- **Icons**: Lucide React

---

## 🚀 Instalación y Configuración

### 📋 Prerrequisitos

- Node.js >= 18.0.0
- pnpm, npm o yarn
- API Backend corriendo (ver [Backend API](https://github.com/dariverap/parking-system-api))

### ⚡ Instalación Rápida

```bash
# 1. Clonar el repositorio
git clone https://github.com/dariverap/front-web-parking.git
cd front-web-parking

# 2. Instalar dependencias
pnpm install
# o
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local

# 4. Editar .env.local con tus valores
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# 5. Ejecutar en desarrollo
pnpm dev
# o
npm run dev
```

### 🔧 Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# URL base del backend API
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Opcional: Configuración de mapas
NEXT_PUBLIC_MAPS_API_KEY=your_maps_api_key
```

### 📱 Scripts Disponibles

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "type-check": "tsc --noEmit"
}
```

---

## 🎯 Uso y Navegación

### 🔐 Roles de Usuario

| Rol | Descripción | Permisos |
|:---:|:---:|:---:|
| 👑 **admin_general** | Super administrador | Acceso completo a todo |
| 🏢 **admin_parking** | Admin de parking específico | Gestión de su parking asignado |
| 👷 **empleado** | Empleado operativo | Check-in/out, consultas básicas |
| 👤 **cliente** | Usuario final | Solo app móvil |

### 🗺️ Rutas Principales

- `/login` - Autenticación
- `/my-parkings` - Lista de parkings
- `/my-parkings/[id]` - Dashboard de parking específico
- `/employees` - Gestión de empleados
- `/settings` - Configuración de cuenta

---

## 🏗️ Arquitectura del Proyecto

### 📁 Estructura de Directorios

```
front-web-parking/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rutas de autenticación
│   ├── my-parkings/       # Gestión de parkings
│   ├── employees/         # Gestión de empleados
│   └── globals.css        # Estilos globales
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes base (shadcn)
│   ├── auth-guard.tsx    # Protección de rutas
│   └── breadcrumbs.tsx   # Navegación
├── lib/                  # Utilidades y configuración
│   ├── api.ts           # Cliente HTTP
│   ├── auth.ts          # Lógica de autenticación
│   └── validators.ts    # Validaciones de formularios
├── hooks/               # Custom hooks
├── public/              # Assets estáticos
└── styles/             # Estilos adicionales
```

### 🔄 Flujo de Autenticación

```mermaid
flowchart LR
    A[Usuario] --> B[/login]
    B --> C{Login valido?}
    C -->|Si| D[Guardar token]
    D --> E[Navegacion privada]
    C -->|No| F[Mostrar error]
```

---

## 🤝 Cómo Contribuir

¡Las contribuciones son bienvenidas! 🎉

### 📝 Guía de Contribución

1. **Fork** el proyecto
2. **Crea** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abre** un Pull Request

### 🐛 Reportar Issues

Si encuentras un bug o tienes una sugerencia:

1. Ve a [Issues](https://github.com/dariverap/front-web-parking/issues)
2. Crea un nuevo issue con el template correspondiente
3. Proporciona detalles claros y pasos para reproducir

### 📋 Estándares de Código

- Usa TypeScript estrictamente
- Sigue las convenciones de ESLint
- Escribe commits descriptivos
- Mantén la cobertura de tests

---

## 👥 Colaboradores

<div align="center">

| [<img src="https://github.com/dariverap.png" width="100px;"><br><sub><b>Diego Rivera</b></sub>](https://github.com/dariverap)<br><sub>🚀 Desarrollador Frontend & Arquitecto</sub> | [<img src="https://github.com/utp-student.png" width="100px;"><br><sub><b>Estudiante UTP</b></sub>](https://github.com/utp-student)<br><sub>🤝 Colaborador Backend</sub> |
|:---:|:---:|

**Proyecto desarrollado como parte del curso Curso Integrador II: Sistemas - UTP**

</div>

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🙋‍♂️ FAQ

### ❓ ¿Dónde configuro la URL del backend?
En el archivo `.env.local` usando la variable `NEXT_PUBLIC_API_URL`.

### ❓ ¿Puedo usar cookies httpOnly en vez de localStorage?
Sí, pero requerirá ajustes en el backend y en el flujo de autenticación.

### ❓ ¿Se puede desplegar en Vercel?
Sí, configura las variables de entorno en el panel de Vercel.

### ❓ ¿Cómo cambio el tema de la aplicación?
La aplicación soporta tema claro/oscuro automáticamente según las preferencias del sistema.

---

## 🚀 Roadmap

- [ ] 📊 Dashboard con métricas avanzadas
- [ ] 💳 Integración con pasarelas de pago
- [ ] 📱 Notificaciones push
- [ ] 🌍 Internacionalización (i18n)
- [ ] 📈 Reportes avanzados con gráficos
- [ ] 🔍 Búsqueda global con filtros
- [ ] 📧 Sistema de correos electrónicos
- [ ] 🎫 Sistema de tickets/reservas online

---

## 📞 Soporte Académico

- 📧 **Email**: diego.rivera@utp.edu.pe
- 💬 **Issues**: [GitHub Issues](https://github.com/dariverap/parking-system-frontend/issues)
- 📚 **Universidad**: Universidad Tecnológica del Perú (UTP)
- 📖 **Curso**: Curso Integrador II: Sistemas
- 👨‍🏫 **Profesora**: CLAUDIA YOLANDA VILLALTA FLORES

---

<div align="center">

**Proyecto académico desarrollado con ❤️ para el curso Curso Integrador II: Sistemas - UTP**

⭐ ¡Gracias por revisar nuestro proyecto!

[⬆️ Volver al inicio](#-parking-management-system---frontend-web)

</div>
