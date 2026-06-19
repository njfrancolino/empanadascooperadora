# La Cooperadora — Gestión de pedidos de empanadas

App para que todos los integrantes de la comisión carguen pedidos, vean los
totales en tiempo real, y el tesorero gestione las entregas y cobros del
evento del mes.

Esta guía está pensada para alguien sin experiencia previa en programación.
Hay que crear dos cuentas gratuitas (Firebase y GitHub+Vercel) y seguir los
pasos en orden. Se tarda entre 20 y 40 minutos la primera vez.

---

## Parte 1 — Crear la base de datos en Firebase (gratis)

1. Entrá a https://console.firebase.google.com con una cuenta de Google
   (puede ser una nueva, dedicada a la cooperadora).
2. Tocá **"Agregar proyecto"** (Add project). Ponele un nombre, por ejemplo
   `cooperadora-empanadas`. Aceptá las condiciones y creá el proyecto
   (no hace falta activar Google Analytics, podés desactivarlo).
3. Dentro del proyecto, en el menú de la izquierda, entrá a
   **"Compilación" (Build) → Firestore Database**.
4. Tocá **"Crear base de datos"**. Elegí la ubicación más cercana
   (por ejemplo `southamerica-east1`). Elegí modo **"Producción"**.
5. Una vez creada, andá a la pestaña **"Reglas" (Rules)** dentro de
   Firestore, borrá lo que hay y pegá el contenido del archivo
   `firestore.rules` que está en este proyecto. Tocá **"Publicar"**.
6. Ahora andá a **"Configuración del proyecto"** (el ícono de tuerca, arriba
   a la izquierda) → pestaña **"General"** → bajá hasta
   **"Tus apps"** → tocá el ícono `</>` (Web) para agregar una app web.
7. Ponele un nombre (por ejemplo "cooperadora-web") y tocá
   **"Registrar app"**. NO hace falta activar Firebase Hosting.
8. Firebase te va a mostrar un bloque de código con valores como
   `apiKey`, `authDomain`, `projectId`, etc. **Guardá esos valores**, los
   vas a necesitar en la Parte 3.

---

## Parte 2 — Subir el código a GitHub

1. Entrá a https://github.com y creá una cuenta gratuita si no tenés.
2. Tocá **"New repository"** (Nuevo repositorio). Ponele un nombre, por
   ejemplo `cooperadora-empanadas`. Dejalo en **"Public"** o **"Private"**
   (cualquiera de las dos opciones funciona). Tocá **"Create repository"**.
3. En la página del repositorio recién creado, vas a ver un botón
   **"uploading an existing file"** (subir un archivo existente) — tocalo.
4. Arrastrá **todos los archivos y carpetas de este proyecto** a esa zona
   de carga (manteniendo la misma estructura de carpetas: `app/`,
   `components/`, `lib/`, `public/`, y los archivos sueltos como
   `package.json`).
5. Abajo, en "Commit changes", tocá **"Commit changes"** para confirmar
   la subida.

---

## Parte 3 — Publicar la app con Vercel (gratis)

1. Entrá a https://vercel.com y elegí **"Sign Up" → "Continue with
   GitHub"** para crear tu cuenta usando la cuenta de GitHub del paso
   anterior.
2. Una vez dentro, tocá **"Add New..." → "Project"**.
3. Vercel te va a mostrar tu repositorio `cooperadora-empanadas` —
   tocá **"Import"**.
4. Antes de tocar "Deploy", abrí la sección **"Environment Variables"**
   (Variables de entorno) y agregá una por una las 6 variables que
   guardaste de Firebase en la Parte 1, usando estos nombres exactos:

   | Nombre | Valor (de Firebase) |
   |---|---|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | apiKey |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | authDomain |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | projectId |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | storageBucket |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | appId |

5. Tocá **"Deploy"**. Esperá 1-2 minutos.
6. Al terminar, Vercel te va a mostrar una URL pública, algo como
   `https://cooperadora-empanadas.vercel.app`. **Esa es la dirección de
   tu app.**

---

## Parte 4 — Compartirla con los integrantes

1. Entrá a esa URL desde tu teléfono y probá iniciar sesión con
   **Francolino / abcde** (usuario administrador).
2. Desde la pestaña **"Integrantes"**, agregá a cada integrante de la
   comisión con su nombre, apellido, usuario y contraseña.
3. Enviá la URL por WhatsApp a cada integrante.
4. Cada integrante, al abrir la URL en su teléfono (Chrome en Android,
   Safari en iPhone), puede tocar el menú (⋮ o el ícono de compartir) y
   elegir **"Agregar a pantalla de inicio"** — así les queda un ícono
   como el de cualquier app, sin pasar por ninguna tienda de aplicaciones.

---

## ¿Cómo actualizo la app si quiero hacerle cambios?

Cada vez que se modifique el código y se vuelva a subir a GitHub (Parte 2),
Vercel detecta el cambio automáticamente y actualiza la app sola, sin
volver a hacer nada en Vercel.

## ¿Cuánto cuesta?

Con el uso típico de una comisión cooperadora (un evento al mes, decenas
de pedidos, pocos usuarios) tanto Firebase como Vercel se mantienen
dentro de su plan gratuito indefinidamente.
