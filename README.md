# Tigre Burger POS

Sistema de punto de venta con React, Express, Socket.IO y una base de datos MySQL/TiDB.

## Desarrollo local

```powershell
cd backend
npm install
npm run dev
```

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

## Despliegue

El archivo `render.yaml` configura un servicio web de Render que compila el frontend y lo sirve desde la API Express. La base de datos se aloja externamente en TiDB Cloud y requiere las variables secretas `DB_HOST`, `DB_USER` y `DB_PASSWORD`.
# Tigre Burger POS

## Catálogo y reservas públicas

El catálogo público está disponible en `/catalogo`. En un despliegue donde el frontend y el backend se sirven desde el mismo origen, no requiere configuración adicional.

Si el frontend se publica en otro proveedor, por ejemplo Vercel, se debe configurar en ese proveedor la variable de entorno `VITE_API_BASE_URL` con la URL base pública del backend, sin agregar `/api`. También se debe permitir el dominio del frontend en `CORS_ORIGIN` del backend. Esto evita que el catálogo intente usar una ruta `/api` que no existe en el hosting estático.
