# Fase 12: modal de pago y detalle comercial

## Modal de pago

El checkout mantiene el resumen compacto y abre los modos de pago en un diálogo accesible. El cliente puede cambiar entre:

- QR con código visual y referencia de demostración;
- tarjeta con titular, número enmascarado, vencimiento y CVV bloqueados;
- PayPal con una cuenta de prueba bloqueada.

Los campos son únicamente ilustrativos. No reciben ni almacenan información bancaria. El diálogo puede cerrarse con su botón, con “Volver”, con Escape o al seleccionar el fondo.

## Información administrativa

Cada solicitud incorpora un desglose visual obtenido de las colecciones privadas del catálogo:

- nombre, SKU y categoría del producto;
- cantidad y disponibilidad actual;
- costo, ganancia fija y porcentaje de ganancia;
- base antes del recargo, recargo tributario y porcentaje;
- precio de venta y total de la línea;
- totales de costo, ganancia, recargo y venta de productos.

Estos valores reflejan la configuración privada actual. Cuando el precio confirmado de una solicitud histórica difiere del precio actual, ambos se muestran de forma separada. Ningún costo o margen se copia al documento público que consulta el cliente.

## Verificación

El cálculo comercial tiene pruebas para el ejemplo base y para valores inconsistentes. El modal se revisó en escritorio y móvil, y las tres alternativas exponen controles bloqueados y nombres accesibles.
