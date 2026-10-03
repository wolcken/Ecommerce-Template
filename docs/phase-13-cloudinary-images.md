# Fase 13: imágenes de productos con Cloudinary

## Flujo administrativo

El formulario de productos permite seleccionar una imagen JPG, PNG, WebP o AVIF de hasta 10 MB. La interfaz genera una vista previa local y conserva el archivo sin enviarlo mientras se completa el formulario.

Al guardar el producto:

1. el navegador valida el formato y el tamaño;
2. sube el archivo directamente al endpoint de imágenes de Cloudinary con el preset unsigned;
3. valida que Cloudinary devuelva una URL HTTPS de `res.cloudinary.com`;
4. guarda esa URL pública en el documento del producto;
5. el catálogo usa la misma URL mediante su componente de imagen existente.

También se conserva el campo de URL manual como alternativa. Si la subida termina pero Firestore rechaza el guardado, la URL devuelta permanece en el formulario para reintentar sin duplicar la imagen.

## Variables públicas

```env
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

Ambos valores forman parte del bundle del navegador. No se deben agregar `API_SECRET`, credenciales de administración ni firmas privadas a variables `VITE_*`.

## Configuración recomendada del preset

El preset unsigned debe limitar en Cloudinary los formatos aceptados, el tamaño máximo, la carpeta de destino y cualquier transformación de entrada necesaria. Como el plan Spark no usa Firebase Storage ni Cloud Functions, Cloudinary se encarga del almacenamiento y entrega pública de estas imágenes.

La base no elimina automáticamente activos reemplazados o abandonados. Esa limpieza requiere una operación firmada desde un backend confiable o una revisión periódica en Cloudinary.

## Verificación

Las pruebas cubren configuración incompleta, nombres inválidos, formatos no admitidos y el límite local de 10 MB. La subida real se ejecuta únicamente cuando un administrador guarda un producto con un archivo seleccionado.

