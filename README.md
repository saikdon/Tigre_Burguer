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
