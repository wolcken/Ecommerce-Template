# Fase 7: solicitudes y control manual de inventario

## Alcance

La tienda ya admite solicitudes autenticadas de pedido y reserva sobre Firebase Spark. No se procesa un pago ni se emite una factura fiscal. El cliente envía productos, cantidades, datos del comprador, facturación y modalidad de entrega; el total del navegador no se guarda como dato confiable.

## Flujo

1. El cliente prepara el carrito e inicia sesión.
2. En /checkout revisa sus datos y envía una solicitud REQUESTED.
3. El cliente puede verla en /mis-solicitudes.
4. El ADMIN la revisa en /admin/solicitudes.
5. Al confirmar, una transacción vuelve a leer producto, precio privado e inventario.
6. La transacción calcula el precio vigente, crea el snapshot comercial y aumenta inventory.committed.
7. Completar consume onHand y committed.
8. Cancelar o vencer una reserva libera committed.

Estados permitidos:

```text
REQUESTED ──► CONFIRMED ──► COMPLETED
     │              ├─────► CANCELLED
     │              └─────► EXPIRED (solo reserva)
     └──────────────► REJECTED
```

Una reserva vence 24 horas después de la confirmación. En Spark el ADMIN debe marcarla manualmente como vencida; no hay tareas programadas.

## Colecciones

### orders

Contiene propietario, tipo, estado, comprador, datos tributarios, entrega, productos solicitados y control de versión.

Antes de confirmar:

- number es null.
- confirmedItems está vacío.
- totals es null.
- confirmedAt y reservedUntil son null.

Después de confirmar, el ADMIN añade snapshots de nombre, SKU, imagen, cantidad, precio unitario, versión de precio y total. Los snapshots preservan la operación aunque el catálogo cambie.

### stockCommitments

Documento privado por solicitud confirmada:

- ACTIVE mientras las unidades están comprometidas.
- RELEASED cuando se cancela o vence.
- CONSUMED cuando se completa.

### inventory

La misma transacción actualiza onHand, committed, version y disponibilidad pública. No se admite committed mayor que onHand.

## Seguridad Spark

- Solo una cuenta autenticada crea una solicitud para su propio UID.
- El cliente no puede enviar estado confirmado, total, número, nota administrativa o fecha de reserva.
- El propietario puede leer sus solicitudes.
- Otro USER no puede leerlas.
- ADMIN puede listarlas y ejecutar transiciones válidas.
- Las solicitudes y compromisos no se borran.
- Los costos, ganancias e inventario permanecen privados.
- Cada acción administrativa genera un auditEvent.

Las reglas no intentan considerar confiable al navegador USER. El adaptador ADMIN rechaza productos repetidos, precios desactualizados, productos inactivos, falta de stock, versiones antiguas y compromisos ya procesados.

## Entrega y cobro

Recojo y envío están habilitados. El envío guarda destinatario, teléfono, ciudad, dirección y referencias. Su tarifa actual es Bs 0 y debe coordinarse al confirmar.

No se incorporaron pasarela de pago, factura electrónica, secretos fiscales, webhooks ni automatización de vencimientos.

## Validación

- 25 pruebas unitarias.
- 8 pruebas de reglas e integración.
- Creación USER sin totales confiables.
- Aislamiento entre propietarios.
- Rechazo de modificación directa del estado.
- Confirmación con recálculo de precio.
- Compromiso y liberación de stock.
- Consumo final de existencias.
- Lint, TypeScript y compilación aprobados.

## Operación

```sh
yarn test
yarn test:integration
yarn firebase:smoke
```

Las reglas e índices se publican con:

```sh
yarn firebase:deploy --only firestore:rules,firestore:indexes --project ecommerce-base-62b9c --non-interactive
```

La fase 8 añadió el perfil reutilizable, la configuración de entrega, los filtros administrativos y la preparación local de Hosting.
