# COHONDUCAFE — Sitio Web

Rediseño con **Astro + Tailwind CSS**.

## Instalación

Desde esta carpeta en tu terminal:

```bash
npm install
```

## Desarrollo (con servidor local)

```bash
npm run dev
```
Abre http://localhost:4321

## Build

```bash
npm run build
```
Esto genera la carpeta `dist/` con el sitio estático listo para publicar.

## Publicación en el servidor

El sitio publicado vive en la rama **`produccion`**, que contiene solo el contenido de `dist/`
(sin código fuente). El servidor clona esa rama y se actualiza con `git pull`.

**1. Publicar** (desde tu equipo; genera el build y lo sube a la rama `produccion`):

```bash
npm run deploy
```

**2. Primera vez en el servidor** (clonar en la carpeta del sitio en IIS):

```bash
git clone -b produccion --single-branch https://github.com/DougPalm27/WebSite_COH.git C:\inetpub\wwwroot\cohonducafe
```

**3. Cada actualización en el servidor:**

```bash
git -C C:\inetpub\wwwroot\cohonducafe pull
```

El `web.config` (rutas limpias, página 404, caché) ya viene incluido en `dist/`.

> Después de la primera publicación, envía un mensaje de prueba desde el formulario de contacto
> y confirma el correo de activación de FormSubmit que llega a info@honducafeproyectos.com.

## Imágenes nuevas

Para convertir a WebP las imágenes que usen las páginas y mover los originales a `_originales/`:

```bash
node scripts/optimizar-imagenes.mjs
```

## Páginas

- `/` — Inicio
- `/nosotros` — Historia, cifras, línea de tiempo y regiones
- `/marcas` — COHONDUCAFE (marca madre), HOSCO, Mina Honda y Fundación COHONDUCAFE
- `/junta-directiva` — Cuatro generaciones de la familia
- `/contacto` — Formulario de contacto y factsheet
- `/404` — Página no encontrada
