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
> o publicás algo para probar, queda en la hoja real. Para probar el script sin tocarla, usá las
> pruebas automáticas (abajo) o el servidor local de la sección 6.

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
| Cuentas en la hoja: registro, inicio de sesión desde cualquier dispositivo y perfil | Completo |
| Permisos verificados por el Apps Script (solo el dueño edita o elimina) | Completo |
| Menú y panel según el tipo de usuario (oferente, recolector o ambos) | Completo |
| Publicar un residuo, con foto opcional y valor estimado en vivo | Completo |
| Explorar el marketplace con buscador y filtros por categoría, material, zona y precio | Completo |
| Detalle con precio de referencia, valor estimado y contacto por WhatsApp o llamada | Completo |
| Guardar publicaciones (♡) e historial de negocios contactados | Completo |
| Panel del oferente: resumen, valor potencial, quién consultó, edición, pausa, cierre y eliminación | Completo |
| Panel del recolector: novedades en su zona, guardadas y contactos | Completo |
| Página "Cómo definimos los precios" con metodología y tabla vigente | Completo |
| Sincronización con Google Sheets, con reintentos sin conexión | Completo |
| Correo de confirmación al registrarse | Completo |
| Cuentas separadas en las pestañas Empresas, Recolectores y Ambos | Completo |
| Fecha y hora de Bolivia legibles en cada registro, publicación y contacto | Completo |
| Panel de administrador en `/#/admin`, protegido con clave | Completo |
| Vista previa al compartir el enlace (WhatsApp, Facebook, LinkedIn) | Completo |
| Diseño responsive pensado para Android | Completo |

El marketplace muestra solo publicaciones reales, leídas de la hoja. Las publicaciones de ejemplo
de versiones anteriores se descartan también de los navegadores que las tenían guardadas.

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
  nombre y su empresa, y el oferente ve en su panel quién lo consultó.
- **Cada persona suma un solo contacto** por publicación, aunque abra la ventana varias veces
  o desde distintos dispositivos.
- **Las guardadas y el historial de contactos** se guardan en la hoja y se ven desde cualquier
  dispositivo.
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

**La base de datos es una hoja de Google** (requisito del proyecto). Un Apps Script publicado como
aplicación web hace de servidor: lee y escribe la hoja y decide quién puede hacer qué. El código
del script está en [`apps-script/Codigo.gs`](apps-script/Codigo.gs) y su URL en
[`src/services/config.ts`](src/services/config.ts).

### Pestañas de la hoja

| Pestaña | Qué guarda |
| --- | --- |
| **Empresas** | Cuentas de tipo oferente (negocios que generan residuos). |
| **Recolectores** | Cuentas de tipo recolector / comprador. |
| **Ambos** | Cuentas que ofrecen y buscan materiales. |
| **Publicaciones** | Las ofertas del marketplace. Es la única pestaña de lectura pública. |
| **Contactos** | Cada consulta: qué publicación, cuándo y, si tenía cuenta, quién. |
| **Sesiones** *(oculta)* | Llaves de sesión activas; vencen a los 60 días. |
| **Guardados** *(oculta)* | Qué publicaciones guardó cada usuario. |
| **Recuperaciones** *(oculta)* | Códigos para restablecer la contraseña (guardados como hash), con vencimiento e intentos. |

- **Fecha y Hora** son las dos primeras columnas de Empresas, Recolectores, Ambos, Publicaciones
  y Contactos, en hora de Bolivia (`America/La_Paz`). La hoja se configura en esa zona horaria.
- En las pestañas de cuentas, la contraseña se guarda como hash SHA-256 con sal en las columnas
  `hashClave` y `sal`, que quedan **ocultas**. Nunca en texto plano.
- Si una cuenta cambia de tipo en su perfil, su fila se muda a la pestaña que corresponde.
- El script lee **por posición**: se puede cambiar el título de una columna, pero no moverla.
- Las pestañas y columnas que falten se crean solas. Las columnas nuevas se agregan al final, así
  que las filas existentes no se tocan.
- Las pestañas que terminan en **(respaldo)** son las de la versión anterior a la actualización.
  Quedan ocultas y se pueden borrar una vez comprobado que todo funciona.

### Correo de confirmación

Al registrarse, el script envía un correo de bienvenida con el logo, los datos de la cuenta, la
fecha de registro y los próximos pasos según el tipo de usuario. La columna **Correo de
confirmación** de la pestaña de la cuenta dice si salió (`Enviado`) o no. La web muestra el aviso
"Te enviamos un correo de confirmación a…" en la página a la que llega después de registrarse.

### Panel de administrador

Hay dos formas de entrar, y las dos las valida el script (nada de esto está en el código de la web):

