# Fase 5: carrito y borrador de compra

## Alcance

- Carrito para visitantes y cuentas, persistente en este navegador. Solo guarda identificadores y cantidades; no guarda precios ni datos de facturación.
- Al iniciar sesión se combina el carrito de visitante con el de la cuenta, conservando la mayor cantidad por producto para evitar duplicaciones. Los artículos que exceden el límite permanecen en el carrito visitante.
- Cada cuenta y entorno (demo, emuladores y proyecto real) tiene su propio almacenamiento. No hay sincronización entre dispositivos.
- Máximo 50 productos distintos y 99 unidades por producto. El carrito no reserva stock.
- Precios estimados desde el catálogo cargado; productos retirados o no disponibles bloquean el borrador. La validación autoritativa de precio y stock corresponde al futuro backend de pedidos.
- Cambios entre pestañas se reflejan mediante eventos de almacenamiento. Escrituras simultáneas pueden aplicar la última modificación: localStorage no ofrece transacciones.
- Si el navegador bloquea el almacenamiento, se mantiene una copia temporal en memoria y se muestra una advertencia.
- /checkout permite revisar nombre, apellidos, teléfono y datos NIT/CI. Estos datos viven solo en memoria durante la vista; no se envían ni persisten. La validación es de formato básico, no una validación fiscal oficial.
- Confirmación, pagos, entrega y reservas continúan deshabilitados.

## Validación

Pasaron lint, typecheck, las 22 pruebas unitarias y build. Se agregaron ocho pruebas para almacenamiento inválido, límites, combinación idempotente, aislamiento entre cuentas, almacenamiento no disponible, precios y datos de facturación.

En navegador demo se verificaron agregado, cambio de cantidad, persistencia al recargar, subtotal y revisión de datos conservando ceros iniciales del documento. La confirmación aparece deshabilitada. Vista móvil de 390 px sin desbordamiento horizontal.

## Siguiente fase

Publicar y comprobar reglas/funciones del proyecto real y asignar ADMIN a la cuenta que identifique el propietario. Definir entrega, ciclo del pedido y duración de reservas antes de implementar confirmación con autenticación, precios calculados en servidor, control de stock e idempotencia.