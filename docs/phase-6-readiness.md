# Fase 6: arquitectura Firebase Spark

## Decisión

La base permanecerá en el plan Spark. No se usan Cloud Functions, Cloud Run, Firebase Storage ni servicios programados. Los productos aceptan una URL HTTPS pública opcional para su imagen.

Proyecto real: ecommerce-base-62b9c. Cuenta ADMIN configurada: admin@ecommerce.com. El claim admin: true ya fue asignado; después de cualquier cambio de claims se debe cerrar y volver a iniciar sesión.

## Administración

El navegador ADMIN usa transacciones Firestore para mantener:

- products: proyección pública sin costos ni stock interno.
- productPricing: costo, ganancia fija y recargo, visible solo para ADMIN.
- inventory: existencias físicas y comprometidas, visible solo para ADMIN.
- categories, slugRegistry y skuRegistry.
- auditEvents con el UID autenticado.

El adaptador valida entradas, slugs, SKU, URL HTTPS, versiones, categoría, unicidad, stock mínimo y precio calculado. Las reglas vuelven a comprobar esquema, tipos, versiones, campos permitidos y rol ADMIN. No se permite borrar el historial directamente.

La seguridad depende del claim ADMIN: un administrador es un operador de confianza. Spark no aporta una capa de servidor independiente para defenderse de una cuenta ADMIN comprometida.

## Catálogo e imágenes

Visitantes solo pueden leer productos y categorías activos. productPricing, inventory, registros internos y auditoría no admiten lectura pública.

Las imágenes no se cargan a Firebase. El formulario acepta cero o una URL que comience por https://. El propietario de la tienda debe garantizar que la URL sea pública, estable y que tenga permiso para usarla. No usar enlaces que requieran sesión, expiren o expongan tokens.

## Checkout

El carrito conserva identificadores y cantidades en el navegador. /checkout permite revisar comprador, NIT/CI, pedido o reserva y recojo o envío. Los datos personales permanecen en memoria y todavía no se escriben en Firestore.

El total mostrado es una referencia del catálogo. No existe cotización de servidor. En la siguiente fase el cliente enviará una solicitud sin considerarla confirmada; el ADMIN comprobará precio y disponibilidad, y solo entonces comprometerá stock.

Las reservas durarán 24 horas desde la confirmación manual. Sin tareas programadas, su vencimiento y liberación deberán ejecutarse desde el panel administrativo.

## Configuración y comandos

La configuración mínima usa apiKey, authDomain, projectId y appId. messagingSenderId es opcional; esta base no consume Storage ni requiere storageBucket.

```sh
yarn firebase:check
yarn firebase:smoke
yarn test:integration
```

Publicación autorizada para Spark:

```sh
yarn firebase:deploy --only firestore:rules,firestore:indexes --project ecommerce-base-62b9c --non-interactive
```

firebase.json no contiene Functions ni Storage. El paquete Functions de la fase anterior fue retirado del código versionado; permanece recuperable en el historial Git.

## Estado real verificado

- Firebase CLI con acceso al proyecto.
- UID y correo ADMIN comprobados; claim admin: true activo.
- Reglas e índices Spark publicados.
- Catálogo público accesible y actualmente vacío.
- Lectura anónima de productPricing rechazada.
- No se publicó Hosting ni Storage.
- No hay funciones desplegadas.

## Validación

- 22 pruebas unitarias.
- 7 pruebas de reglas e integración.
- Administración Spark probada de extremo a extremo en Firestore Emulator.
- Ejemplo de precio comprobado: Bs 5000 + Bs 200 + 16 % = Bs 6032.
- USER no puede escribir catálogo.
- ADMIN no puede introducir costos en products, URLs HTTP, inventario imposible, versiones antiguas, auditoría de otro usuario ni borrado físico.
- TypeScript, ESLint, compilación y diff check aprobados.

## Pendiente

- Persistir solicitudes de pedido/reserva con acceso exclusivo del propietario y ADMIN.
- Panel de revisión y confirmación manual.
- Compromiso y liberación manual de existencias.
- Ubicación de recojo, dirección de envío y costos reales.
- Hosting del frontend.

No se implementarán pagos, secretos fiscales, webhooks o procesos automáticos en el navegador.
