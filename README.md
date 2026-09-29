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

**El panel administrativo no es privado todavía.** Solo muestra datos de ejemplo. No introducir información real ni habilitar operaciones de administración antes de implementar autorización en el servidor o reglas del proveedor de datos. Agregar al carrito tampoco reserva stock.

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

Los importes de muestra se expresan en unidades menores (centavos para BOB) y se presentan con Intl.NumberFormat. No se ha definido una fórmula tributaria. Costos, márgenes, credenciales y otros datos privados nunca deben ir en la configuración pública ni en variables VITE_*.

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

2. Definir entidades, autenticación, permisos, configuración Firebase y reglas de acceso antes de integrar servicios.
3. Implementar catálogo conectado, administración de productos/categorías e inventario.
4. Carrito de visitante, identificación al confirmar, pedidos/reservas y datos de facturación.
5. Validación de precios y stock, experiencia final y despliegue.

Queda pendiente acordar la fórmula de precio final, el significado del porcentaje de facturación, la duración de reservas y sus transiciones. Un carrito no compromete existencias; pedidos y reservas requieren validación confiable de precios y disponibilidad.

## Verificación manual

- Recorrer inicio → catálogo → categoría → producto → volver.
- Abrir directamente y recargar una ruta de producto.
- Comprobar rutas y slugs inexistentes.
- Revisar carrito, acceso y registro: no deben simular compras ni sesiones.
- Visitar las tres vistas de administración y volver a la tienda.
- Revisar navegación por teclado y ancho móvil (390 px).
