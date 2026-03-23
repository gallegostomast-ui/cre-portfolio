# Guía para el agente de IA — Portfolio CRE Frontend

## Descripción del proyecto

Frontend del sistema de gestión de portfolio inmobiliario **Cosua Real Estate**.
Permite registrar propiedades, gastos, calcular rentabilidad y gestionar usuarios con roles.

## Reglas importantes

- **Siempre responder en español**
- **No crear archivos nuevos** salvo que sea estrictamente necesario
- **No agregar comentarios** que solo describan lo que hace el código
- Usar **Svelte 5 Runes** (`$state`, `$derived`, `$effect`, `$props`) — nunca la API de Svelte 4
- Usar **Tailwind CSS v4** — las clases usan variables CSS `var(--color-*)` para colores dinámicos
- Para colores dinámicos en clases Tailwind, usar `style` attribute en lugar de clases dinámicas

## Arquitectura de red

```
Browser → HTTPS → SvelteKit (:8083) → HTTP → API interna (:3000)
```

- `PUBLIC_API_URL=/proxy-api` siempre (baked-in en el build, nunca cambia)
- `INTERNAL_API_URL` configura el destino real del proxy en el servidor SvelteKit
- El proxy está implementado en `src/hooks.server.ts`
- En dev, Vite intercepta `/proxy-api` con su proxy (ver `vite.config.ts`)

## Archivos clave

| Archivo | Rol |
|---|---|
| `src/hooks.server.ts` | Proxy server-side `/proxy-api → INTERNAL_API_URL` |
| `src/lib/api/client.ts` | Todas las funciones de llamada a la API REST |
| `src/lib/stores/auth.svelte.ts` | Sesión del usuario (JWT en sessionStorage) |
| `src/lib/stores/properties.svelte.ts` | Estado global de propiedades y gastos |
| `src/lib/types.ts` | Tipos TypeScript de toda la app |
| `src/lib/utils.ts` | `fmtUSD`, `fmtARS`, `fmtDate`, `calcFinancials`, labels |
| `src/routes/+layout.svelte` | Auth guard via `$effect` |
| `src/routes/+page.svelte` | Dashboard: filtros, métricas, lista de propiedades |

## Roles y permisos

```typescript
auth.isAdmin    // solo 'admin'
auth.canEdit    // 'admin' | 'operator'
auth.user.role  // 'admin' | 'operator' | 'viewer'
```

- Crear/eliminar propiedades y usuarios: solo `admin`
- Editar propiedades y gestionar gastos: `admin` + `operator`
- Lectura: todos los roles

## API del backend

Base: `src/lib/api/client.ts` — todas las funciones usan `request<T>(path, options, token)`.

Los datos numéricos de la API pueden llegar como strings. La normalización se hace en
`normalizeProperty()` y `normalizeExpense()` dentro de `client.ts`.

## Formato de datos

- Fechas: la API devuelve ISO 8601. Mostrar con `fmtDate()` → `DD/MM/YYYY`
- Para inputs de fecha: usar `toDateInput()` → `YYYY-MM-DD`
- Moneda USD: `fmtUSD(n)` → `$1.234,56`
- Moneda ARS: `fmtARS(n)` → `ARS 1.234,56`
- Números en tablas: usar clase `font-num` (JetBrains Mono, tabular-nums)

## Variables CSS de diseño

```css
--color-bg, --color-surface, --color-surface2, --color-surface3
--color-ink, --color-ink2, --color-ink3
--color-border, --color-border2
--color-blue, --color-red, --color-amber, --color-amber-mid
```

## Comandos de desarrollo

```bash
bun run dev          # servidor de desarrollo
bun run build        # build de producción
bun run check        # type checking
make build           # Docker imagen linux/amd64
make local           # Docker imagen local
make push            # build + push a GCP Artifact Registry
```

## Backend relacionado

Repositorio: `api.cosua.cre` — Hono + Bun + PostgreSQL (esquema `cre`).
Al agregar endpoints en el frontend, verificar que existan en el backend.
Los nuevos roles deben actualizarse en `api.cosua.cre/src/types.ts` y `src/routes/users.ts`.

## Patrones a evitar

- No usar `$env/static/public` fuera de archivos que se buildean (siempre es `/proxy-api`)
- No hacer fetches directos a URLs externas desde el browser (Mixed Content con HTTPS)
- No usar `$env/static/private` para variables que cambian por entorno en runtime — usar `$env/dynamic/private`
- No llamar a funciones async directamente en el script de un componente sin `onMount`
