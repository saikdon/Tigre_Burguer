# Acceso desde la red local (LAN)

## URLs

| Entorno | Local | Red local |
|---|---|---|
| Backend (API) | http://localhost:4000 | http://IP_DEL_SERVIDOR:4000 |
| Frontend (dev) | http://localhost:5173 | http://IP_DEL_SERVIDOR:5173 |

Al iniciar el backend, la consola muestra la IP local detectada automaticamente.

## Puerto en el Firewall de Windows

Para acceder desde otros dispositivos en la misma red WiFi, necesitas abrir los puertos en el Firewall de Windows:

### Puerto 4000 (backend/API)
```powershell
# Como Administrador
netsh advfirewall firewall add rule name="Tigre Backend 4000" dir=in action=allow protocol=TCP localport=4000
```

### Puerto 5173 (frontend dev)
```powershell
# Como Administrador  
netsh advfirewall firewall add rule name="Tigre Frontend 5173" dir=in action=allow protocol=TCP localport=5173
```

### Eliminar reglas (si ya no se necesitan)
```powershell
netsh advfirewall firewall delete rule name="Tigre Backend 4000"
netsh advfirewall firewall delete rule name="Tigre Frontend 5173"
```

## Acceder desde otro dispositivo

1. Conectate a la misma red WiFi
2. Abre el navegador en el otro dispositivo
3. Ingresa: `http://IP_DEL_SERVIDOR:5173` (desarrollo) o `http://IP_DEL_SERVIDOR:4000` (produccion)
4. La IP aparece en la consola del backend al iniciar

## Variables de entorno

### Backend (`backend/.env`)
```
PORT=4000
HOST=0.0.0.0
```

### Frontend (`frontend/.env`)
```
VITE_SOCKET_URL=http://192.168.x.x:4000
```
Si no se define, el frontend usa `window.location.origin` como URL del Socket.IO.
