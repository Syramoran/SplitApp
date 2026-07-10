# SplitApp

Gastos personales y compartidos en un solo lugar. **La plata en orden. La amistad, intacta ✳**

Une dos mundos que hoy viven en apps separadas: el tracking de gastos personales y la
división de gastos en grupo — sin paywalls en lo core, sin obligar a nadie a registrarse.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18 + Vite + Tailwind CSS + React Router + TanStack Query |
| Backend | NestJS 10 (REST) + TypeORM + class-validator + Swagger |
| Base de datos | PostgreSQL 13+ |
| Auth | JWT (bearer) + bcrypt |

```
splitapp/
├── backend/    → API NestJS (puerto 3000, prefijo /api)
└── frontend/   → SPA React (puerto 5173)
```

## Requisitos

- Node.js 20+
- PostgreSQL 13 o superior (usa `gen_random_uuid()` nativo)
- npm

## Levantar el proyecto localmente

### 1. Base de datos

Creá una base vacía:

```sql
CREATE DATABASE splitapp;
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # completá DB_USER / DB_PASSWORD / JWT_SECRET
npm install
npm run migration:run     # crea el schema (tablas + categorías)
npm run seed              # datos demo del prototipo (opcional pero recomendado)
npm run start:dev         # http://localhost:3000/api
```

La documentación interactiva de la API queda en **http://localhost:3000/api/docs** (Swagger).

### 3. Frontend

```bash
cd frontend
cp .env.example .env      # VITE_API_URL ya apunta al backend local
npm install
npm run dev               # http://localhost:5173
```

### 4. Entrar

Con el seed cargado:

- **Email:** `agos@splitapp.test`
- **Contraseña:** `password123`

Vas a ver el estado del prototipo: el grupo *Depto Palermo* con Fede debiéndote $8.500,
la meta *Viaje a Brasil* al 34%, los recurrentes activos y los insights de julio.

## Variables de entorno

### backend/.env

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto de la API (default 3000) |
| `FRONTEND_URL` | Origen permitido para CORS |
| `DATABASE_URL` | URL completa de Postgres (tiene prioridad si está definida) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Conexión por partes |
| `DB_SSL` | `true` en producción (Railway), `false` local |
| `JWT_SECRET` | Secret de firma de tokens — generá uno: `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Vencimiento del token (default `7d`) |

### frontend/.env

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL base de la API, incluyendo `/api` |

## Comandos útiles

```bash
# Backend
npm test                  # tests unitarios (settle-up, balances, crear gasto/grupo)
npm run lint              # ESLint
npm run build             # compila a dist/
npm run migration:run     # aplica migraciones pendientes
npm run seed              # recarga los datos demo (borra todo antes)

# Frontend
npm run build             # typecheck estricto + build de producción
npm run lint
```

## Decisiones de diseño clave

- **Los balances nunca se persisten**: se derivan siempre de `expense_splits` −
  `settlements`. Así todo número es explicable con un tap (los ítems que lo componen)
  y no puede desincronizarse.
- **Miembros "fantasma"**: `group_members.user_id` es nullable — un participante puede
  existir solo con un nombre, sin cuenta. Cuando exista invitación real, se completa
  el `user_id` sin migrar nada.
- **Settle-up**: algoritmo greedy de mínimas transferencias (máx. n−1), testeado en
  `backend/src/settlements/simplify.service.spec.ts`.
- **Redondeo**: los montos van en `NUMERIC(14,2)`; los centavos sobrantes de una
  división los absorbe quien pagó, así las partes siempre suman el total exacto.
- **Recurrentes**: plantillas en `recurring_expenses` materializadas por un cron diario
  (03:00) que carga las que correspondan al mes en curso.
- **Lenguaje de equipo**: el microcopy evita "deuda/morosidad" — "están a mano",
  "te toca poner", "Fede te pasa a vos".

## Fuera de este MVP

Escaneo de tickets, conversión multi-moneda real, modo offline, exportación PDF/planilla,
invitación por link y push notifications — el prototipo los marca como demo o iteración
siguiente. La moneda del grupo sí se guarda para no migrar datos después.

## Deploy

Ver [DEPLOY.md](DEPLOY.md) — Vercel (frontend) + Railway (backend + Postgres), con CI/CD
automático en cada push a `main`.
