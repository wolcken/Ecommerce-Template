# Fase 6: cotización del carrito y preparación de publicación

## Decisiones confirmadas

- Cuenta administradora real: admin@ecommerce.com.
- Recojo en tienda y envío simulados. Ambos tienen costo cero en esta etapa; no representan una tarifa comercial.
- Reservas de 24 horas desde su futura confirmación.

## Implementado

- previewCheckout requiere autenticación y admite hasta 50 productos, 99 unidades por producto y ninguna línea duplicada.
- Rechaza campos no permitidos, precios proporcionados por el navegador y modalidades inválidas.
- Una transacción de solo lectura obtiene una vista consistente de productos, categorías, precios privados e inventario.
- Recalcula el precio con costo + ganancia fija + recargo. No confía en el precio público ni en un total del cliente.
- Comprueba stock disponible (onHand - committed) y categorías/productos activos.
- Devuelve solo precios de venta, totales, modalidad simulada y política de 24 horas. No expone costos, ganancias ni cantidades internas.
- La interfaz permite cotizar después de iniciar sesión. Cambiar cantidades o modalidad descarta el resultado anterior.
- Esta vista previa no es una cotización confirmable: no guarda datos personales, no crea pedidos ni compromete stock.

## Pruebas locales reproducibles

En terminales separadas:

```sh
yarn emulators
```

```sh
yarn seed:emulator
yarn dev:emulator
```

Abrir http://127.0.0.1:5174. La semilla crea la cuenta local admin@ecommerce.com con la contraseña de prueba acordada y una laptop de Bs 6032, exclusivamente en demo-ecommerce-test. Usa hosts fijos 127.0.0.1, no carga .env.local, no cambia contraseñas existentes y conserva otros claims. Repetirla no duplica el catálogo. Los datos desaparecen al detener los emuladores sin exportarlos.

## Herramientas del proyecto real

```sh
yarn firebase:check
yarn firebase:smoke
yarn firebase:admin --project ID --uid UID --email CORREO
```

firebase:check valida configuración, región, sesión y acceso sin imprimir credenciales. Incluye compatibilidad con el almacén de certificados de Windows.

firebase:smoke consulta el catálogo activo como visitante y comprueba que productPricing rechace la lectura. No escribe datos.

firebase:admin consulta una cuenta por UID y exige coincidencia exacta del correo. Solo añade admin: true al incluir --grant y conserva los demás claims. Usa la sesión privilegiada del Firebase CLI y no almacena tokens.

## Estado real verificado

- Proyecto ecommerce-base-62b9c y región us-central1.
- Firebase CLI autenticado como una cuenta con acceso al proyecto.
- UID proporcionado corresponde a admin@ecommerce.com.
- Claim admin: true asignado y comprobado. La cuenta aún figuraba con correo sin verificar.
- Reglas e índices de Firestore publicados correctamente.
- Catálogo público accesible y vacío: cero productos y categorías activos.
- Lectura anónima de productPricing rechazada.
- Hosting y Storage no fueron publicados.
- Cloud Functions no fue publicada: el proyecto debe migrar al plan Blaze para habilitar Artifact Registry. El intento también solicitó habilitar las APIs necesarias de Functions y Cloud Build antes de detenerse por el plan.

Después de verificar el correo, cerrar y volver a iniciar sesión en la aplicación para renovar el token y recibir el claim ADMIN.

## Validación

22 pruebas unitarias y 13 de integración aprobadas; lint, typecheck, compilaciones frontend/backend y diff check correctos. La compilación mantiene la advertencia previa de bundle superior a 500 kB.

Las pruebas de cotización cubren autenticación, inyección de precios, límites, duplicados, precio derivado de costos aunque cambie el precio público, falta de stock, producto/categoría desactivados y ausencia de escrituras. En navegador local se verificó acceso ADMIN, laptop a Bs 6032, reserva/envío y descarte de cotizaciones antiguas.

## Próximo paso externo

Actualizar el proyecto a Blaze desde Firebase Console si se desea publicar las funciones. Esto requiere que el propietario configure facturación. Después:

```sh
yarn firebase:deploy --only functions --project ecommerce-base-62b9c --non-interactive
```

Luego se debe probar acceso real ADMIN y crear un producto controlado. No es posible cotizar en el proyecto real hasta publicar previewCheckout.

## Pendiente funcional

- Cotización persistida, confirmación idempotente y compromiso transaccional de stock.
- Pedidos, cancelación, vencimiento automático de reservas y liberación de existencias.
- Dirección de envío, ubicación de recojo, cobros y tarifas reales.
- Publicación y prueba real de Functions.

La selección de reserva todavía no inicia un plazo ni un proceso automático. La confirmación permanece deshabilitada.
