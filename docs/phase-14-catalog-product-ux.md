# Fase 14: experiencia visual del catálogo y producto

## Catálogo

Las tarjetas de producto usan una superficie visual consistente para imágenes remotas, ilustraciones de demostración y productos sin imagen. Las fotografías se muestran completas con `object-fit: contain`, esquinas redondeadas, separación interior y una sombra sutil para evitar recortes y mantener una presentación uniforme entre proporciones diferentes.

Cada tarjeta incorpora:

- nombre y precio final con una jerarquía más clara;
- categoría del producto;
- indicador visible de disponibilidad;
- estados de hover y foco para mouse y teclado;
- una transición discreta que respeta la preferencia de movimiento reducido.

## Productos sin imagen

Cuando un producto no tiene una URL o la imagen remota falla, el catálogo muestra un bloque diseñado con icono, título y texto descriptivo. Este estado conserva el tamaño del resto de las tarjetas y comunica que el producto continúa disponible para consulta.

El componente también incluye una etiqueta accesible para que el significado del marcador visual no dependa únicamente de su apariencia.

## Detalle del producto

La página de detalle presenta la imagen dentro de una galería con marco redondeado y una breve indicación de que se trata de una referencia del producto publicado. En escritorio la galería permanece visible mientras se revisa la información; en móvil vuelve al flujo normal para aprovechar mejor el espacio.

La información se reorganizó en bloques para distinguir:

- precio final y recargo tributario incluido;
- descripción del producto;
- disponibilidad;
- opciones de recojo o envío;
- validación de precio y stock al confirmar;
- acción para agregar al carrito.

## Comportamiento adaptable

El catálogo conserva una cuadrícula amplia en escritorio y pasa a una tarjeta por fila en teléfonos. El detalle cambia a una sola columna, reduce los márgenes internos de la imagen y expande el botón principal para facilitar la interacción táctil.

## Verificación

La fase se revisó visualmente en catálogo y detalle, con productos que usan imágenes de Cloudinary y con productos sin imagen, tanto en escritorio como en una vista móvil de 390 px.
