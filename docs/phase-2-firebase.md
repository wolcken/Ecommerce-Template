# Preparación de Firebase — sin integración en esta fase

Esta es una propuesta de persistencia y autorización, no reglas desplegadas.
El panel /admin actual continúa siendo una demostración pública con datos ficticios.

## Responsabilidades

Authentication gestiona credenciales y sesión. Firestore guarda datos. Storage guarda
imágenes. Un backend confiable (Cloud Functions o API equivalente, pendiente de elegir)
autoriza operaciones de administración, calcula precios y confirma pedidos en
transacciones. React consume contratos; los componentes no importan SDKs.

## Colecciones propuestas

| Ruta | Contenido | Lectura desde cliente | Escritura desde cliente |
| --- | --- | --- | --- |
| products/{id} | PublicProduct | Activos; ADMIN también inactivos | Denegada; servicio admin |
| categories/{id} | CategoryRecord | Activas; ADMIN también inactivas | Denegada; servicio admin |
| productDrafts/{id} | Borrador editorial | ADMIN | Denegada; servicio admin |
| productPricing/{id} | Costo y tasas | ADMIN | Denegada; servicio admin |
| inventory/{id} | Stock físico y comprometido | ADMIN | Denegada |
| users/{uid} | UserProfile sin rol | Propietario | Solo campos permitidos propios |
| carts/{uid} | Carrito sin totales confiables | Propietario | Propietario, validada |
| quotes/{id} | Cotización y datos privados | Propietario | Denegada |
| orders/{id} | Pedido/reserva con snapshots | Propietario o ADMIN | Denegada |
| stockCommitments/{orderId} | Unidades comprometidas | ADMIN | Denegada |
| commandKeys/{id} | Idempotencia ligada a actor/operación | Denegada | Denegada |
| slugRegistry/{id}, skuRegistry/{id} | Unicidad | Denegada | Denegada |
| settings/public | Configuración visible | Todos | Denegada; servicio admin |
| settings/pricing, settings/commerce | Políticas internas | ADMIN | Denegada |
| auditEvents/{id} | Actor, operación, entidad, fecha | ADMIN | Denegada |

Los IDs de documentos se convierten al campo id del dominio; no mantener dos fuentes
de identidad editables. Proyección pública e inventario se actualizan coherentemente
desde el backend. La disponibilidad pública es orientativa; confirmar requiere releer
stock. No enviar documentos de costos al navegador del cliente.

Firestore entrega documentos completos: ocultar campos en React no protege los costos.
Por eso se separan físicamente los documentos privados.
Fuente: [acceso a campos](https://firebase.google.com/docs/firestore/security/rules-fields).

## Matriz de permisos funcionales

| Acción | Visitante | USER | ADMIN |
| --- | --- | --- | --- |
| Ver catálogo activo | Sí | Sí | Sí |
| Carrito local | Sí | Sí | Sí |
| Sincronizar carrito propio | No | Sí | Sí |
| Editar perfil propio | No | Sí | Sí |
| Confirmar pedido/reserva propios | No | Servicio confiable | Servicio confiable |
| Leer pedidos ajenos | No | No | Sí |
| Leer costos/inventario interno | No | No | Sí |
| Editar catálogo, precio o stock | No | No | Servicio admin |
| Asignar ADMIN | No | No | Proceso privilegiado separado |

Propuesta: claim admin === true determina ADMIN; sesión autenticada sin ese claim es
USER. LOADING no se trata como anónimo ni concede permisos. El rol del navegador solo
sirve para mostrar interfaz. Backend y reglas verifican identidad y claims.
El alta no acepta role. El primer administrador se asigna con Admin SDK desde un
entorno privilegiado; nunca desde un formulario web ni con un correo hardcodeado.
No se entrega a todo ADMIN capacidad de promover a otros.
Fuente: [custom claims](https://firebase.google.com/docs/auth/admin/custom-claims).

## Reglas y validaciones futuras

- Denegar por defecto rutas desconocidas y escrituras comerciales directas.
- Perfiles: UID inmutable, allowlist de campos y tipos; excluir role y cualquier claim.
- Carrito: propietario inmutable, cantidades enteras positivas, límite de líneas y
  tamaño, versión monotónica; fusionar carrito local/remoto con política explícita.
- Catálogo público: consultas restringidas a active == true; reglas no son filtros.
- Pedidos propios: consulta por ownerId == auth.uid y paginación; ADMIN separado.
- No confiar en ownerId, estado, precio, descuento o totales recibidos del navegador.
- Backend con Admin SDK también verifica permisos y valida entradas, porque sus
  escrituras no están restringidas por las reglas de clientes.
- Límites de compra, documentos de facturación y envío deben validarse al cotizar.
- Imágenes públicas solo para productos publicados. Borradores en ubicación privada.
  Propuesta: subir a staging privado con sesión ADMIN, límites de tamaño y MIME;
  backend verifica archivo y publica su copia. Una URL de descarga compartible no
  sirve como mecanismo de confidencialidad para imágenes privadas.
- Vencimiento y finalización compiten de forma transaccional; solo una transición gana.
- Auditoría sin contraseñas, tokens o copias innecesarias de documentos personales.

Fuentes: [consultas y reglas](https://firebase.google.com/docs/firestore/security/rules-query),
[transacciones](https://firebase.google.com/docs/firestore/manage-data/transactions).

## Configuración a reunir antes de conectar

1. Proyecto de desarrollo separado de producción; definir región y ubicación de datos
   antes de provisionar. No se crean recursos ni se habilita facturación en esta fase.
2. Registrar aplicación web y obtener configuración pública del SDK:
   apiKey, authDomain, projectId, storageBucket, messagingSenderId y appId.
3. Elegir proveedores de acceso (propuesta inicial: correo/contraseña), dominios
   autorizados, verificación de correo y recuperación de contraseña.
4. Elegir backend confiable y procedimiento para el primer ADMIN.
5. Configurar emuladores y probar autorización antes de usar datos reales.
6. Definir índices para las consultas elegidas y estrategias de publicación de imágenes.

Variables propuestas, todavía no leídas por la aplicación:
VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID.

La configuración web es pública y no sustituye reglas de acceso. Credenciales de
servicio/Admin SDK nunca van en VITE_* ni en el repositorio. Usar .env.local para la
configuración de desarrollo (ya ignorado) y publicar solo un .env.example sin valores
reales cuando se implemente el adaptador.
Fuente: [configuración web](https://firebase.google.com/docs/web/learn-more#config-object).

## Pruebas de aceptación para la futura integración

- Visitante y USER no pueden leer productPricing, inventory ni borradores.
- USER A no puede leer/editar perfil, carrito, cotización o pedidos de USER B.
- Alta o edición de perfil con role/admin/ownerId falsificado se rechaza.
- Escritura directa de precio, stock, order.status o total se rechaza incluso desde UI admin.
- Consultas públicas que puedan devolver productos inactivos se rechazan.
- Falta de sesión, claim inválido y sesión cargando no abren el panel privado.
- Dos compradores intentan adquirir la última unidad: solo una confirmación tiene éxito.
- Repetir confirmación no duplica pedido ni compromiso; otra clave sobre la misma
  cotización tampoco lo duplica.
- Precio modificado o cotización vencida requieren nueva cotización/aceptación.
- Cancelación/vencimiento concurrentes liberan stock una sola vez.
- Intentar completar una reserva vencida o cancelar un pedido completado se rechaza.
- Cambios de marca y modo demo no pueden activar compras con políticas pendientes.

Estos son criterios pendientes de ejecución en emuladores, no pruebas aprobadas.
