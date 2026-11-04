# AppScan: PWA de escaneo de documentos

Fecha: 2026-11-03. Estado: pendiente de revisión.

## 1. Objetivo

Una PWA en español que se instala en el celular y convierte fotos de documentos en PDF limpios, parecida a CamScanner en funciones. Es para uso personal o familiar. No tiene cuentas ni servidor, y los documentos se quedan en el dispositivo hasta que el usuario decide compartirlos.

**La versión 1 está lista cuando:**

1. Se puede instalar desde la URL publicada, en Android (Chrome) y en iPhone (Safari, "Agregar a inicio").
2. Una foto de una hoja sobre una mesa termina en un PDF recortado, enderezado y compartible.
3. Después del primer uso, escanear, recortar, filtrar y exportar funcionan en modo avión.
4. Cerrar y volver a abrir la app no hace perder documentos.
5. El OCR, una vez descargado, también funciona sin conexión.

**Fuera de la versión 1:** cuentas, sincronización entre celulares, nube, dividir o comprimir PDF, conversión a Word/Excel, PDF con contraseña, funciones de IA y monetización.

## 2. Uso de REA

REA es una herramienta de ingeniería inversa; no genera apps. Aquí tiene dos usos:

- **Referencia:** observar la página pública de CamScanner para listar funciones (Evidence `ev_6911307c62bfbfc8477d0f7a9769036f57722233f087891bbf0cd436fc9fa22e`). Se observó únicamente la portada pública, sin iniciar sesión. No se analizó el APK ni el código de la app móvil, así que su funcionamiento interno es desconocido.
- **Verificación:** auditar nuestra build: service worker, modo sin conexión, peticiones de red y contenido del bundle (sección 9).

Observado en esa página: escaneo con recorte y mejora automáticos, guardar y compartir, creación de PDF, OCR, plantillas para identificaciones, herramientas PDF, unir y dividir, compresión, sincronización con cuenta.

**Límite legal y de marca:** no se copia código, texto, iconos, nombre ni diseño visual de CamScanner. Solo se toma como referencia qué funciones ofrece. Nombre e icono propios.

## 3. Arquitectura

App estática sin backend, publicada en GitHub Pages.

| Pieza | Elección | Motivo |
|---|---|---|
| Interfaz | Vite 8, React 19, TypeScript | Enfoque A elegido |
| Bordes y perspectiva | `@techstark/opencv-js` (Apache-2.0) en Web Worker | Detección robusta sin congelar la interfaz |
| PDF | `pdf-lib` (MIT) | Genera PDF en el navegador |
| OCR | `tesseract.js` 7 (Apache-2.0), idioma español | Funciona en el dispositivo |
| Almacenamiento | IndexedDB con `idb` (ISC) | Guarda imágenes (Blob) |
| Instalación y sin conexión | `vite-plugin-pwa` | Manifest y service worker |

OpenCV y Tesseract se cargan solo cuando se necesitan y se guardan en caché. Los datos de Tesseract se sirven desde nuestro propio dominio, no desde un CDN, para que ninguna función dependa de terceros.

### Módulos

Cada módulo tiene una sola responsabilidad y `core/` no conoce React.

- `core/geometry`: ordenar esquinas, calcular el tamaño de salida, validar cuadriláteros. Funciones puras.
- `core/filters`: original, mejorado, grises, blanco y negro. Operan sobre píxeles.
- `core/vision`: cliente del worker con `detectCorners(imagen)` y `warp(imagen, esquinas)`.
- `core/render`: de página y parámetros a imagen final.
- `core/pdf`: de imágenes a PDF, incluida la hoja de identificación.
- `core/ocr`: envoltura de Tesseract con progreso.
- `storage/db`: lectura y escritura de documentos, páginas y firmas.
- `ui/`: pantallas y componentes.

## 4. Modelo de datos

Los cambios no son destructivos: la foto original se conserva y el resultado se regenera a partir de sus parámetros, de modo que se puede corregir un recorte más tarde.

```ts
type Doc = { id: string; title: string; kind: 'normal' | 'id-card';
             pageIds: string[]; createdAt: number; updatedAt: number };

type Page = { id: string; docId: string;
              original: Blob; corners: Quad; rotation: 0 | 90 | 180 | 270;
              filter: 'original' | 'enhanced' | 'gray' | 'bw';
              annotations: Annotation[];
              rendered: Blob; thumb: Blob; ocrText?: string };

type Annotation =
  | { type: 'signature'; signatureId: string; box: Box }
  | { type: 'text'; text: string; box: Box; color: string }
  | { type: 'stroke'; points: Point[]; color: string; width: number };

type Signature = { id: string; image: Blob; createdAt: number };
```

