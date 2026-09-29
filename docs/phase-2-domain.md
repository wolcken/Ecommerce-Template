# Fase 2 — Modelo de dominio y límites de servicios

Estado: base de contratos terminada; decisiones comerciales indicadas como pendientes.
No se instala ni se conecta Firebase en esta fase. Los tipos no son validadores de ejecución.
La interfaz continúa mostrando el catálogo ficticio de la fase 1.

## Decisiones de arquitectura

- Una tienda por instalación/proyecto Firebase inicialmente; no se modela multitenencia.
- Visitante: catálogo y carrito local. Autenticación requerida al confirmar.
- Usuario nuevo: USER. ADMIN solo se asignará desde un entorno privilegiado.
- El carrito no reserva stock ni garantiza precio.
- Productos públicos separados físicamente de costos, márgenes e inventario privado.
- Pedidos conservan una copia de nombre, SKU, imagen, importes, entrega y facturación.
- Importes: enteros seguros no negativos, en centavos, BOB en el MVP. La configuración
  visual permite otras monedas, pero el futuro comercio debe rechazar monedas no
  soportadas hasta definir sus unidades menores y migración; no basta cambiar el símbolo.
- Ganancia fija en centavos. Recargo configurable en puntos básicos (1600 = 16 %), aplicado sobre costo + ganancia.
- Fechas del dominio: ISO 8601 UTC. El adaptador convierte las fechas del proveedor.
- IDs opacos y slugs únicos. El backend debe mantener índices de unicidad de SKU y slug
  en operaciones atómicas. Los títulos y slugs no sirven como identificadores históricos.
- Control de concurrencia con version y expectedVersion. Una actualización desactualizada
  devuelve CONFLICT. En perfiles/carritos null significa crear solo si no existe.
- Página pública solo obtiene productos activos y categorías activas. Desactivar una
  categoría exige desactivar sus productos/descendientes o reasignarlos coherentemente.
- parentId permite jerarquías de categorías; validar existencia, evitar ciclos y limitar
  profundidad antes de habilitar edición.

## Entidades y archivos

| Entidad | Archivo | Uso |
| --- | --- | --- |
| PublicProduct, CategoryRecord | src/features/catalog/catalog.models.ts | Catálogo público |
| ProductPricing, InventoryRecord | mismo archivo | Información privada |
| AuthState, SessionUser, UserProfile, BillingDetails | src/features/auth/auth.models.ts | Identidad y perfil |
| CustomerCart, CartItem | src/features/cart/cart.models.ts | Intención de compra |
| CheckoutQuote, CustomerOrder, StockCommitment | src/features/orders/order.models.ts | Cotización, pedido y existencias |
| Política de precio y comercio pendiente | src/features/pricing/commerce.models.ts | Impedir asumir reglas comerciales |
| Contratos | src/app/services/contracts.ts | Interfaces independientes del proveedor |

Los tipos de presentación del catálogo demo derivan de campos del modelo público.
illustration y color son exclusivamente recursos de la demo, no campos de Firestore.
Las listas son paginadas. El adaptador aplica un máximo a limit, valida cursor y mapea
errores técnicos a Result sin exponer tokens, datos internos o trazas al cliente.

## Perfil y documentos

BillingDetails guarda nombre/razón social, tipo de documento, número como texto y
complemento opcional. No se convierten NIT/CI a número. El correo de acceso pertenece a
Authentication; el perfil no permite editar rol ni UID. No guardar contraseñas.
La validez fiscal, los documentos aceptados y la política de retención siguen pendientes.
El pedido comercial no equivale a una factura fiscal emitida.

## Confirmación confiable: propuesta para implementar después

1. Usuario autenticado envía IDs, cantidades, datos de entrega y facturación.
2. Servidor valida identidad, productos/categorías activos, cantidades enteras positivas,
   límites del pedido y política comercial habilitada; obtiene precios desde información confiable.
3. Devuelve una cotización persistida con propietario, importes, versiones y vencimiento.
   La duración de la cotización queda pendiente. Cotizar no compromete existencias.
4. Cliente confirma quoteId e idempotencyKey; no envía un total autorizado.
5. Servidor recupera la cotización y verifica propietario, vigencia, versiones de precio
   y políticas. Si el precio cambia, devuelve PRICE_CHANGED y exige nueva aceptación.
6. En una transacción vuelve a verificar disponibilidad de todas las líneas y crea
   pedido, compromiso de stock y registro de idempotencia. Todo se acepta o nada.
