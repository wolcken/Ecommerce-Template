# Fase 3 — Entorno y conexión inicial de Firebase

## Estado

Implementados: selección explícita demo/firebase, inicialización del SDK, registro,
acceso, cierre de sesión, recuperación de contraseña, sesión observada, guard de
administración y lectura del catálogo publicado. No hay escrituras de productos,
perfiles, carritos, inventario ni pedidos. Storage no está conectado.

Validación local: lint, tipos, build y pruebas unitarias de configuración, validación
de catálogo y precios. La integración real depende de completar la configuración.
Las reglas incluidas no se han desplegado ni probado en emuladores en esta fase:
no hay proyecto configurado ni Java disponible en PATH. No confundir compilación
TypeScript con validación de permisos de Firebase.

## Completar configuración

1. Abrir .env.local (ya creado e ignorado por Git).
2. Firebase Console → Configuración del proyecto → Tus apps → aplicación web.
   Copiar los campos del firebaseConfig a las variables correspondientes.
3. Mantener VITE_DATA_SOURCE=demo mientras se configura el proyecto.
4. Habilitar Authentication → correo/contraseña y revisar dominios autorizados.
   Definir una política de contraseñas y protección contra enumeración de correos.
5. Crear Firestore en la ubicación elegida. Las reglas deben estar restringidas,
   nunca en modo de prueba público.
6. Revisar y validar firestore.rules antes de publicarlas en el proyecto de desarrollo.
   firebase.json referencia reglas e índices; no se incluye .firebaserc ni un ID inventado.
   Estas reglas solo permiten leer products/categories activos. Todo lo demás se deniega,
   incluidas escrituras desde ADMIN. Las operaciones privilegiadas son otra fase.
7. Cambiar VITE_DATA_SOURCE=firebase y reiniciar yarn dev. No basta recargar la pestaña.
8. Si falta una variable, se muestra un error de configuración. Si falla Firestore,
   se muestra el error con Reintentar, sin sustituir datos reales por la demo.

| Variable | Campo de firebaseConfig |
| --- | --- |
| VITE_FIREBASE_API_KEY | apiKey |
| VITE_FIREBASE_AUTH_DOMAIN | authDomain |
| VITE_FIREBASE_PROJECT_ID | projectId |
| VITE_FIREBASE_STORAGE_BUCKET | storageBucket |
| VITE_FIREBASE_MESSAGING_SENDER_ID | messagingSenderId |
| VITE_FIREBASE_APP_ID | appId |

No pegar JSON de cuenta de servicio, private_key ni credenciales Admin SDK. Estos
campos son configuración pública de la aplicación web; Vite los incluye en el
navegador al compilar. No sirven como autorización de acceso.
Fuente: [configuración Firebase web](https://firebase.google.com/docs/web/learn-more#config-object).

.env.example se versiona; .env.local y variantes con valores se ignoran.
No registrar passwords ni imprimir variables de entorno en logs.

## Autenticación y permisos

/login y /registro muestran formularios en modo firebase; /recuperar-acceso permite
solicitar correo de recuperación. El resultado de recuperación no confirma si existe
una cuenta. La política del proveedor puede exigir más que el mínimo de 6 caracteres
del formulario. Los errores de red/política se presentan al usuario.

El registro crea únicamente la cuenta de Authentication; aún no crea UserProfile.
La cuenta permanece autenticada después del alta. El menú Mi cuenta permite salir.
No se enviaron correos ni se crearon usuarios durante esta implementación.

El observador onIdTokenChanged lee el claim admin; únicamente el booleano true da
acceso a /admin. Sin sesión se redirige al login; USER recibe acceso restringido.
Durante carga/error de sesión no se concede acceso. El backend y las reglas siguen
siendo la frontera de seguridad, no este guard.

Para el primer ADMIN se necesita un proceso privilegiado separado que establezca el
claim; esta aplicación no ofrece ascenso de rol. Cerrar sesión e iniciar de nuevo
después de cambiar claims. En modo demo /admin sigue siendo una vista ficticia y no
se inicializa Firebase.

Referencia: [Firebase Auth web](https://firebase.google.com/docs/reference/js/auth).

## Catálogo y estructura de documentos

Colecciones: products y categories. El lector consulta active == true, valida campos
y fechas y solo entrega a React la proyección pública definida en fase 2.
No guardar costos/ganancias en products aunque la UI no los muestre: los documentos
públicos completos son accesibles por las reglas.

Usar los campos de PublicProduct/CategoryRecord documentados en la fase 2, con
createdAt/updatedAt como Timestamp de Firestore (también se aceptan ISO UTC).
IDs provienen del documento, no de un campo duplicado. Slugs en minúsculas con guiones.
Productos requieren imágenes como array (puede estar vacío), moneda BOB y precio en
centavos: priceMinor=603200 muestra Bs 6.032,00. parentId de categorías raíz es null.
Imágenes externas deben usar HTTPS; imágenes ausentes o fallidas muestran un reemplazo.

La lectura obtiene páginas de 100 documentos hasta terminar y construye una instantánea
de catálogo. Esto es suficiente para la base inicial; un catálogo grande requerirá
paginación visible y carga por ruta para evitar descargarlo entero. No son listeners
en tiempo real; recargar actualiza los datos. Productos sin categoría activa se omiten.
Las listas vacías muestran un estado vacío, no productos ficticios.

El panel de esta fase solo muestra ese catálogo público activo. No consulta costos,
inventario ni productos inactivos. La creación/edición y carga de imágenes llegarán
con servicios de backend y permisos correspondientes.

## Validación pendiente con tu proyecto

- Registro, acceso, recuperación y cierre de sesión reales.
- Persistencia de sesión al recargar.
- Acceso anónimo/USER denegado a /admin; ADMIN permitido.
- Lectura de productos/categorías activos; privados/inactivos denegados.
- Escrituras comerciales denegadas incluso con sesión ADMIN.
- Catálogo vacío, documento inválido, conexión fallida e imagen no disponible.
- Pruebas de reglas con emuladores antes de publicar datos reales.

No se ha desplegado ningún recurso. Agregar las credenciales no publica las reglas.
El build actual incluye el SDK de Firebase en el paquete principal; Vite avisa sobre
su tamaño. La división de carga del SDK queda como optimización posterior.

