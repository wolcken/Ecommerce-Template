# Fase 4 — Administración de catálogo y pruebas

## Alcance implementado

- Formularios de alta/edición/desactivación de categorías y productos.
- Categorías raíz en esta fase; edición de jerarquías queda pendiente.
- Producto nuevo inicia sin publicar. Nombre, descripción, categoría, SKU, slug,
  URL HTTPS opcional de imagen, costo, ganancia, recargo y existencias.
- SKU y slug son inmutables después del alta. Desactivar conserva el registro.
- Precio privado y público se actualizan en una transacción con inventario.
- El servidor aplica la fórmula compartida cost-plus-fixed-v1. No acepta precio público
  suministrado por el navegador.
- Control de versiones para evitar sobrescrituras, índices de unicidad, auditoría,
  validación de existencias comprometidas y bloqueo de desactivación de categorías
  con productos o subcategorías activos.
- Categorías y productos se listan en páginas de 100 registros para ADMIN.
- Solo un claim admin booleano true permite invocar las funciones.
- Firestore sigue denegando todas las escrituras directas desde la web.

No se incluye carga de archivos a Storage, checkout, reservas o emisión fiscal.
Las imágenes de esta fase se indican mediante URL HTTPS. El límite inicial de costo
y ganancia es Bs 10.000.000; recargo de 0 a 100 %; existencias hasta 1.000.000 unidades.
Ajustar esos límites requiere revisar UI y validación de servidor.

## Backend y ejecución local

Backend: functions/, Node 24, Firebase Functions de segunda generación.
Región inicial: us-central1 en functions/src/index.ts. El frontend usa
VITE_FIREBASE_FUNCTIONS_REGION (us-central1 por defecto). Antes de desplegar,
confirmar que esta región es adecuada y mantener ambos valores alineados.

La compilación incluye la calculadora de precios compartida desde src/features/pricing;
el resultado se guarda en functions/lib, ignorado por Git. El main del paquete apunta
a lib/functions/src/index.js. No editar archivos compilados.

Instalar una vez:
```sh
yarn install --frozen-lockfile
yarn --cwd functions install --frozen-lockfile
```

Validar:
```sh
yarn lint
yarn typecheck
yarn test
yarn build:functions
yarn test:integration
yarn build
```

La integración usa exclusivamente el proyecto demo-ecommerce-test y puertos locales:
Auth 9099, Firestore 8080 y Functions 5001. Nunca carga .env.local.
El lanzador normaliza PATH en Windows y utiliza JAVA_HOME o Java de Android Studio
si está disponible. En otros equipos instalar Java compatible y configurarlo en PATH.

Interfaz local:
```sh
yarn emulators
# En otra terminal:
yarn dev:emulator
```

Vista previa en http://127.0.0.1:5174. El lanzador inyecta configuración ficticia;
no reutiliza las credenciales del proyecto real. VITE_USE_FIREBASE_EMULATORS=true
solo se acepta con un projectId que comienza por demo-. No se conectan servicios
de Storage ni otros servicios reales desde esta vista.

## Validación ejecutada

14 pruebas unitarias y 10 de integración aprobadas:
- Anónimo/USER rechazados por las funciones de administración.
- ADMIN crea categoría y producto; costo 5000 + ganancia 200 + 16 % = 6032 Bs.
- Campos de costo/ganancia no aparecen en el documento público.
- Lectura pública activa permitida; consultas sin filtro, costos e inventario denegados.
- Escritura directa denegada incluso a ADMIN.
- Versiones antiguas, SKU/slugs duplicados y precio inyectado rechazados.
- Categorías con productos activos no pueden desactivarse.
- Stock físico no puede caer por debajo de comprometido.
- Dos ediciones concurrentes: solo una tiene éxito.
- Desactivar impide lectura pública y conserva el registro administrativo.

Revisión de navegador en emuladores:
inicio de sesión, persistencia al cambiar/recargar rutas, creación de categoría,
creación y edición de producto, precio público correcto y vista móvil sin desborde.
No se crearon usuarios ni productos de prueba en el proyecto real.
Las cuentas admin@example.test/user@example.test usadas por las pruebas son solo locales.

## Estado del proyecto real

La configuración pública estaba en .env.example. Se trasladó a .env.local y la
plantilla quedó vacía. El modo local real ahora es firebase.
No se reescribió el historial Git (la configuración web no es una clave Admin SDK).

Comprobaciones de solo lectura:
- API de configuración de Authentication responde correctamente.
- Lecturas públicas de products y categories devuelven permission-denied.
- Lectura de productPricing denegada, como corresponde.
- Firebase CLI no tiene una sesión autenticada.

Por ello no se desplegaron reglas ni funciones y no se validó acceso/registro real.
Se necesita iniciar sesión en Firebase CLI, confirmar el proyecto/región y compartir
el UID de la cuenta que se quiere administrar. La asignación del claim debe realizarse
con un proceso privilegiado autorizado; esta aplicación no permite ascensos de rol.

## Preparación para despliegue

1. Iniciar sesión con yarn firebase login desde la terminal del usuario.
2. Confirmar proyecto/región, plan y permisos necesarios para Cloud Functions.
3. Revisar los cambios antes de desplegar firestore.rules, índices y funciones.
   El comando debe usar --project con el ID real explícito; no hay .firebaserc implícito.
4. Asignar el claim admin a la cuenta indicada mediante Admin SDK desde un entorno
   confiable. No colocar una cuenta de servicio en variables VITE_*.
5. Reiniciar yarn dev, cerrar/abrir sesión para refrescar claims y probar un registro
   controlado. Verificar catálogo anónimo y separación de precios internos.

Las pruebas locales no sustituyen esa comprobación posterior al despliegue.
La publicación puede requerir habilitar facturación y APIs; no se hizo en esta fase.