7. La clave se limita al usuario y operación. Misma clave/misma operación devuelve el
   resultado original; misma clave/otro contenido devuelve CONFLICT. También se impide
   confirmar dos veces una cotización usando claves distintas.
8. Validar respuesta y entradas en ejecución; las interfaces TypeScript no bastan.

Los borradores de producto no se publican hasta tener política de precio, categoría,
imágenes y disponibilidad válidas. Las operaciones de publicación, edición de precios,
ajustes de stock y estados administrativos se definirán con sus reglas antes de ampliar
AdminCatalogService. No se ofrece un update arbitrario de documentos.

## Inventario y estados (propuesta, pendiente de reglas comerciales)

available = onHand - committed, con 0 <= committed <= onHand, todos enteros.
StockCommitment registra qué unidades compromete cada pedido/reserva.

Propuesta de pedido:
PENDING → CONFIRMED → PROCESSING → READY → COMPLETED.
Cancelación desde PENDING o CONFIRMED como propuesta; excepciones posteriores requieren
definición. No se implementa automáticamente esta máquina de estados en la fase 2.

Propuesta de reserva:
RESERVED → COMPLETED | CANCELLED | EXPIRED.
reservedUntil es obligatorio para reservas. Su duración y el momento de retención
deben confirmarse. Una reserva vencida no puede completarse.

- Crear compromiso: committed += cantidad (solo si hay disponibilidad).
- Cancelar/vencer: committed -= cantidad, compromiso pasa a RELEASED una sola vez.
- Completar: onHand -= cantidad y committed -= cantidad; pasa a CONSUMED una sola vez.
- Transiciones y ajustes deben ser atómicos y resistentes a reintentos.
- El vencimiento lo procesa un servicio confiable con reloj del servidor; una fecha
  o la eliminación TTL por sí solas no liberan inventario. Un proceso tardío puede
  reducir temporalmente disponibilidad, pero nunca vender de más.
- Para pedidos pendientes falta definir si expiran y cuánto tiempo retienen stock.
- Estado de pedido no representa pago confirmado. Pagos y devoluciones fuera de alcance.

## Decisiones pendientes

| Decisión | Estado actual |
| --- | --- |
| Ganancia | Acordado: importe fijo por producto |
| Porcentaje comercial de facturación | Acordado: 16 % inicial sobre costo + ganancia |
| Redondeo y versionado de precios | Decisión técnica: HALF_UP por unidad, versión cost-plus-fixed-v1 |
| Duración y momento de confirmación de reservas | Pendiente; reservas deshabilitadas |
| Duración de cotizaciones y pedidos pendientes | Pendiente |
| Entrega, cobro, cancelación y conversión de reservas | Pendiente |
| Validación de CI/NIT y conservación de datos | Pendiente |
| Proyecto Firebase, región y primer administrador | Pendiente |

Estas decisiones bloquean la activación comercial, no el diseño de interfaces o la
integración inicial de Authentication y catálogo de solo lectura.

## Criterio de cierre

Contratos compilables, separación público/privado, modelo de autorización documentado
y preparación Firebase definida sin SDK ni recursos remotos. Lint, tipos y build deben
seguir pasando. Pruebas de comportamiento se agregan junto con las implementaciones;
no se simula seguridad con pruebas que solo comprueben declaraciones de tipos.

## Precio acordado con el usuario

Ejemplo: costo Bs 5.000 + ganancia fija Bs 200 = base Bs 5.200.
Recargo: 5.200 × 16 % = Bs 832. Precio público: Bs 6.032.

No se usa gross-up ni margen sobre el precio de venta.
La ganancia es un importe fijo; no se agrega otra modalidad porcentual sin definirla.
El porcentaje es configurable por producto, con valor inicial 1600 puntos básicos.
Política cost-plus-fixed-v1 y calculadora pura en features/pricing.
Decisión técnica: calcular en centavos con enteros, redondear el recargo por unidad
al centavo más cercano (mitades hacia arriba), luego multiplicar precio unitario por
cantidad. No volver a agregar el recargo en checkout. Esta decisión puede revisarse
si la futura integración fiscal exige otro tratamiento.

La calculadora devuelve desglose privado; al cliente se expone solo saleMinor como
priceMinor. Guardar pricingPolicyVersion y priceVersion en la proyección pública y/o
snapshots según el modelo. El servicio verifica que política y producto coincidan,
y rechaza cantidades inválidas, desbordamientos y cotizaciones desactualizadas.
La función no habilita compras ni confía en cálculos remitidos por el navegador.

El 16 % representa la regla comercial solicitada, no una afirmación sobre obligaciones
tributarias ni una factura fiscal. La integración fiscal se definirá por separado.
