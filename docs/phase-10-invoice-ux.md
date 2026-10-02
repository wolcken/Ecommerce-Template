# Fase 10: navegación y factura simulada

## Navegación

Los enlaces públicos, el menú administrativo, las tarjetas accionables y el cierre de sesión ofrecen estados hover visibles. `Cerrar sesión` deja de usar borde y se reconoce por su icono, texto y fondo al pasar el cursor.

Después de autenticar:

- USER abre `/productos`;
- ADMIN abre `/admin`;
- si la autenticación fue requerida por una ruta permitida, se regresa a esa ruta;
- un USER nunca es redirigido a una ruta ADMIN.

## Factura simulada

Una solicitud `COMPLETED` muestra `Ver factura simulada`. El documento incluye:

- número de simulación y pedido;
- fecha de finalización;
- razón social, NIT, actividad y dirección de la empresa;
- nombre y documento tributario del cliente;
- productos, SKU, cantidades, precios unitarios y subtotales;
- envío y total confirmado;
- método o dirección de entrega.

El usuario puede imprimirla o guardarla como PDF desde el navegador. El documento declara que es una simulación sin validez ni crédito fiscal.

Los datos de empresa son provisionales y se configuran en `src/config/store.config.ts` antes de una publicación real.

## Seguridad

La factura se genera con el snapshot confirmado del pedido. La consulta continúa usando `listMine`, por lo que las reglas existentes solo permiten al propietario consultar sus solicitudes. No se agregan colecciones públicas ni reglas nuevas.

## Validación

```sh
yarn lint
yarn typecheck
yarn test
yarn test:integration
yarn build
```
