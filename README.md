# PlumaZen — Mini plataforma de venta de ebooks (Admin + Lector)

**Marca:** PlumaZen  
**Autor:** Sr. AD

## Qué incluye
- Página pública con catálogo de libros (desde Firebase Firestore)
- Panel de Admin con login (Firebase Auth) para publicar libros
- Página de verificación de compra (envío de comprobante por Email y WhatsApp directo)
- Flujo de entrega **manual y seguro**: enviás PDF protegido por contraseña o link temporal

## Requisitos
- Cuenta de Firebase (gratis): Auth + Firestore habilitados
- Hosting: Vercel o similar

## Pasos de configuración

1) **Crear proyecto Firebase**
- Ir a https://console.firebase.google.com
- Agregar app Web y copiar la *config*.
- Habilitar **Authentication** (Email/Password) y crear tu usuario de admin (ej. `sr.ad@plumazen.com`).
- Habilitar **Firestore** (modo producción).

2) **Pegar configuración**
- En `js/firebase.js` reemplazá los valores `YOUR_*` por los de tu proyecto.

3) **Subir a Vercel**
- Subí la carpeta completa.
- Asegurate de que los archivos `.html` y `/js` y `/css` estén visibles.

4) **Entrar como Admin**
- URL: `/admin.html`
- Iniciá sesión con el usuario que creaste en Firebase Auth.
- Publicá libros (título, descripción, precio, PayPal y portada).

5) **Verificación de compra**
- El lector entra a un libro → botón “Verificar pago / Enviar comprobante” → `comprar.html?book=ID`
- Se manda el formulario por **Email** a `agustindentella68@gmail.com` **y** puede abrir WhatsApp directo a tu número **592352537091** con el mensaje pre-llenado.

6) **Entrega del libro**
- Método recomendado: enviar **PDF con contraseña** (distinta por cliente si querés) o
- Implementar link temporal con expiración (requiere Cloud Function).

---

## (Opcional avanzado) Link temporal con expiración
Para generar enlaces de descarga que expiran, necesitás un backend. Te dejo un ejemplo de **Cloud Function (Node.js)** que genera un link temporal desde Firebase Storage usando la Admin SDK.

> **Importante:** Esto requiere habilitar Storage, subir el archivo, y desplegar funciones.

```js
// functions/index.js
const functions = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();

exports.signDownload = functions.onRequest(async (req, res) => {
  // Autenticación básica con token (pasalo como ?key=TU_TOKEN_SECRETO)
  const key = req.query.key;
  if(key !== process.env.SIGN_KEY) return res.status(403).send('Forbidden');

  const { filename, minutes=60 } = req.query;
  if(!filename) return res.status(400).send('filename required');

  const bucket = admin.storage().bucket();
  const file = bucket.file(filename);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + minutes*60*1000
  });
  res.json({url});
});
```

**Cómo usar:**
- Subí el libro a Storage (por ej. `books/LaVidaMisma.pdf.enc`)
- Desplegá la función con `SIGN_KEY` como variable de entorno.
- Para generar el enlace: `https://REGION-PROJECT.cloudfunctions.net/signDownload?key=TU_KEY&filename=books/LaVidaMisma.pdf.enc&minutes=30`
- Mandá ese link al comprador. Al expirar, ya no funcionará.

> Nota: Si querés además **proteger el PDF con contraseña**, generá el PDF protegido offline (ej. con Acrobat o herramientas CLI) y subí ese archivo a Storage.

---

## Personalización rápida
- Cambiar colores en `css/style.css`
- Cambiar textos de cabecera en `index.html` y `admin.html`
- Ajustar campo de alias/ARS en `comprar.html`

---

## Seguridad
- Este proyecto usa **Auth + Firestore** del lado cliente. Para producción, considerá **reglas estrictas en Firestore** (solo lectura pública y escritura solo autenticada admin).
- Para evitar compartir el PDF, usá **contraseña** y/o **links temporales**.
