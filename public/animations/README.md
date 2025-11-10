# Animaciones para Parking System

Esta carpeta contiene todas las animaciones GIF usadas en la aplicación web.

## Archivos requeridos

### 1. **loading.gif** (Opcional)
- **Uso**: Estado de carga en modales y listados
- **Tamaño recomendado**: 200x200px
- **Duración**: 1-2 segundos loop
- **Tema**: Spinner, reloj, cargando
- **Descarga sugerida**: https://loading.io/ o https://tenor.com/search/loading-gifs

### 2. **success.gif** (Requerido)
- **Uso**: Confirmación de acciones exitosas (reserva creada, pago procesado, etc.)
- **Tamaño recomendado**: 300x300px
- **Duración**: 2-3 segundos
- **Tema**: Check animado, confetti, celebración
- **Descarga sugerida**: https://tenor.com/search/success-gifs o https://giphy.com/search/success

### 3. **empty-reservations.gif** (Requerido)
- **Uso**: Cuando no hay reservas activas
- **Tamaño recomendado**: 400x400px
- **Duración**: 3-4 segundos loop
- **Tema**: Calendario vacío, sin datos, esperando
- **Descarga sugerida**: https://storyset.com/ (illustrations animadas)

### 4. **empty-parking.gif** (Requerido)
- **Uso**: Cuando no hay vehículos dentro del parking
- **Tamaño recomendado**: 400x400px
- **Duración**: 3-4 segundos loop
- **Tema**: Parking vacío, sin carros
- **Descarga sugerida**: https://storyset.com/ o https://lottiefiles.com/

### 5. **empty.gif** (Genérico - Opcional)
- **Uso**: Estado vacío genérico
- **Tamaño recomendado**: 400x400px
- **Duración**: 3-4 segundos loop
- **Tema**: Caja vacía, sin contenido

## Alternativa: Usar Lottie

Si prefieres animaciones más ligeras y escalables, puedes usar **Lottie** (.json):

1. Instalar: `npm install lottie-react`
2. Descargar animaciones de: https://lottiefiles.com/
3. Modificar los componentes para usar `<Lottie>` en lugar de `<img>`

## Recursos recomendados (gratuitos)

- **LottieFiles**: https://lottiefiles.com/ (JSON animations)
- **Storyset**: https://storyset.com/ (Ilustraciones animadas)
- **Tenor**: https://tenor.com/ (GIFs)
- **GIPHY**: https://giphy.com/ (GIFs)
- **Flaticon**: https://www.flaticon.com/animated-icons (Iconos animados)
- **Loading.io**: https://loading.io/ (Spinners y loaders)

## Optimización

Para optimizar los GIFs y reducir tamaño:
- **Herramienta online**: https://ezgif.com/optimize
- **Reducir colores**: 64 o 128 colores suele ser suficiente
- **Reducir frames**: 15-20 FPS es suficiente para web
- **Comprimir**: Usar compresión LZW

## Nota

Si no tienes GIFs aún, los componentes funcionarán con iconos por defecto.
Solo establece `useAnimation={false}` o deja los GIFs para después.