Las coordenadas de `box` y `points` son relativas a la página (0 a 1) para que no dependan de la resolución. Las originales se limitan a 4000 px en su lado mayor. Al iniciar se llama a `navigator.storage.persist()`.

## 5. Pantallas y flujos

1. **Biblioteca (inicio):** lista de documentos con miniatura, búsqueda por título, botones Escanear e Importar.
2. **Cámara:** cámara trasera con la mayor resolución disponible, contorno detectado en vivo (análisis a unos 4 fps sobre un fotograma reducido) y modo varias páginas.
3. **Recorte:** cuatro esquinas arrastrables con lupa y un botón para volver a detectar.
4. **Edición de página:** filtro, rotación, anotar, OCR.
5. **Documento:** cuadrícula de páginas para reordenar y eliminar; añadir páginas; exportar y compartir.
6. **Anotar:** dibujar, añadir texto, colocar firma. Las firmas se dibujan con el dedo y se reutilizan.
7. **Modo cédula:** guía para frente y reverso; genera una hoja A4 con ambas caras a tamaño real (85,6 × 54 mm).
8. **Unir:** seleccionar documentos en la biblioteca y crear uno nuevo; los originales no se tocan.

**Flujo principal:** cámara → captura → recorte (esquinas ya propuestas) → filtro "mejorado" por defecto → más páginas o terminar → documento → compartir PDF.

**Exportar:** el PDF se genera al momento con página A4 o ajustada a la imagen, y se comparte con `navigator.share`. Si el navegador no puede compartir archivos, se descarga.

## 6. Manejo de errores

| Situación | Comportamiento |
|---|---|
| Cámara denegada o no disponible | Explicar cómo activarla y ofrecer la cámara del sistema o la galería |
| No se detecta la hoja | Proponer la imagen completa con recorte manual; nunca bloquear |
| OpenCV no carga | Recorte manual rectangular; la corrección de perspectiva queda no disponible hasta que cargue y se avisa |
| OCR sin descargar y sin conexión | Avisar y conservar el documento intacto; reintento posible |
| Almacenamiento lleno | Avisar antes de perder la captura y sugerir borrar documentos |
| Memoria insuficiente | Procesar una imagen a la vez; reintentar a menor resolución |
| Nueva versión | Aviso para actualizar; nunca recargar mientras se edita |

## 7. Privacidad

Sin analítica, sin servicios de terceros en tiempo de ejecución y sin subir imágenes. La política de seguridad de contenido limita `connect-src` a nuestro propio origen. La verificación con REA comprueba que escanear y exportar no generan peticiones a otros dominios.

## 8. Publicación

- Rama `main` en `CarlosHurtado2024/appscan`, repositorio público.
- GitHub Actions compila y publica en Pages con `base: '/appscan/'`.
- URL esperada: `https://carloshurtado2024.github.io/appscan/`.
- Puede hacer falta activar Pages en los ajustes del repositorio (Source: GitHub Actions).

## 9. Pruebas

- **Unitarias (Vitest, escritas antes del código):** geometría, filtros, modelo de datos, PDF generado (número y tamaño de páginas), hoja de identificación.
- **Visión con imágenes de ejemplo:** fotos sintéticas de una hoja con perspectiva conocida; las esquinas detectadas deben quedar dentro de un 3 % del lado mayor.
- **Navegador (móvil emulado):** importar imagen → recortar → filtro → PDF → reabrir y comprobar que sigue ahí. Cámara con vídeo simulado.
- **REA sobre la build publicada:** el service worker queda activo, la app abre sin red, no hay peticiones a terceros y el bundle no contiene recursos ajenos a las dependencias declaradas.
- **Prueba en celular real (la hace el usuario):** instalación, cámara y compartir en Android y iPhone. No se puede automatizar desde este equipo y es el único criterio que queda sin verificar antes de la entrega.

## 10. Riesgos conocidos

- **Tamaño:** OpenCV pesa unos 10 MB o más. Se mide en la build; si supera 15 MB comprimido, se evalúa una versión recortada.
- **Calidad de la detección:** con poco contraste puede fallar; por eso el recorte manual siempre está disponible.
- **iPhone:** iOS puede borrar datos de sitios sin instalar y las capacidades de compartir varían. Se indicará que conviene usar la app instalada.
- **Sin copia de seguridad:** si se borran los datos del navegador o se pierde el celular, se pierden los documentos. La app lo avisará; el respaldo es compartir el PDF.
