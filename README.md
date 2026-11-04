# AppScan

Escanea documentos con tu celular y conviértelos en PDF. Todo se queda en tu dispositivo: sin cuentas, sin servidores y sin subir imágenes.

**Abrir la app:** https://carloshurtado2024.github.io/appscan/

## Funciones

- Cámara con contorno de la hoja en vivo, o imágenes de la galería
- Detección de bordes, enderezado y recorte manual
- Filtros: mejorado, original, grises, blanco y negro
- Documentos de varias páginas: reordenar, eliminar y unir
- Exportar y compartir en PDF (A4 o ajustado a la imagen)
- Extraer texto en español (OCR), en el propio celular
- Modo cédula: frente y reverso en una hoja A4, a tamaño real
- Firma y anotaciones
- Funciona sin conexión después del primer uso

## Instalar en el celular

- **Android (Chrome):** abre el enlace, toca el menú ⋮ y elige «Instalar app» o «Agregar a la pantalla principal».
- **iPhone (Safari):** abre el enlace, toca Compartir y elige «Agregar a inicio». Usa siempre la app desde ese icono: iOS puede borrar los datos de los sitios que no están instalados.

## Privacidad y copias de seguridad

Los documentos se guardan en el almacenamiento del navegador de tu celular y solo salen de ahí cuando los compartes. La app no usa analítica ni servicios externos.

**No hay copia de seguridad.** Si borras los datos del navegador, desinstalas la app o pierdes el celular, se pierden los documentos. Comparte o guarda los PDF importantes en otro lugar. Tampoco hay sincronización entre celulares.

## Tamaño de las descargas

| Parte | Cuándo se descarga | Tamaño comprimido aproximado |
|---|---|---|
| App | Al abrirla por primera vez | 0,3 MB |
| Detección de bordes (OpenCV) | Al abrirla por primera vez | 3,5 MB |
| Reconocimiento de texto | La primera vez que usas «Extraer texto» | 3,6 MB |

## Desarrollo

Requiere Node.js 24 o superior.

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

```bash
npx playwright test
```

Las pruebas de navegador usan el Chrome instalado en tu equipo. Al subir a `main`, GitHub Actions ejecuta las pruebas unitarias y publica en GitHub Pages. Las pruebas de navegador se ejecutan solo en local.

Las decisiones de diseño están en [docs/superpowers/specs](docs/superpowers/specs/2026-11-03-appscan-pwa-design.md), y la auditoría con [REA](https://github.com/morluto/rea) en [docs/rea-audit.md](docs/rea-audit.md).

## Licencias de terceros

- [OpenCV](https://opencv.org/) a través de `@techstark/opencv-js` (Apache-2.0)
- [Tesseract.js](https://github.com/naptha/tesseract.js) y sus datos de idioma (Apache-2.0)
- [pdf-lib](https://pdf-lib.js.org/) (MIT)
- [idb](https://github.com/jakearchibald/idb) (ISC)
- [React](https://react.dev/) (MIT)
- [Libre Bodoni](https://github.com/impallari/Libre-Bodoni) y [Courier Prime](https://github.com/quoteunquoteapps/CourierPrime) (SIL Open Font License 1.1)

AppScan es un proyecto independiente y no está afiliado a CamScanner ni a ninguna otra marca.
