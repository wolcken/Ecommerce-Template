# Fase 8: perfil, entrega y preparación de hosting

## Perfil del comprador

Cada usuario autenticado puede guardar en `profiles/{uid}`:

- nombre y apellidos;
- teléfono;
- nombre o razón social;
- NIT o CI y complemento opcional.

El correo y el rol no se guardan en el perfil. Authentication continúa siendo la fuente del correo y los custom claims la fuente del rol ADMIN.

Las reglas permiten leer y escribir únicamente el documento cuyo ID coincide con `request.auth.uid`. No hay lectura administrativa global de perfiles; los datos necesarios para operar cada pedido ya quedan copiados en su solicitud.

El checkout carga el perfil para completar el formulario, pero el usuario todavía debe revisar los datos antes de enviar.

## Configuración comercial

`src/config/store.config.ts` concentra ahora:

- duración de reservas;
- métodos habilitados;
- puntos de recojo;
- dirección e instrucciones de cada punto;
- tarifa base y aviso de envío.

La plantilla conserva valores neutrales:

- punto: Tienda principal;
- dirección: Dirección por configurar;
- tarifa de envío: Bs 0;
- reserva: 24 horas.

Antes de publicar una tienda real se deben reemplazar esos textos y definir la tarifa. La confirmación administrativa toma la tarifa vigente de esta configuración y la incorpora al snapshot del pedido.

## Filtros administrativos

`/admin/solicitudes` permite filtrar las 100 solicitudes más recientes por:

- estado;
- pedido o reserva;
- número, cliente, teléfono o documento tributario.

Los filtros son locales y no agregan lecturas de Firestore.

## Firebase Hosting

`firebase.json` sirve `dist`, reescribe las rutas de la SPA a `index.html`, aplica caché inmutable a JS/CSS versionados y añade cabeceras básicas de seguridad.

`.firebaserc` fija `ecommerce-base-62b9c` como proyecto predeterminado para reducir despliegues accidentales a otro proyecto.

Preparar una versión:

```sh
yarn lint
yarn typecheck
yarn test
yarn test:integration
yarn build
```

Publicar el frontend, solo después de revisar marca, catálogo, dirección, contacto y dominio:

```sh
yarn firebase:deploy:hosting
```

Esta fase prepara Hosting, pero no publica el sitio.

## Validación

- 27 pruebas unitarias y 9 de reglas e integración.
- Perfil aislado por UID.
- Campos extra como role rechazados.
- Control de versión para evitar sobrescrituras.
- Checkout precargado desde el perfil.
- Tarifa y duración conectadas a la confirmación.
- Filtros administrativos sin consultas adicionales.
- Rutas internas preparadas para recarga directa y verificadas con Hosting Emulator.
- Reglas de perfiles publicadas en el proyecto real.
