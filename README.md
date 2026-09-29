# ecommerce-base

Base reutilizable de comercio electrónico con Vite, React y TypeScript. Gestor de paquetes: **Yarn 1.22.22**. Entorno validado con Node 24.13.0.

## Desarrollo

```sh
yarn install --frozen-lockfile
yarn dev
```

```sh
yarn lint
yarn typecheck
yarn test
yarn build
yarn preview
```

Conservar yarn.lock en el repositorio y usar Yarn para agregar dependencias.

## Fase 1: base navegable

- Routing con React Router; layouts público y administrativo separados.
- Inicio, catálogo, filtros por categoría, detalle de producto y página 404.
- Carrito vacío y pantallas de acceso/registro sin operaciones activas.
- Panel de administración de muestra en /admin, /admin/productos y /admin/categorias.
- Estilos adaptables a móvil, navegación por teclado y configuración de marca.
- Productos ficticios; no hay almacenamiento, autenticación, checkout ni Firebase.

**En modo demo, el panel solo muestra datos de ejemplo. En modo Firebase requiere sesión ADMIN.** No introducir información real ni habilitar operaciones de administración antes de implementar autorización en el servidor o reglas del proveedor de datos. Agregar al carrito tampoco reserva stock.

## Estructura

- src/app: composición, rutas y layouts.
- src/config: configuración pública y tipos de tienda.
- src/features/catalog: páginas, componentes, tipos y datos ficticios de catálogo.
- src/features/cart, auth, admin: pantallas iniciales por funcionalidad.
- src/shared: componentes y utilidades realmente compartidos.
- src/styles: estilos globales, diseño adaptable y variables visuales.

Las páginas no importarán Firebase directamente. En la fase de datos se definirán contratos de servicios y sus adaptadores.

## Personalización

Editar src/config/store.config.ts para cambiar nombre, monograma, descripción, locale, moneda, contacto y tema. Se puede añadir logoUrl con una ruta pública, por ejemplo /marca.svg. Las variables de tema se aplican al iniciar la aplicación; el título y el idioma también se derivan de esta configuración.

Los textos editoriales de la portada viven en HomePage.tsx. La configuración estática requiere volver a compilar para publicar sus cambios. src/styles/tokens.css define los valores visuales base.

Los importes de muestra se expresan en unidades menores (centavos para BOB) y se presentan con Intl.NumberFormat. Regla comercial acordada: costo + ganancia fija + 16 % sobre esa suma. La integración fiscal es independiente. Costos, márgenes, credenciales y otros datos privados nunca deben ir en la configuración pública ni en variables VITE_*.

commerce reserva opciones de pedidos, reservas y entrega para las fases funcionales. Sus valores actuales no habilitan operaciones de compra.

## Rutas

- / — inicio
- /productos — colección completa
- /categorias/:slug — productos de una categoría
- /productos/:slug — detalle
- /carrito — estado vacío
- /login y /registro — acceso pendiente de implementación
- /admin — resumen de demostración
- /admin/productos y /admin/categorias — vistas de consulta
- Cualquier ruta, categoría o producto inexistente muestra una página 404.

Para desplegar esta SPA, configurar el alojamiento para servir index.html en las rutas de la aplicación que no correspondan a archivos. Esto permite abrir o recargar enlaces internos.

## Próximas fases

2. Base de dominio y contratos completada; ver documentación de fase 2. Reservas y configuración concreta de Firebase pendientes.
3. Implementar catálogo conectado, administración de productos/categorías e inventario.
4. Carrito de visitante, identificación al confirmar, pedidos/reservas y datos de facturación.
5. Validación de precios y stock, experiencia final y despliegue.

El precio comercial usa ganancia fija y recargo configurable (16 % inicial). Quedan pendientes duración de reservas, transiciones, entrega y configuración concreta de Firebase. Un carrito no compromete existencias; pedidos y reservas requieren validación confiable de precios y disponibilidad.

## Verificación manual

- Recorrer inicio → catálogo → categoría → producto → volver.
- Abrir directamente y recargar una ruta de producto.
- Comprobar rutas y slugs inexistentes.
- Revisar carrito, acceso y registro: no deben simular compras ni sesiones.
- Visitar las tres vistas de administración y volver a la tienda.
- Revisar navegación por teclado y ancho móvil (390 px).

## Fase 2: dominio y contratos

- [Modelo de datos, precios y decisiones pendientes](docs/phase-2-domain.md).
- [Persistencia, permisos y preparación Firebase](docs/phase-2-firebase.md).
- Modelos independientes del SDK y contratos de servicios en src/app/services/contracts.ts.
- Separación de catálogo público, costos, perfiles, inventario y pedidos.
- Cálculo de precios en centavos con pruebas ejecutables: yarn test.
- Ejemplo acordado: Bs 5.000 + Bs 200 + 16 % = Bs 6.032.
- Estado al cerrar fase 2: integración Firebase pendiente. Ver fase 3 para el estado actual.

Siguiente bloque: confirmar proyecto/región/proveedor de acceso y conectar Authentication
y catálogo mediante adaptadores, reglas y pruebas de emuladores. La activación de reservas
y checkout espera las decisiones comerciales restantes.

## Fase 3: Firebase preparado

Consulta [la guía de configuración y validación](docs/phase-3-firebase.md). Completa .env.local, habilita correo/contraseña y configura las reglas de Firestore; después cambia VITE_DATA_SOURCE a firebase y reinicia Vite. Los servicios reales quedan pendientes de probar con tu proyecto.

Se incluyen registro, acceso, recuperación, sesión, guard ADMIN y catálogo de solo lectura. Las operaciones comerciales siguen deshabilitadas. .env.example es la plantilla versionada.

## Fase 4: administración

Formularios y backend de productos/categorías implementados y probados en emuladores. Consulta [alcance, validación y pasos de despliegue](docs/phase-4-admin.md). El proyecto real aún requiere publicación de reglas y funciones; no se ha asignado una cuenta ADMIN.
