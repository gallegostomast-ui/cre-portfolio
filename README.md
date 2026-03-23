# Portfolio CRE — Frontend

Dashboard de gestión de portfolio inmobiliario para **Cosua Real Estate**.

## Stack

- **SvelteKit 5** con Svelte Runes (`$state`, `$derived`, `$effect`)
- **Tailwind CSS v4** con variables CSS personalizadas
- **TypeScript** estricto
- **svelte-adapter-bun** para producción
- **Bun** como runtime y package manager

## Estructura del proyecto

```
src/
├── hooks.server.ts          # Proxy server-side hacia la API interna
├── hooks.client.ts          # Manejo de errores client-side
├── lib/
│   ├── api/
│   │   └── client.ts        # Funciones de la API REST
│   ├── components/
│   │   ├── ExpenseModal.svelte
│   │   ├── MetricsBar.svelte
│   │   ├── PropertyCard.svelte
│   │   ├── PropertyModal.svelte
│   │   ├── SyncBar.svelte
│   │   ├── UserModal.svelte       # Crear usuario + QR TOTP
│   │   └── UsersListModal.svelte  # Listar y cambiar roles
│   ├── stores/
│   │   ├── auth.svelte.ts         # Sesión JWT (sessionStorage)
│   │   └── properties.svelte.ts  # Estado global de propiedades
│   ├── types.ts             # Interfaces TypeScript
│   └── utils.ts             # Formatters, labels, cálculos financieros
└── routes/
    ├── +layout.svelte       # Guard de autenticación
    ├── +page.svelte         # Dashboard principal
    └── login/
        └── +page.svelte     # Login (credentials + TOTP)
```

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PUBLIC_API_URL` | URL base que usa el browser (siempre `/proxy-api`) | `/proxy-api` |
| `INTERNAL_API_URL` | URL real de la API, usada por el servidor SvelteKit para el proxy | `http://cosua-cre-api:3000` |

El archivo `.env` no se commitea. Copiar `.env.example`:

```bash
cp .env.example .env
```

## Desarrollo local

```bash
bun install
bun run dev
```

El `.env` local debe apuntar a la API en localhost:

```
PUBLIC_API_URL=/proxy-api
INTERNAL_API_URL=http://localhost:3000
```

> En dev, Vite intercepta `/proxy-api` con su proxy integrado (ver `vite.config.ts`).
> El hook de `hooks.server.ts` solo actúa en producción.

## Docker

```bash
# Build para producción (linux/amd64)
make build

# Build local (arquitectura nativa)
make local

# Build + push a Google Artifact Registry
make push
```

La imagen expone el puerto `8083`. La variable `INTERNAL_API_URL` se puede sobreescribir en `docker run` o `docker-compose`:

```bash
docker run -p 8083:8083 -e INTERNAL_API_URL=http://mi-api:3000 <imagen>
```

## Autenticación

Login en dos pasos:
1. `POST /auth/login` → devuelve `partial_token`
2. `POST /auth/totp` → devuelve JWT completo

El JWT se guarda en `sessionStorage` (no persiste entre tabs ni cierra de browser).

## Roles

| Rol | Permisos |
|---|---|
| `admin` | Todo: crear/eliminar propiedades, usuarios y gastos |
| `operator` | Editar propiedades y gestionar gastos (sin crear/eliminar) |
| `viewer` | Solo lectura |

## API backend

Repositorio: `api.cosua.cre` — Hono + Bun + PostgreSQL.

Endpoints relevantes:

```
GET    /                    Health check
POST   /auth/login
POST   /auth/totp
GET    /properties
POST   /properties
PATCH  /properties/:id
DELETE /properties/:id
GET    /expenses
POST   /expenses
PATCH  /expenses/:id
DELETE /expenses/:id
GET    /users               (admin)
POST   /users               (admin)
PATCH  /users/:id           (admin)
DELETE /users/:id           (admin)
GET    /meta
```
