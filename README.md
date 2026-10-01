# ecommerce-base

Base reutilizable de comercio electrónico con Vite, React, TypeScript y Firebase Spark. Gestor: Yarn 1.22.22. Entorno validado con Node 24.

## Desarrollo

```sh
yarn install --frozen-lockfile
yarn dev
```

```sh
yarn lint
yarn typecheck
yarn test
yarn test:integration
yarn build
```

## Arquitectura Spark

La aplicación usa Firebase Authentication y una única base Firestore. No despliega Cloud Functions ni Firebase Storage y no requiere asociar una cuenta de facturación.

- Visitantes: catálogo activo y carrito local.
- USER: acceso, envío de pedidos/reservas y consulta de sus solicitudes.
- ADMIN: catálogo, revisión de solicitudes e inventario mediante transacciones Firestore.
- Reglas: solo ADMIN escribe catálogo; costos e inventario nunca son públicos.
- Imágenes: URL HTTPS pública opcional. La aplicación no sube archivos.
- Checkout: solicitud persistida sin aceptar precios del navegador; el ADMIN recalcula y confirma manualmente.
- Reservas: duran 24 horas desde la confirmación, comprometen stock y vencen manualmente en el panel ADMIN.

El precio usa costo + ganancia fija + 16 % inicial sobre esa suma. Ejemplo acordado: Bs 5000 + Bs 200 + 16 % = Bs 6032. Costos, ganancias y NIT no se colocan en variables VITE_* ni en documentos públicos.

## Firebase

Copiar .env.example a .env.local, colocar la configuración web pública y usar:

```sh
yarn firebase:check
yarn firebase:smoke
```

Las reglas e índices del proyecto ecommerce-base-62b9c están publicados. Para volver a publicarlos:

```sh
yarn firebase:deploy --only firestore:rules,firestore:indexes --project ecommerce-base-62b9c --non-interactive
```

La cuenta ADMIN se asigna fuera de la aplicación, con coincidencia exacta entre UID y correo:

```sh
yarn firebase:admin --project ID --uid UID --email CORREO
yarn firebase:admin --project ID --uid UID --email CORREO --grant
```

Después de modificar claims, cerrar y volver a iniciar sesión.

Para pruebas de reglas:

```sh
yarn test:integration
```

Para una interfaz conectada a Auth y Firestore locales:

```sh
yarn emulators
# otra terminal
yarn dev:emulator
```

## Rutas

- / — inicio
- /productos — catálogo
- /categorias/:slug — categoría
- /productos/:slug — detalle
- /carrito — carrito persistente en el navegador
- /checkout — envío autenticado de pedido o reserva
- /mis-solicitudes — historial privado del cliente
- /login, /registro y /recuperar-acceso — autenticación
- /admin, /admin/productos, /admin/categorias y /admin/solicitudes — administración protegida
- Cualquier ruta inexistente — página 404

Configurar el hosting de la SPA para devolver index.html en rutas internas.

## Personalización

- src/config/store.config.ts: nombre, descripción, moneda y tema.
- src/features/catalog: catálogo público.
- src/features/admin: administración.
- src/features/cart: carrito local por visitante/cuenta.
- src/features/orders: solicitudes, historial y estados comerciales.
- src/infrastructure/firebase: adaptadores de Authentication y Firestore.
- src/styles: diseño adaptable.

## Documentación por fases

- [Dominio y precios](docs/phase-2-domain.md)
- [Preparación Firebase](docs/phase-3-firebase.md)
- [Administración inicial](docs/phase-4-admin.md)
- [Carrito y borrador](docs/phase-5-cart.md)
- [Arquitectura Spark](docs/phase-6-readiness.md)
- [Pedidos, reservas e inventario](docs/phase-7-orders.md)

Siguiente bloque: perfil reutilizable del comprador, configuración real de recojo/envío, filtros administrativos y preparación del hosting.
