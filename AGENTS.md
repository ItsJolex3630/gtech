# 🐺 G-TECH.US - Manual de Arquitectura, Migración y Contexto del Agente

> **DIRECTIVA PARA EL AGENTE PROGRAMADOR (OPENCODE / AI ASSISTANT):**
> Lee este documento detenidamente antes de realizar cualquier cambio en el código. Este documento contiene el contexto oficial, el estado de la arquitectura tras la **migración completa de Octubre 2026**, los lineamientos de despliegue y las reglas críticas para evitar errores o regresiones en el entorno de producción.

---

## 📌 1. ESTADO ACTUAL Y MIGRACIÓN COMPLETADA (OCTUBRE 2026)

Se realizó una migración estructural integral para separar y profesionalizar los entornos de desarrollo, código fuente y despliegue:

| Componente | Estado Anterior (OBSOLETO - NO USAR) | Estado Oficial Actual (VIGENTE) |
| :--- | :--- | :--- |
| **Cuenta de GitHub** | `ItsJolex` | **`ItsJolex3630`** |
| **Repositorio Remoto** | `https://github.com/ItsJolex/gtech.git` | **`https://github.com/ItsJolex3630/gtech.git`** |
| **Cuenta de Vercel** | `joelmedina2009@gmail.com` | **Joel Medina** (`joel-medina-s-projects`) |
| **Proyecto en Vercel** | `gtech` | **`gtech-us`** (ID: `prj_nTJ1SviPMfmeP5bUiDwz5fhvydlD`) |
| **Dominio de Producción** | No verificado / en conflicto | **`https://gtechs.us`** (Canónico) & **`https://www.gtechs.us`** (Redirección 308) |
| **Administración DNS** | - | **GoDaddy** con validación TXT para Vercel (`_vercel.gtechs.us`) |
| **Base de Datos** | Turso SQLite Cloud | **Turso Cloud** (`libsql://gtech-db-itsjolex.aws-us-east-1.turso.io`) |

> ⚠️ **REGLA CRÍTICA DE GIT:**  
> Jamás cambies el origen remoto a `ItsJolex`. El único repositorio oficial es `ItsJolex3630/gtech`. Cada `push` a la rama `main` dispara automáticamente un despliegue de producción en Vercel.

---

## 🏗️ 2. STACK TECNOLÓGICO Y ARQUITECTURA

- **Frontend:** HTML5 semántico (Multi-Page Application), Tailwind CSS (compilado), TypeScript y Vite como bundler.
- **Backend / Serverless:** Node.js con funciones serverless de Vercel alojadas en el directorio `api/`.
- **Base de Datos:** SQLite distribuido en Turso (`@libsql/client`), administrado vía endpoints serverless.
- **Páginas Principales:**
  - `index.html` ➔ Storefront principal de radios tácticos PoC, catálogo, especificaciones técnicas, avatar hero y campañas.
  - `accessories.html` ➔ Catálogo especializado de accesorios tácticos (micrófonos PTT, auriculares tubo acústico, cables).
  - `alliances.html` ➔ Alianzas tácticas estratégicas (Florida Tactical Forces - FTI) y testimonios de clientes.
  - `admin.html` ➔ Panel de administración seguro para gestión de catálogo, toggle de precios y papelera (soft-delete).

---

## 🔐 3. VARIABLES DE ENTORNO Y SEGURIDAD

El proyecto requiere las siguientes variables de entorno (almacenadas localmente en `.env` y configuradas en los entornos de producción de Vercel):

- `TURSO_DATABASE_URL`: URL de conexión segura a la base de datos de Turso.
- `TURSO_AUTH_TOKEN`: Token JWT de lectura/escritura para Turso DB.
- `ADMIN_SECRET_KEY`: Clave secreta para autorizar operaciones sensibles en endpoints de `/api/admin/*`.

> ⚠️ **NUNCA** elimines ni sobreescribas el archivo `.env` local. Si agregas nuevas variables, documenta la variable en `.env.example`.

---

## 🎨 4. BRANDING, FAVICONS Y SEO EN GOOGLE

Se consolidó el branding visual oficial con el parche táctico circular bordado en alta resolución y fondo transparente:

1. **Imágenes de Marca:**
   - `public/images/logo-patch.png` (1024×1024, PNG transparente de ultra alta calidad).
   - `public/images/logo-patch.webp` (Versión WebP optimizada).
   - `public/images/logo-rounded.png` y `.webp` (512×512).
2. **Suite de Favicons:**
   - `public/favicon.ico` (multi-resolución 16, 32, 48px).
   - `public/favicon-48x48.png`, `favicon-96x96.png`, `favicon-192x192.png`, `favicon-512x512.png`.
   - `public/apple-touch-icon.png` (180×180).
3. **SEO y Búsqueda en Google:**
   - Meta tag `<meta name="thumbnail" content="https://www.gtechs.us/images/logo-patch.png" />` configurado para controlar la miniatura en los resultados de Google.
   - Open Graph (`og:image`) y Twitter Cards con dimensiones explícitas (1024×1024) y formato PNG.
   - Datos estructurados Schema.org (`Organization`, `WebSite`, `WebPage`) con `primaryImageOfPage` apuntando al logo bordado.

---

## ⚙️ 5. COMANDOS DE DESARROLLO Y VERIFICACIÓN

Siempre debes ejecutar estas verificaciones antes de confirmar o desplegar cualquier cambio:

```bash
# 1. Instalar dependencias
npm install

# 2. Servidor de desarrollo local
npm run dev

# 3. Verificación de tipos TypeScript
npm run typecheck

# 4. Compilación de producción
npm run build
```

> Si `npm run build` falla por errores de tipos en `src/*.ts` o `api/*.ts`, **no hagas commit** hasta solucionar la raíz del error.

---

## 🎯 6. PROTOCOLO OBLIGATORIO DE ANÁLISIS PROFUNDO

Antes de modificar cualquier funcionalidad o archivo, el agente debe ejecutar las siguientes fases:

### Fase A: Diagnóstico de Estado y Estructura
1. Inspeccionar `git status` y verificar que la rama de trabajo esté limpia y sincronizada con `origin/main`.
2. Revisar la integridad de `products.json` y la estructura de datos en Turso antes de alterar atributos de productos.
3. Comprobar que los selectores y clases de Tailwind CSS respeten la paleta táctica (`bg-slate-950`, `border-slate-800`, `crimson-600`, `cyan-400`).

### Fase B: Implementación Quirúrgica
1. Modificar únicamente los archivos estrictamente requeridos para la tarea asignada.
2. Mantener las optimizaciones de tarjetas de productos: imágenes con `object-contain`, preservando antenas y botones funcionales.
3. Preservar la internacionalización (`data-i18n`) y las traducciones en español e inglés.

### Fase C: Verificación y Despliegue
1. Ejecutar `npm run build` y confirmar código de salida `0`.
2. Verificar que las rutas `/api/*` y los encabezados en `vercel.json` sigan válidos.
3. Crear un commit semántico claro (`feat:`, `fix:`, `refactor:`) y subirlo a `origin main`.
