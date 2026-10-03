# Fase 11: pagos reportados y entrega por alcance

## Experiencia de compra

El checkout usa tarjetas seleccionables para pedido o reserva, recojo, envío nacional e internacional. Las tarifas iniciales son configurables:

- recojo: Bs 0;
- envío nacional: Bs 20;
- envío internacional: Bs 100.

Después de confirmar sus datos, el cliente elige QR, tarjeta o PayPal. Los tres modos son demostraciones y no solicitan información bancaria real. La acción final registra que el pago fue reportado y dirige al historial de solicitudes.

## Seguridad e inventario

El navegador no verifica pagos ni modifica inventario. El ADMIN valida el reporte y confirma la solicitud en una transacción que recalcula precios y compromete stock. Al completar la entrega, el stock físico se consume. Cancelar o vencer libera las unidades comprometidas.

Una integración real deberá usar la confirmación firmada del proveedor mediante Cloud Functions o un backend externo antes de automatizar la confirmación.

## Terminología

La interfaz usa “Comprobante electrónico”, “Datos para el comprobante”, “Datos tributarios” y “Recargo tributario”. El comprobante continúa siendo una demostración sin validez fiscal.

## Compatibilidad

Las solicitudes anteriores, sin reporte de pago ni alcance de envío, continúan siendo legibles y administrables. Se interpretan como envíos nacionales cuando corresponda.
