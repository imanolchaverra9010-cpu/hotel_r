# Instalar Hotel Los Robles como App (PWA)

## Requisitos
- Sitio publicado con HTTPS.
- Navegador actualizado (Chrome, Edge, Safari).

## Android (Chrome)
1. Abre `https://www.hotellosrobles.online`.
2. Toca el menu de Chrome (tres puntos).
3. Selecciona `Instalar app` o `Agregar a pantalla principal`.
4. Confirma en `Instalar`.

## iPhone / iPad (Safari)
1. Abre `https://www.hotellosrobles.online` en Safari.
2. Toca el boton `Compartir`.
3. Selecciona `Agregar a pantalla de inicio`.
4. Pulsa `Agregar`.

## PC (Chrome o Edge)
1. Abre `https://www.hotellosrobles.online`.
2. Haz clic en el icono de instalar en la barra de direcciones.
3. Confirma en `Instalar`.

## Boton de instalacion dentro del sitio
- El sitio muestra un boton flotante de descarga cuando el navegador detecta que la app es instalable.
- Si no aparece:
  - Verifica que ya no este instalada.
  - Recarga la pagina.
  - Asegura que estas en HTTPS.

## Verificacion tecnica rapida
1. Abre DevTools > `Application`.
2. Revisa `Manifest` y `Service Workers`.
3. En `Lighthouse`, ejecuta auditoria `PWA`.
