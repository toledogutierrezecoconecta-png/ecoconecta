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

**Sitio publicado:** https://toledogutierrezecoconecta-png.github.io/ecoconecta/

---

## Contenido

1. [Cómo ejecutar el proyecto](#1-cómo-ejecutar-el-proyecto)
2. [Qué incluye](#2-qué-incluye)
3. [Oferentes y recolectores](#3-oferentes-y-recolectores)
4. [Modelo de precios](#4-modelo-de-precios)
5. [Google Sheets y sincronización](#5-google-sheets-y-sincronización)
6. [Publicar cambios](#6-publicar-cambios)
7. [Estructura del proyecto](#7-estructura-del-proyecto)
8. [Limitaciones conocidas](#8-limitaciones-conocidas)
9. [Próximas versiones](#9-próximas-versiones)

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

> **Ojo:** en local la app usa la **misma hoja de Google que el sitio publicado**. Si te registrás
> o publicás algo para probar, queda en la hoja real. Para probar sin tocarla, en la consola del
> navegador ejecutá `localStorage.setItem('ecoconecta.sheetsUrl', 'https://sin-sincronizar.invalid/exec')`
> y recargá; para volver a la normalidad, `localStorage.removeItem('ecoconecta.sheetsUrl')`.

Otros comandos:

```bash
npm run build
```

```bash
npm run lint
```

---

## 2. Qué incluye

| Funcionalidad | Estado |
| --- | --- |
| Portada con acceso directo a "Tengo material" y "Busco material" | Completo |
| Registro e inicio de sesión (simulados, con sesión persistente) | Completo |
| Menú y panel según el tipo de usuario (oferente, recolector o ambos) | Completo |
| Publicar un residuo, con foto opcional y valor estimado en vivo | Completo |
| Explorar el marketplace con buscador y filtros por categoría, material, zona y precio | Completo |
| Detalle con precio de referencia, valor estimado y contacto por WhatsApp o llamada | Completo |
| Guardar publicaciones (♡) e historial de negocios contactados | Completo |
| Panel del oferente: resumen, valor potencial, edición, pausa, cierre y eliminación | Completo |
| Panel del recolector: novedades en su zona, guardadas y contactos | Completo |
| Página "Cómo definimos los precios" con metodología y tabla vigente | Completo |
| Sincronización con Google Sheets, con reintentos sin conexión | Completo |
| Vista previa al compartir el enlace (WhatsApp, Facebook, LinkedIn) | Completo |
| Diseño responsive pensado para Android | Completo |

El marketplace incluye **10 publicaciones de ejemplo** (9 disponibles y 1 concretada) para que tenga contenido. Se muestran con
la etiqueta "Publicación de ejemplo", después de las reales y **sin opción de contacto**: sus
teléfonos son inventados y podrían pertenecer a personas reales.

---

## 3. Oferentes y recolectores

Al registrarse, cada usuario elige un tipo. Lo que ve depende de esa elección
(ver [`src/utils/roles.ts`](src/utils/roles.ts)):

| | Oferente | Recolector | Ambos |
| --- | --- | --- | --- |
| Publicar residuos | ✅ | — | ✅ |
| Panel | Mis publicaciones | Guardadas, contactos y novedades | Las dos vistas, con pestañas |
| Guardar publicaciones y ver a quién contactó | ✅ | ✅ | ✅ |

- **Al contactar con sesión iniciada**, el mensaje de WhatsApp presenta al recolector con su
  nombre y su empresa.
- **Cada persona suma un solo contacto** por publicación, aunque abra la ventana varias veces.
- **El recolector puede elegir su zona de trabajo** en el perfil, y su panel le muestra primero
  lo que se publica ahí.
- **Al cambiar el teléfono o la empresa en el perfil**, se actualizan también todas las
  publicaciones de esa cuenta.

---

## 4. Modelo de precios

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
resultado al oferente mientras completa el formulario.

> ⚠️ Los valores cargados hoy son de **demostración** y la página de precios lo indica.
> Reemplazalos por los resultados del estudio de mercado real.

---

## 5. Google Sheets y sincronización

Los usuarios y las publicaciones se guardan en una hoja de Google, a través de un Apps Script
publicado como aplicación web. El código del script está en
[`apps-script/Codigo.gs`](apps-script/Codigo.gs) y su URL en
[`src/services/config.ts`](src/services/config.ts).

### Cómo se combinan la hoja y el navegador

- **La hoja es la fuente de verdad.** Si responde, se usa su versión de cada publicación, y lo que
  ya no está en ella desaparece del navegador. Así, lo que un oferente cambia desde su celular lo
  ven todos los demás al recargar.
- **Los cambios hechos en el navegador quedan pendientes** hasta que la hoja los confirma
  ([`src/services/pendientes.ts`](src/services/pendientes.ts)). Mientras tanto, la versión local
  manda: lo eliminado no reaparece y lo recién creado no desaparece.
- **Sin conexión, los pendientes se reintentan solos** la próxima vez que se carga el marketplace.
  El panel del oferente muestra un aviso mientras haya cambios sin confirmar.
- **Si la hoja no responde**, se muestra lo guardado en el navegador.

### Qué NO se envía a la hoja

- **Las contraseñas.** Nunca salen del navegador y se guardan como hash SHA-256.
- **Las fotos.** Quedan en el dispositivo que publicó, para no llenar la planilla.
- **Las publicaciones guardadas y el historial de contactos.** Quedan en el navegador.

### Protección de la hoja

El script guarda como texto cualquier valor que empiece con `=`, `+`, `-` o `@`, para que nadie
pueda ejecutar fórmulas en la planilla escribiéndolas en una publicación.

### Decisiones técnicas

- **Envíos sin preflight CORS.** Las llamadas a Apps Script usan `URLSearchParams`, lo que las
  convierte en *simple requests*. Es el motivo por el que fallan la mayoría de las integraciones
  con Apps Script hechas con JSON.
- **La hoja normaliza los tipos.** Google Sheets convierte fechas y teléfonos; el script los
  devuelve siempre como texto.

---

## 6. Publicar cambios

El sitio se publica en **GitHub Pages** desde la rama `gh-pages`. El enrutado usa `HashRouter` y
`base: './'`, así que funciona en cualquier subcarpeta sin configurar un `404.html`.

Publicar el sitio:

```bash
npm run deploy
```

GitHub tarda uno o dos minutos en mostrar la versión nueva.

### Actualizar el Apps Script

El proyecto usa [clasp](https://github.com/google/clasp) para subir el script sin copiar y pegar.
La conexión está en [`.clasp.json`](.clasp.json). La primera vez hay que iniciar sesión con la
cuenta de Google dueña de la hoja (y tener activada la API de Apps Script en
https://script.google.com/home/usersettings):

```bash
clasp login
```

Subir el script **sin afectar el sitio** (para probar en el editor de Apps Script):

```bash
npm run sheets:subir
```

Publicarlo **en vivo**, como versión nueva de la misma implementación (la URL `/exec` no cambia):

```bash
npm run sheets:publicar
```

> Nunca crees una implementación nueva desde el editor de Apps Script: cambiaría la URL `/exec`
> y el sitio dejaría de conectarse con la hoja.

---

## 7. Estructura del proyecto

```
apps-script/           Código del Apps Script y su manifiesto (se suben con clasp)
public/                Favicon e imagen para compartir (compartir.jpg)
src/
├── assets/            Logo, ilustraciones de portada y fotos de materiales (WebP)
├── components/
│   ├── layout/        Menú y pie de página
│   ├── panel/         Panel del recolector
│   ├── portada/       Botones superpuestos a la ilustración de portada
│   ├── residuos/      Tarjeta, imagen y botón de guardar de una publicación
│   └── ui/            Botón, campos, etiquetas, modal, iconos
├── data/
│   ├── catalogos.ts   Categorías, materiales, zonas, unidades, frecuencias
│   ├── imagenes.ts    Fotos de materiales y de portada
│   ├── precios.ts     Tabla de precios de referencia por material
│   └── seed.ts        Publicaciones de ejemplo
├── hooks/
│   ├── useActividad.ts      Guardadas y contactos del usuario
│   ├── useAuth.tsx          Sesión del usuario
│   ├── useMediaQuery.ts     Elige la portada de escritorio o de celular
│   └── usePublicaciones.ts  Estado del marketplace
├── pages/             Una por pantalla de la aplicación
├── services/
│   ├── actividad.ts       Guardadas y contactos realizados
│   ├── almacenamiento.ts  localStorage con manejo de errores
│   ├── auth.ts            Registro e inicio de sesión
│   ├── config.ts          URL de Google Sheets y datos de contacto de EcoConecta
│   ├── imagenes.ts        Compresión de fotos e IndexedDB
│   ├── pendientes.ts      Cambios que la hoja todavía no confirmó
│   ├── publicaciones.ts   Repositorio: única puerta de entrada a los datos
│   └── sheets.ts          Cliente de Apps Script
├── types/             Modelos de dominio
└── utils/             Formato de precios y fechas, enlaces de contacto, permisos por tipo
```

**Regla de arquitectura:** ningún componente accede a `localStorage` ni a Google Sheets
directamente. Todo pasa por los archivos de `services/`. Por eso migrar a Supabase, Firebase o
una API REST implica reescribir solo esos archivos, sin tocar las pantallas.

Los datos de contacto y el nombre de la empresa se editan en un solo lugar:
[`src/services/config.ts`](src/services/config.ts), constante `EMPRESA`.

---

## 8. Limitaciones conocidas

- **Las cuentas existen solo en el navegador donde se crearon.** No se puede iniciar sesión desde
  otro dispositivo, y si se borran los datos del navegador se pierde el acceso para gestionar las
  publicaciones. La contraseña se guarda hasheada, pero no uses una contraseña real.
- **La URL del Apps Script es pública.** Quien la conozca podría modificar o eliminar
  publicaciones enviando pedidos directamente al script. Para operar a escala hace falta un
  backend con autenticación.
- **Las fotos, las guardadas y el historial de contactos no se comparten entre dispositivos.**
- **El oferente no ve quién lo contactó**, solo cuántas personas.
- **Si una publicación se edita en dos dispositivos a la vez**, queda la última versión que llegó
  a la hoja.
- **Los cambios de perfil no se envían a la hoja de usuarios**; sí se copian a las publicaciones.
- **No hay pagos ni comisiones.** El acuerdo económico ocurre fuera de la plataforma.

---

## 9. Próximas versiones

| Funcionalidad | Dónde se conecta |
| --- | --- |
| Cuentas reales y base de datos (Supabase, Firebase) | `services/auth.ts`, `services/publicaciones.ts` |
| Fotos compartidas entre dispositivos | `services/imagenes.ts` |
| Ver quién contactó y registrar las operaciones concretadas | Nuevos campos en `Publicacion` |
| Publicar demanda ("busco cartón en el D-8") y alertas | Nueva entidad sobre el repositorio |
| Calificaciones y verificación de empresas | Nuevos campos en `Usuario` |
| Mapa y orden por cercanía | Campos `zona` y `direccion` en `types/index.ts` |
| Indicadores reales de impacto en la portada | Consulta agregada sobre las operaciones concretadas |

---

**EcoConecta SCZ** — Conectamos residuos con nuevas oportunidades.

Santa Cruz de la Sierra, Bolivia
WhatsApp: 78906939 · toledogutierrezecoconecta@gmail.com