- **Con la cuenta de administrador (la habitual).** Los correos de las cuentas administradoras van
  en la propiedad `CORREOS_ADMIN` (Apps Script → Configuración del proyecto → Propiedades de la
  secuencia de comandos), separados por coma. Esa cuenta inicia sesión normalmente y le aparece
  **Admin** en el menú. La cuenta tiene que estar registrada en la web, así que figura en su
  pestaña (Empresas, Recolectores o Ambos).
- **Con la clave, como respaldo.** Escribiendo `…/ecoconecta/#/admin` se pide la **clave de
  administrador**, guardada en la propiedad `CLAVE_ADMIN`. Tras 8 intentos fallidos se bloquea 15
  minutos. Desde esa misma pantalla se puede elegir "Ingresar con mi cuenta de administrador".

Muestra un resumen con los registros de los últimos 7 días, las tablas de Empresas, Recolectores,
Ambos, Publicaciones y Contactos con buscador, acceso directo por WhatsApp y correo, acciones para
pausar, activar o eliminar publicaciones, descarga a Excel (CSV) y un botón para abrir la hoja. La
clave se recuerda solo hasta cerrar el navegador.

### Cuentas y permisos

- **Al registrarse o ingresar**, el script entrega una llave de sesión. Toda modificación viaja
  con esa llave y el script la verifica.
- **Solo el dueño puede editar o eliminar** una publicación. El dueño, el nombre, la empresa, el
  teléfono y el contador de contactos los fija el script a partir de la cuenta, no lo que envía
  la web.
- **Cuentas de la versión anterior.** Antes las cuentas vivían solo en el navegador. La primera
  vez que su dueño ingresa desde ese navegador, la cuenta se pasa a la hoja con la misma
  contraseña y conserva sus publicaciones.
- **Si la llave vence o es inválida**, la web cierra la sesión y pide volver a ingresar.

### Recuperar la contraseña

En "Ingresar" está **¿Olvidaste tu contraseña?**. El script envía un código de 6 dígitos al correo
de la cuenta con `MailApp`, desde la cuenta de Google dueña del script, y con ese código se elige
una contraseña nueva.

- El código vence a los **15 minutos**, sirve **una sola vez** y se bloquea después de **5
  intentos** fallidos. Se pueden pedir como máximo **3 códigos por hora** por correo.
- La respuesta es la misma exista o no la cuenta, para no revelar qué correos están registrados.
- Al cambiar la contraseña se cierran todas las sesiones abiertas de esa cuenta.
- Sirve también para **activar cuentas de la versión anterior** desde cualquier dispositivo.
- Gmail permite unos **100 correos por día** desde Apps Script.

> **Permiso de correo:** enviar correos requiere autorizar a Apps Script una vez. Antes de
> publicar una versión que use un permiso nuevo, subí el código con `npm run sheets:subir`, abrí
> el editor de Apps Script, elegí la función `autorizarCorreo` y tocá **Ejecutar**. Si se publica
> sin autorizar, la aplicación web deja de responder hasta que el dueño lo haga.

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

- **Las fotos.** Quedan en el dispositivo que publicó, para no llenar la planilla.

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

### Al pasar desde la versión del 11/10 (una sola vez)

La versión con pestañas por tipo y fecha y hora cambia la forma de la hoja. Después de subir el
código, en el editor de Apps Script elegí la función **`actualizarHojas`** y tocá **Ejecutar**:
reparte `Usuarios` en Empresas, Recolectores y Ambos **conservando las contraseñas**, agrega Fecha
y Hora, oculta las pestañas técnicas y deja las viejas como respaldo oculto. Se puede ejecutar más
de una vez sin duplicar nada. Recién después se publica la versión nueva.

**Sin clasp** (por ejemplo, desde otra computadora): copiá [`apps-script/Codigo.gs`](apps-script/Codigo.gs)
en el editor de Apps Script, guardá, ejecutá `actualizarHojas` si corresponde y publicá con
**Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión → Implementar**, siempre
sobre la implementación cuya URL termina en `...VCIJSQoy24Q/exec`.

### Probar el Apps Script sin tocar la hoja real

[`apps-script/pruebas/`](apps-script/pruebas/) ejecuta el `Codigo.gs` real en Node sobre una
imitación de Google Sheets, que reproduce sus conversiones automáticas (teléfonos que se vuelven
números, fechas, el apóstrofo inicial) y guarda los correos en una lista en vez de enviarlos.
Cubre la actualización de la hoja (`actualizarHojas`), registro y correo de confirmación, inicio
de sesión, cuentas de la versión anterior, pestañas por tipo, permisos, fórmulas, contactos,
guardados, perfil, vencimiento de sesiones, recuperación de contraseña y panel de administrador.

```bash
npm run sheets:probar
```

`sheets:subir` y `sheets:publicar` corren estas pruebas primero y no suben nada si alguna falla.

