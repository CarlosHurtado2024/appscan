# Auditoría de AppScan con REA

Herramienta: [REA](https://github.com/morluto/rea) 6.8.0. Fecha: 2026-11-03.

Este documento distingue lo observado, lo deducido y lo desconocido. REA no escribió código de la app; se usó para observar la referencia y para auditar la versión compilada.

## 1. Referencia: CamScanner

- **Evidence:** `ev_6911307c62bfbfc8477d0f7a9769036f57722233f087891bbf0cd436fc9fa22e`
- **Observado:** la portada pública de camscanner.com, sin iniciar sesión. Anuncia escaneo con recorte y mejora automáticos, PDF, OCR, plantillas para identificaciones, herramientas PDF y sincronización con cuenta.
- **Desconocido:** cómo funciona por dentro su app móvil. No se analizó su APK ni su código.
- **Uso:** solo como lista de funciones. No se copió código, texto, iconos, nombre ni diseño.

## 2. Versión compilada, en local

Servida con `vite preview` en `http://localhost:4173/appscan/`, en Chrome 156 sin interfaz, con pantalla de 390 × 844 y service workers permitidos.

### Observado en ejecución

- **Evidence:** `ev_8b9e9ec9e5f21ea74430da65ff14bcd4892c481ca6e599a823378f7a986cdd96` (captura completa, 95 eventos, ninguno descartado).
- REA abrió la app, esperó, la volvió a abrir y esperó de nuevo.
- Hubo 30 peticiones, todas al mismo origen y todas con respuesta 200. Ninguna falló.
- El service worker se instaló y descargó la app (`sw.js`, `workbox-*.js` y los recursos).
- El proceso de visión se creó y cargó el archivo de OpenCV. Tras la segunda visita volvió a crearse.
- Sin errores de página. El único aviso de consola era una etiqueta `meta` obsoleta, ya corregida.
- Cookies, `localStorage` y `sessionStorage` quedaron vacíos.

### Análisis estático

- **Evidence:** `ev_9fcf507a127748e1a3c38014569b0ab5b36a12ec922eaf4bfdb08ca3d059a322` (`sw.js` y el proceso de visión).
- Se encontraron 0 relaciones de peticiones de red en esos dos archivos.

### Límites

- La captura cubre abrir la app, no el flujo completo de escanear. Ese flujo lo cubren las pruebas de Playwright, que también comprueban que no salen peticiones a otros dominios.
- El análisis estático de REA no terminó en 170 s sobre el paquete principal ni en 280 s sobre el paquete completo, así que esos archivos no quedaron analizados por REA. Una búsqueda de texto en el paquete principal encontró `cdn.jsdelivr.net`: es la ruta por defecto de Tesseract, que AppScan sustituye por rutas propias. La prueba de OCR confirma que solo pide archivos del mismo origen.
- Ausencia de un evento no prueba que nunca ocurra: solo cubre lo ejercitado en esta captura.
- La política de seguridad de contenido se aplica a la página, no a los procesos en segundo plano, que dependen de las cabeceras del servidor.

## 3. Sitio publicado

Publicado en Vercel, en `https://appscan-alpha.vercel.app/`. Chrome 156 sin interfaz, con pantalla de 390 × 844.

### Observado con REA

- **Evidence:** `ev_f666c3e0727793e88dd4ddf04ed96e9e94092111e737582012a9391bcb703b3e` (captura completa, 96 eventos, ninguno descartado).
- REA abrió la app, esperó, la volvió a abrir y esperó de nuevo. Los seis pasos terminaron.
- Hubo 32 peticiones, todas al mismo origen: 27 con respuesta 200 y 5 con 304. Ninguna falló.
- El service worker y OpenCV se descargaron durante la instalación.
- Sin errores de página ni avisos de consola. Cookies, `localStorage` y `sessionStorage` quedaron vacíos.

### Observado con Playwright sobre el mismo sitio

- Con una foto real del conjunto de pruebas, el OCR reconoció «Factura número 1234».
- Sin conexión, la app abrió, importó una imagen, generó el PDF y detectó las esquinas.
- Ninguna respuesta dio error, no hubo peticiones a otros dominios ni avisos de la política de seguridad de contenido.

### Límites

- Solo se usó Chrome de escritorio con pantalla de celular. No se probó en un celular real ni en Safari.
- La cámara real, la instalación y el menú de compartir del sistema siguen sin verificar.
