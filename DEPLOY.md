# Cómo publicar Hotel Los Robles en Render

Tu proyecto tiene **frontend** (Vite + React) y **backend** (FastAPI). En Render desplegarás **dos servicios** y, si quieres, una base de datos.

---

## Opción A: Despliegue manual (recomendado la primera vez)

### 1. Subir el código

- Crea un repositorio en **GitHub** (o GitLab) con tu proyecto.
- Conecta ese repositorio a tu cuenta de [Render](https://render.com).

### 2. Crear el Backend (API)

1. En Render: **Dashboard** → **New** → **Web Service**.
2. Conecta el repositorio del hotel.
3. Configura:
   - **Name:** `hotel-robles-api` (o el que prefieras).
   - **Root Directory:** `backend`.
   - **Runtime:** Python 3.
   - **Build Command:**  
     `pip install -r requirements.txt`
   - **Start Command:**  
     `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. En **Environment** añade:

   | Variable                    | Valor / Notas |
   |-----------------------------|---------------|
   | `SQLALCHEMY_DATABASE_URL`   | URL de tu MySQL remoto. Ver sección “Base de datos” más abajo. |
   | `CORS_ORIGINS`     | URL del frontend en Render, ej: `https://hotel-robles-web.onrender.com` (sin barra final). Si tienes dominio propio, añádelo separado por coma. |
   | `SMTP_HOST`        | ej: `smtp.gmail.com` |
   | `SMTP_PORT`        | `587` |
   | `SMTP_USER`        | tu correo |
   | `SMTP_PASSWORD`    | contraseña de aplicación |
   | `FROM_EMAIL`       | mismo correo que SMTP_USER |

5. Crea el servicio. Anota la URL del backend (ej: `https://hotel-robles-api.onrender.com`).

### 3. Crear el Frontend (web estática)

1. **New** → **Static Site**.
2. Mismo repositorio.
3. Configura:
   - **Name:** `hotel-robles-web`.
   - **Root Directory:** (dejar vacío para usar la raíz del repo).
   - **Build Command:**  
     `npm install && npm run build`
   - **Publish Directory:**  
     `dist`
4. En **Environment** añade:

   | Variable        | Valor |
   |-----------------|--------|
   | `VITE_API_BASE` | URL del backend de Render (ej: `https://hotel-robles-api.onrender.com`) **sin** barra final. |

5. Guarda y despliega. La URL del sitio será algo como `https://hotel-robles-web.onrender.com`.

### 4. Base de datos

**Opción recomendada: MySQL remoto**

Si ya tienes (o vas a crear) un MySQL en la nube:

1. Crea la base de datos en tu proveedor (Railway, PlanetScale, Aiven, AWS RDS, etc.).
2. Crea las tablas ejecutando tu `schema.sql` o deja que el backend las cree al arrancar (`Base.metadata.create_all`).
3. En el **servicio backend** en Render, añade:
   - **Key:** `SQLALCHEMY_DATABASE_URL`
   - **Value:**  
     `mysql+mysqlconnector://USUARIO:CONTRASEÑA@HOST:3306/NOMBRE_BD`
   - Si la contraseña tiene caracteres especiales (`@`, `#`, `?`, etc.), codifícalos en URL (ej: `@` → `%40`, `#` → `%23`).

   **Ejemplos:**
   - Railway: `mysql+mysqlconnector://root:xxxxx@containers-us-west-xxx.railway.app:3306/railway`
   - Servidor propio: `mysql+mysqlconnector://hotel:miClave@midominio.com:3306/hotel_robles`

**Opción alternativa: PostgreSQL en Render (gratis)**

1. **New** → **PostgreSQL** en Render.
2. Crea la base y copia **Internal Database URL**.
3. En el backend, variable **`DATABASE_URL`** = esa URL (Render inyecta `postgres://...`; el código la convierte a `postgresql://`).
4. Las tablas se crean al arrancar; el esquema es compatible.

### 5. CORS

Cuando tengas la URL del frontend en Render:

- En el **backend** (Environment), pon en `CORS_ORIGINS` esa URL, por ejemplo:  
  `https://hotel-robles-web.onrender.com`  
  Si usas dominio propio, añádelo:  
  `https://hotel-robles-web.onrender.com,https://tudominio.com`

### 6. Archivos subidos (uploads)

En Render el disco es efimero: lo que subas por la API (imagenes de habitaciones, salones, galeria, etc.) se pierde al reiniciar el servicio.

El backend ya soporta almacenamiento externo S3-compatible (incluye Hostinger Object Storage). Para activarlo en produccion, agrega estas variables en el servicio backend:

| Variable | Valor / Notas |
|---|---|
| `STORAGE_BACKEND` | `s3` |
| `S3_ENDPOINT_URL` | Endpoint S3 de Hostinger (sin slash final). |
| `S3_BUCKET` | Nombre del bucket. |
| `S3_ACCESS_KEY_ID` | Access key. |
| `S3_SECRET_ACCESS_KEY` | Secret key. |
| `S3_REGION` | Opcional, segun tu bucket. |
| `S3_PUBLIC_BASE_URL` | Opcional. URL publica base (CDN/custom domain). Si no se define, usa `S3_ENDPOINT_URL/S3_BUCKET`. |

Si no defines `STORAGE_BACKEND=s3`, el backend sigue en modo local (`/uploads`).

---

## Opción B: Blueprint (render.yaml)

En el repo hay un `render.yaml` de ejemplo. Puedes usarlo así:

1. En Render: **Dashboard** → **New** → **Blueprint**.
2. Conectas el repositorio y seleccionas el **Blueprint** que apunta a `render.yaml`.
3. Render creará los dos servicios (API y Static Site). Después debes:
   - Crear y enlazar la base de datos (PostgreSQL o MySQL) y poner `DATABASE_URL` (o `SQLALCHEMY_DATABASE_URL`) en el servicio API.
   - Rellenar en el servicio API: `CORS_ORIGINS`, variables SMTP y, si aplica, `FROM_EMAIL`.
   - En el Static Site, poner `VITE_API_BASE` con la URL del backend.

---

## Resumen de variables

**Backend (API)**  
- `PORT` – Lo asigna Render; no lo definas tú.  
- **MySQL remoto:** `SQLALCHEMY_DATABASE_URL` = `mysql+mysqlconnector://usuario:contraseña@host:3306/nombre_bd`  
- **PostgreSQL (Render):** `DATABASE_URL` = la URL que te da Render.  
- `CORS_ORIGINS` – URL(s) del frontend separadas por coma.  
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `FROM_EMAIL`.
- Uploads local/remoto:
  - local (default): `UPLOAD_ROOT` (opcional)
  - Hostinger/S3: `STORAGE_BACKEND=s3`, `S3_ENDPOINT_URL`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION` (opcional), `S3_PUBLIC_BASE_URL` (opcional)

**Frontend (Static Site)**  
- `VITE_API_BASE` – URL del backend (ej: `https://hotel-robles-api.onrender.com`), sin barra final.

Con esto puedes publicar el proyecto en Render y que frontend y backend se comuniquen correctamente.
