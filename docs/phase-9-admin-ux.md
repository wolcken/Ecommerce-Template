# Fase 9: sesión visible e inventario administrativo

## Sesión

Las vistas públicas muestran `Cerrar sesión` junto a la cuenta y el carrito. El panel administrativo muestra el correo activo y la misma acción en su encabezado. Al cerrar sesión se regresa al inicio de la tienda.

La página `/cuenta` conserva también la acción, por lo que el usuario puede salir desde cualquier zona relacionada con su sesión.

## Inventario

El resumen administrativo distingue:

- stock físico: todas las unidades registradas en almacén;
- comprometido: unidades asignadas a pedidos o reservas confirmados;
- disponible: stock físico menos comprometido.

La tabla de productos muestra esos tres valores por artículo. El formulario de edición impide reducir el stock físico por debajo de las unidades comprometidas y anticipa el disponible resultante.

El resumen lee únicamente la colección privada `inventory` y pagina sus resultados. No expone existencias al catálogo público ni requiere Cloud Functions.

## Validación esperada

```sh
yarn lint
yarn typecheck
yarn test
yarn build
```

La comprobación unitaria cubre el cálculo agregado y rechaza inventarios negativos, fraccionarios o con más unidades comprometidas que físicas.
