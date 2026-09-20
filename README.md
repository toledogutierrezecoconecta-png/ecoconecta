# EcoConecta SCZ

Marketplace B2B de residuos industriales y comerciales para **Santa Cruz de la Sierra, Bolivia**.

EcoConecta SCZ conecta a los negocios que generan materiales aprovechables (restaurantes, cafeterías,
imprentas, fábricas, talleres, textileras, comercios) con las empresas recicladoras, los
recolectores y los emprendimientos que los usan como materia prima.

> El residuo de un negocio puede ser la materia prima de otro.

**El precio no lo pone el oferente.** A diferencia de un marketplace tradicional, EcoConecta SCZ
publica un **rango de referencia por material**, construido con las empresas recicladoras de la
ciudad. El negocio que genera el residuo normalmente no sabe cuánto vale, así que la plataforma se
lo calcula y le muestra el valor estimado de su publicación.

---

## Contenido

1. [Cómo ejecutar el proyecto](#1-cómo-ejecutar-el-proyecto)
2. [Qué incluye el MVP](#2-qué-incluye-el-mvp)
3. [Modelo de precios](#3-modelo-de-precios)
4. [Conectar con Google Sheets](#4-conectar-con-google-sheets)
5. [Publicar en GitHub Pages](#5-publicar-en-github-pages)
6. [Estructura del proyecto](#6-estructura-del-proyecto)
7. [Limitaciones conocidas](#7-limitaciones-conocidas)
8. [Preparado para las próximas versiones](#8-preparado-para-las-próximas-versiones)

---

## 1. Cómo ejecutar el proyecto

Requiere [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
```

```bash
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

Otros comandos:

```bash
npm run build
```

```bash
npm run preview
```

---

## 2. Qué incluye el MVP

La plataforma es **navegable y funcional**, no una maqueta estática:

| Funcionalidad | Estado |
| --- | --- |
| Landing con propuesta de valor, pasos, perfiles e indicadores | Completo |
| Registro e inicio de sesión (simulados, con sesión persistente) | Completo |
| Publicar un residuo, con foto opcional | Completo |
| Explorar el marketplace con buscador y filtros | Completo |
| Filtros por categoría, material, distrito, precio y disponibilidad | Completo |
| Detalle de la publicación con precio de referencia y valor estimado | Completo |
| Página "Cómo definimos los precios" con metodología y tabla vigente | Completo |
| Contacto por WhatsApp, llamada o correo | Completo (WhatsApp real) |
| Panel con resumen, edición, pausa, cierre y eliminación | Completo |
| Diseño responsive pensado para Android | Completo |
| Sincronización con Google Sheets | Listo, falta pegar la URL |

Al abrir la plataforma por primera vez se cargan **10 publicaciones de demostración** para que el
marketplace tenga contenido desde el primer acceso. Desde el panel se pueden restaurar en
cualquier momento con el botón **Restablecer datos de ejemplo**, útil antes de una presentación.

---

## 3. Modelo de precios

El precio de cada material vive en [`src/data/precios.ts`](src/data/precios.ts), no en las
publicaciones. Para actualizarlo después del estudio de mercado, se edita ese archivo:

```ts
{
  materialId: 'aceite-vegetal',
  unidad: 'litros',
  minimo: 1.8,
  maximo: 2.5,
  factores: 'Sube si está filtrado, sin agua ni restos de comida...',
}
```

Y se cambia la constante `VIGENCIA_PRECIOS` con el mes de la actualización, que se muestra en toda
la plataforma.

**Por qué rangos y no un precio único:** el valor real depende de si el material está limpio, seco,
prensado o separado por tipo. Un número exacto quedaría caro para el reciclador o barato para el
oferente, y las partes cerrarían el trato fuera de la plataforma.

**Materiales sin valor de mercado:** los que tienen `minimo: null` (restos de poda, descarte de
frutas) se publican siempre como donación, y el formulario ni siquiera ofrece la opción de cobrar.

**Valor estimado:** la plataforma multiplica la cantidad publicada por el rango y muestra el
resultado al oferente mientras completa el formulario. Es el número que convierte "tengo un
residuo" en "tengo Bs. 144 a 200".

> ⚠️ Los valores cargados hoy son de **demostración**. Reemplazalos por los resultados del estudio
> de mercado real antes de operar.

---

## 4. Conectar con Google Sheets

Mientras no se configure, la aplicación funciona guardando todo en el navegador. Al conectar la
hoja, los registros y las publicaciones se comparten entre todos los dispositivos.

### Paso 1 — Crear la hoja

Entrá a [sheets.new](https://sheets.new) y ponele un nombre, por ejemplo `EcoConecta SCZ — Base de datos`.
No hace falta crear pestañas ni encabezados: el script los genera solo.

### Paso 2 — Pegar el script

1. En la hoja, menú **Extensiones → Apps Script**.
2. Borrá todo lo que haya en el editor.
3. Copiá el contenido completo de [`apps-script/Codigo.gs`](apps-script/Codigo.gs) y pegalo ahí.
4. Guardá con el icono del disquete.

### Paso 3 — Implementar como aplicación web

1. Botón **Implementar → Nueva implementación**.
2. En el engranaje de tipo, elegí **Aplicación web**.
3. Configurá:
   - **Ejecutar como:** Yo (tu cuenta)
   - **Quién tiene acceso:** Cualquier usuario
4. Presioná **Implementar** y autorizá los permisos que pida Google.
5. Copiá la **URL de la aplicación web**; termina en `/exec`.

### Paso 4 — Pegar la URL en el proyecto

Abrí [`src/services/config.ts`](src/services/config.ts) y pegá la URL:

```ts
export const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycb.../exec'
```

Listo. A partir de ese momento:

- Cada registro de usuario se agrega a la hoja **Usuarios**.
- Cada publicación se agrega, edita o elimina en la hoja **Publicaciones**.
- Cada contacto queda registrado en la hoja **Contactos**.
- Al abrir el marketplace se leen las publicaciones de la hoja, así que todos ven lo mismo.

> **Para probar sin recompilar:** en la consola del navegador podés ejecutar
> `localStorage.setItem('ecoconecta.sheetsUrl', 'https://...../exec')` y esa URL toma prioridad.

### Qué NO se envía a la hoja

- **Las contraseñas.** Nunca salen del navegador y se guardan como hash SHA-256.
- **Las fotos.** Quedan en el dispositivo que publicó, para no llenar la planilla.

---

## 5. Publicar en GitHub Pages

El proyecto ya está configurado para esto: `base: './'` en `vite.config.ts` y `HashRouter` en el
enrutado, así que las URLs internas funcionan al recargar sin necesidad de configurar un `404.html`.

```bash
npm install --save-dev gh-pages
```

Agregá estas dos líneas a los `scripts` de `package.json`:

```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

Después, con el repositorio ya subido a GitHub:

```bash
npm run deploy
```

En GitHub: **Settings → Pages → Source: Deploy from a branch → `gh-pages` / root**.
El sitio queda publicado en `https://<tu-usuario>.github.io/<nombre-del-repositorio>/`.

---

## 6. Estructura del proyecto

```
src/
├── components/
│   ├── layout/        Navbar y footer
│   ├── residuos/      Tarjeta e imagen de publicación
│   └── ui/            Botón, campos, etiquetas, modal, iconos
├── data/
│   ├── catalogos.ts   Categorías, materiales, zonas, unidades, frecuencias
│   ├── precios.ts     Tabla de precios de referencia por material
│   └── seed.ts        Publicaciones de demostración
├── hooks/
│   ├── useAuth.tsx        Sesión del usuario
│   └── usePublicaciones.ts Estado del marketplace
├── pages/             Una por pantalla de la aplicación
├── services/
│   ├── almacenamiento.ts  localStorage con manejo de errores
│   ├── auth.ts            Registro e inicio de sesión
│   ├── config.ts          URL de Google Sheets
│   ├── imagenes.ts        Compresión de fotos e IndexedDB
│   ├── publicaciones.ts   Repositorio: única puerta de entrada a los datos
│   └── sheets.ts          Cliente de Apps Script
├── types/             Modelos de dominio
└── utils/             Formato de precios, fechas y enlaces de contacto
```

**Regla de arquitectura:** ningún componente accede a `localStorage` ni a Google Sheets
directamente. Todo pasa por `services/publicaciones.ts` y `services/auth.ts`. Por eso migrar a
Supabase, Firebase o una API REST implica reescribir solo esos archivos, sin tocar las pantallas.

### Decisiones técnicas que conviene conocer

- **Fotos comprimidas en IndexedDB.** Una foto de celular en base64 pesa entre 3 y 8 MB y la cuota
  de `localStorage` ronda los 5 MB. Las imágenes se redimensionan a 900 px y se guardan aparte.
- **Envíos sin preflight CORS.** Las llamadas a Apps Script usan `URLSearchParams`, lo que las
  convierte en *simple requests*. Es el motivo por el que fallan la mayoría de las integraciones
  con Apps Script hechas con JSON.
- **Ilustraciones propias en vez de fotos de stock.** Cada material tiene una ilustración SVG con
  gradiente propio: funcionan sin conexión, nunca aparece una imagen rota en una demo y el catálogo
  se ve uniforme. Si el oferente sube una foto real, esa tiene prioridad.
- **WhatsApp real, no simulado.** El botón arma un enlace `wa.me` con el mensaje ya escrito. No
  necesita API ni tiene costo.

---

## 7. Limitaciones conocidas

Son propias de un MVP y conviene tenerlas presentes antes de mostrar la plataforma:

- **La autenticación es simulada.** No reemplaza a un sistema real: las cuentas viven en el
  navegador. La contraseña se guarda hasheada y no se envía a ningún lado, pero no uses una
  contraseña real.
- **Sin Google Sheets conectado, cada navegador ve solo sus propios datos.** Las publicaciones de
  demostración sí aparecen en todos los dispositivos porque están en el código.
- **Las fotos no se comparten entre dispositivos.** Quedan en el equipo que publicó.
- **La hoja de cálculo es accesible para quien tenga el enlace del script.** Para una demo con
  datos ficticios es aceptable; para operar en serio hace falta un backend con autenticación.
- **No hay pagos ni comisiones.** El acuerdo económico ocurre fuera de la plataforma.

---

## 8. Preparado para las próximas versiones

La arquitectura ya contempla, sin rehacer pantallas:

| Funcionalidad | Dónde se conecta |
| --- | --- |
| Autenticación real (Supabase Auth, Firebase) | `services/auth.ts` |
| Base de datos (PostgreSQL, Supabase, Firestore) | `services/publicaciones.ts` |
| Almacenamiento de imágenes en la nube | `services/imagenes.ts` |
| Geolocalización y mapas | Campo `zona` y `direccion` en `types/index.ts` |
| Chat entre usuarios y notificaciones | Nueva capa sobre el repositorio |
| Reputación, calificaciones e historial | Nuevos campos en `Publicacion` y `Usuario` |
| Verificación de empresas | Campo nuevo en `Usuario` |
| Panel administrativo y estadísticas de impacto | Consulta agregada sobre el repositorio |

---

**EcoConecta SCZ** — Conectamos residuos con nuevas oportunidades.

Santa Cruz de la Sierra, Bolivia
WhatsApp: 78906939 · toledogutierrezecoconecta@gmail.com

Los datos de contacto y el nombre de la empresa se editan en un solo lugar:
[`src/services/config.ts`](src/services/config.ts), constante `EMPRESA`.
