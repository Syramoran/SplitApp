# DEPLOY — SplitApp en producción con el menor esfuerzo posible

Frontend en **Vercel**, backend + PostgreSQL en **Railway**. Ambas plataformas hacen
deploy automático en cada push a `main`, así que el CI/CD sale casi gratis.

> Nota: el pedido original mencionaba "migraciones de Prisma", pero el stack fijo del
> proyecto es **TypeORM** — acá se documentan las migraciones de TypeORM.

Requisito previo: el repo subido a GitHub.

```bash
git remote add origin git@github.com:TU_USUARIO/splitapp.git
git push -u origin main
```

---

## 1. Backend + base de datos en Railway

### 1.1 Crear el proyecto

1. Entrá a [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → elegí `splitapp`.
2. En la config del servicio, **Settings → Root Directory: `backend`** (monorepo).
3. Agregá la base: **+ New → Database → PostgreSQL**. Railway crea el servicio y expone
   `DATABASE_URL` como variable referenciable.

### 1.2 Variables de entorno del servicio backend

En **Variables** del servicio backend:

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referencia al servicio Postgres) |
| `DB_SSL` | `true` |
| `JWT_SECRET` | uno real: `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | la URL de Vercel (paso 2.3 — podés volver a completarla después) |
| `PORT` | Railway la inyecta sola; no hace falta definirla |

### 1.3 Build, migraciones y arranque

En **Settings** del servicio backend:

- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm run migration:run:prod && npm run start`

Con eso **las migraciones corren automáticamente en cada deploy**, antes de levantar la
API (`migration:run:prod` usa el DataSource compilado en `dist/`, sin ts-node). Es
idempotente: si no hay migraciones nuevas, no hace nada.

Para cargar los datos demo una única vez (opcional), desde tu máquina apuntando a la DB
de Railway:

```bash
cd backend
DATABASE_URL="postgresql://...railway..." DB_SSL=true npm run seed
```

(la URL pública está en la pestaña **Connect** del servicio Postgres).

### 1.4 Dominio público de la API

**Settings → Networking → Generate Domain** → obtenés algo como
`splitapp-backend-production.up.railway.app`. La API queda en
`https://<dominio>/api` y Swagger en `https://<dominio>/api/docs`.

---

## 2. Frontend en Vercel

### 2.1 Importar el proyecto

1. [vercel.com](https://vercel.com) → **Add New → Project** → importá el repo `splitapp`.
2. **Root Directory: `frontend`** (Vercel detecta Vite solo; build `npm run build`,
   output `dist`).

### 2.2 Variable de entorno

En **Settings → Environment Variables**:

| Variable | Valor |
| --- | --- |
| `VITE_API_URL` | `https://<tu-dominio-railway>.up.railway.app/api` |

⚠️ Las variables `VITE_*` se inyectan **en build time**: si la cambiás, hacé **Redeploy**.

### 2.3 SPA fallback

Para que React Router funcione al recargar rutas profundas (`/groups/123`), creá
`frontend/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 2.4 Cerrar el círculo de CORS

Copiá el dominio que te dio Vercel (ej. `https://splitapp.vercel.app`) y ponelo en la
variable `FRONTEND_URL` del backend en Railway. El backend usa exactamente ese origen
para CORS (`app.enableCors({ origin: FRONTEND_URL })`), así que:

- sin barra final (`https://splitapp.vercel.app`, no `.../`),
- si después agregás un dominio propio, actualizá `FRONTEND_URL`.

Railway redeploya solo al cambiar la variable.

---

## 3. CI/CD

Ya quedó configurado por defecto:

- **Vercel**: cada push a `main` → build + deploy del frontend. Cada PR genera un
  *Preview Deployment* con URL propia.
- **Railway**: cada push a `main` → build + `migration:run:prod` + restart de la API.

Opcional pero recomendado — correr los tests antes de que llegue a deploy, con GitHub
Actions (`.github/workflows/ci.yml`):

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
        working-directory: backend
      - run: npm test
        working-directory: backend
      - run: npm ci
        working-directory: frontend
      - run: npm run build
        working-directory: frontend
```

En Vercel y Railway podés activar *"wait for CI"* para que el deploy espere el verde.

---

## 4. Checklist final

- [ ] `https://<railway>/api/docs` responde (API viva + migraciones aplicadas)
- [ ] `POST /api/auth/login` con el usuario seed devuelve token
- [ ] El frontend de Vercel carga y logea sin errores de CORS en la consola
- [ ] `JWT_SECRET` de producción no es el del `.env.example`
- [ ] `FRONTEND_URL` apunta al dominio real de Vercel