Para usar la web contra la hoja simulada, levantá el servidor local (queda en
`http://localhost:8787/exec`, con `/__estado` para ver el contenido de cada pestaña,
`/__correos` para ver los correos que "envió" y `/__reiniciar` para volver al estado inicial). La
hoja simulada arranca ya convertida con `actualizarHojas`, con la clave de administrador
`admin-local` y con la cuenta de prueba `imprenta@ejemplo.test` (contraseña `imprenta1`) como
administradora. En desarrollo, la web se conecta a ella con
`localStorage.setItem('ecoconecta.sheetsUrl', 'http://localhost:8787/exec')`:

```bash
npm run sheets:local
```

---

## 7. Estructura del proyecto

```
apps-script/           Código del Apps Script y su manifiesto (se suben con clasp)
public/                Favicon e imagen para compartir (compartir.jpg)
src/
├── assets/            Logo, ilustraciones de portada y fotos de materiales (WebP)
├── components/
│   ├── layout/        Menú y pie de página
│   ├── panel/         Panel del recolector y aviso de bienvenida
│   ├── portada/       Botones superpuestos a la ilustración de portada
│   ├── residuos/      Tarjeta, imagen y botón de guardar de una publicación
│   └── ui/            Botón, campos, etiquetas, modal, iconos
├── data/
│   ├── catalogos.ts   Categorías, materiales, zonas, unidades, frecuencias
│   ├── imagenes.ts    Fotos de materiales y de portada
│   └── precios.ts     Tabla de precios de referencia por material
├── hooks/
│   ├── useActividad.ts      Guardadas y contactos del usuario
│   ├── useAuth.tsx          Sesión del usuario
│   ├── useMediaQuery.ts     Elige la portada de escritorio o de celular
│   └── usePublicaciones.ts  Estado del marketplace
├── pages/             Una por pantalla de la aplicación
├── services/
│   ├── actividad.ts       Guardadas y contactos realizados
│   ├── admin.ts           Datos y acciones del panel de administrador
│   ├── almacenamiento.ts  localStorage con manejo de errores
│   ├── auth.ts            Registro, inicio de sesión, perfil y cuentas de la versión anterior
│   ├── bienvenida.ts      Aviso de "te enviamos un correo" después de registrarse
│   ├── config.ts          URL de Google Sheets y datos de contacto de EcoConecta
│   ├── imagenes.ts        Compresión de fotos e IndexedDB
│   ├── pendientes.ts      Cambios que la hoja todavía no confirmó
│   ├── publicaciones.ts   Repositorio: única puerta de entrada a los datos
│   ├── sesion.ts          Sesión del navegador y su llave
│   └── sheets.ts          Cliente de Apps Script
├── types/             Modelos de dominio
└── utils/             Formato de precios y fechas, enlaces de contacto, permisos por tipo
```

**Regla de arquitectura:** ningún componente accede a `localStorage` ni a Google Sheets
directamente. Todo pasa por los archivos de `services/`, así que cambiar la forma de guardar los
datos implica tocar solo esos archivos, no las pantallas.

Los datos de contacto y el nombre de la empresa se editan en un solo lugar:
[`src/services/config.ts`](src/services/config.ts), constante `EMPRESA`.

---

## 8. Limitaciones conocidas

- **Las fotos no se comparten entre dispositivos.** Quedan en el equipo que publicó.
- **Recuperar la contraseña depende del correo.** Si alguien perdió el acceso al correo de su
  cuenta, hay que borrar a mano su fila de la pestaña Usuarios para que se registre de nuevo.
- **No hay límite de intentos de contraseña al ingresar.** El hash es lento a propósito, pero el
  script no bloquea a quien prueba muchas contraseñas seguidas (los códigos de recuperación sí
  tienen límite).
- **El script atiende un pedido de escritura a la vez** (LockService). Alcanza para un proyecto
  de este tamaño; con muchos usuarios simultáneos las respuestas se harían lentas.
- **Si una publicación se edita en dos dispositivos a la vez**, queda la última versión que llegó
  a la hoja.
- **No hay pagos ni comisiones.** El acuerdo económico ocurre fuera de la plataforma.

---

## 9. Próximas versiones

| Funcionalidad | Dónde se conecta |
| --- | --- |
| Fotos compartidas entre dispositivos (Google Drive) | `services/imagenes.ts` y el Apps Script |
| Registrar las operaciones concretadas (cantidad, precio, con quién) | Nuevos campos en `Publicacion` |
| Publicar demanda ("busco cartón en el D-8") y alertas | Nueva entidad sobre el repositorio |
| Calificaciones y verificación de empresas | Nuevos campos en `Usuario` |
| Mapa y orden por cercanía | Campos `zona` y `direccion` en `types/index.ts` |
| Indicadores reales de impacto en la portada | Consulta agregada sobre las operaciones concretadas |

---

**EcoConecta SCZ** — Conectamos residuos con nuevas oportunidades.

Santa Cruz de la Sierra, Bolivia
WhatsApp: 78906939 · toledogutierrezecoconecta@gmail.com
