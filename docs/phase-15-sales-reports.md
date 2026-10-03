# Fase 15: informe administrativo de ventas y ganancias

## Alcance

La administración incorpora una sección independiente de ventas. El reporte usa pedidos con estado `COMPLETED`, toma su fecha de finalización y permite consultar un rango inclusivo de hasta 366 días.

La pantalla presenta pedidos completados, unidades vendidas, costo, ganancia, recargo tributario y total cobrado. La tabla muestra cada artículo vendido con su pedido, categoría, cantidad y desglose monetario.

## Historial comercial privado

Al confirmar una solicitud se guarda un documento en `orderCommercialSnapshots/{orderId}` con el costo, ganancia, recargo, precio y categoría vigentes en ese momento. Esta colección solo es legible por administradores y evita que un cambio posterior en el catálogo altere los informes históricos.

Los pedidos completados antes de esta fase no tienen ese registro. Se incluyen en el reporte con su total vendido, mientras costo, ganancia y recargo se identifican como datos no disponibles.

## Consulta y límites

Firestore consulta pedidos completados entre dos marcas de tiempo y requiere el índice compuesto de `status` y `updatedAt`. Se leen hasta 500 ventas por reporte; si el rango supera ese límite, la interfaz solicita reducir las fechas.

## PDF

El botón de descarga genera un PDF A4 horizontal con datos de la empresa configurada, periodo, resumen, tabla de artículos y paginación. `jsPDF` y `jspdf-autotable` se cargan dinámicamente al exportar, por lo que no forman parte de la carga inicial del catálogo.

## Publicación

Esta fase modifica reglas e índices de Firestore. Antes de usarla en producción deben publicarse ambos mediante el flujo de despliegue Firebase del proyecto.
