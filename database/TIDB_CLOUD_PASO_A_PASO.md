# Migrar Tigre Burger POS a TiDB Cloud

Archivo preparado para importar:

`database/tigre_burger_pos_tidb.sql`

Este archivo crea la base `tigre_burger_pos`, crea las 11 tablas e importa los datos del POS. Por privacidad, crea `whatsapp_messages` vacía y no sube las conversaciones del respaldo.

> Importante: el script elimina y vuelve a crear las tablas de `tigre_burger_pos`. Úsalo sobre una instancia nueva o cuando quieras reemplazar por completo esas tablas.

## 1. Crear la instancia

1. Entra a <https://tidbcloud.com/> y crea una cuenta o inicia sesión.
2. Crea un proyecto y luego una instancia **TiDB Cloud Starter**.
3. Elige la región más cercana disponible.
4. Espera a que la instancia aparezca como disponible.

## 2. Obtener la conexión

1. Abre la instancia y pulsa **Connect**.
2. Elige **Public Endpoint** y habilítalo si todavía está desactivado.
3. Crea o copia la contraseña del usuario de la base de datos.
4. En la opción de conexión **MySQL CLI**, copia los valores de host, puerto y usuario. Normalmente el puerto es `4000`.
5. Descarga el certificado CA si el comando mostrado por TiDB incluye `--ssl-ca`.

No compartas la contraseña ni la guardes en Git.

## 3. Instalar el cliente MySQL en Windows

Comprueba primero si ya está instalado:

```powershell
mysql --version
```

Si Windows no reconoce el comando, instala **MySQL Shell** o **MySQL Community Server** desde <https://dev.mysql.com/downloads/> y vuelve a abrir PowerShell.

## 4. Importar el archivo

Abre PowerShell en `D:\tiendatigre`. Usa el comando que TiDB Cloud muestra en **Connect > MySQL CLI** y agrega la redirección del archivo al final. Ejemplo:

```powershell
cmd /c "mysql --comments --connect-timeout 150 -u '<USUARIO>' -h '<HOST>' -P 4000 --ssl-mode=VERIFY_IDENTITY --ssl-ca='<RUTA_CA>' -p < database\tigre_burger_pos_tidb.sql"
```

El cliente pedirá la contraseña. No la escribas dentro del comando. Si el comando copiado de TiDB no usa un archivo CA, conserva exactamente sus opciones SSL y agrega solamente:

```text
< database\tigre_burger_pos_tidb.sql
```

## 5. Verificar la migración

Conéctate con el mismo comando, ya sin la redirección, y ejecuta:

```sql
USE tigre_burger_pos;
SHOW TABLES;
SELECT COUNT(*) AS productos FROM productos;
SELECT COUNT(*) AS categorias FROM categorias;
SELECT COUNT(*) AS ventas FROM ventas;
SELECT COUNT(*) AS mensajes_privados FROM whatsapp_messages;
```

El respaldo revisado contiene **32 productos** y **6 categorías**. `mensajes_privados` debe devolver `0` en la versión preparada.

## 6. Conectar el backend

En `backend/.env`, usa los datos mostrados por TiDB Cloud:

```dotenv
DB_HOST=<HOST_DE_TIDB>
DB_PORT=4000
DB_USER=<USUARIO_DE_TIDB>
DB_PASSWORD=<CONTRASEÑA_DE_TIDB>
DB_NAME=tigre_burger_pos
```

TiDB Cloud exige conexión TLS. Antes de desplegar el backend, hay que configurar `mysql2` para usar el certificado CA o la configuración SSL indicada por el panel de conexión.

## 7. Comprobación final desde el sistema

1. Inicia el backend.
2. Confirma en la consola que la conexión a la base de datos fue exitosa.
3. Abre Productos y comprueba que aparezcan los 32 registros.
4. Prueba iniciar sesión y crear una venta de prueba.

Las rutas de imágenes de los productos apuntan a `/uploads/products/...`; migrar SQL no sube esos archivos. Los archivos deben permanecer en el servidor del backend o moverse posteriormente a almacenamiento persistente.
