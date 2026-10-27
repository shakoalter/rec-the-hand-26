# RECTHEHAND26 — AUDITORÍA INTEGRAL DE RESPONSIVE DESIGN, MOBILE-FIRST Y ADAPTACIÓN A VIEWPORT (VERSIÓN 2 — CORREGIDA)

**Fecha de Auditoría Original:** 27 de octubre de 2026  
**Fecha de Revisión Correctiva (v2.0):** 27 de octubre de 2026  
**Equipo Especialista:** Senior Frontend Architect (React/TS/Tailwind) · Senior Responsive Web Design Engineer · Senior Mobile UX/UI Designer · Especialista en Geometría CSS/Flexbox/Grid · Especialista en Ergonomía y Accesibilidad Móvil · Senior QA Automation Engineer · Especialista PWA  
**Estado:** PLAN TÉCNICO VERSIÓN 2 AUDITADO Y CORREGIDO (Cero modificaciones aplicadas al código fuente; sujeto a política de implementación incremental fase por fase)  
**Stack Verificado en `package.json`:** React `^18.3.1` · TypeScript `~5.7.2` · Tailwind CSS `^3.4.17` · `tailwind-merge` `^3.0.2` · `clsx` `^2.1.1` · Vite `^6.2.0` · `vite-plugin-pwa` `^0.21.1` · Zustand `^5.0.3` · Dexie `^4.0.11`.

---

## REVISIÓN TÉCNICA CORRECTIVA — VERSIÓN 2 (REGISTRO DE AUDITORÍA INDEPENDIENTE)

Esta sección documenta la investigación independiente realizada sobre las **10 observaciones técnicas** formuladas a la Versión 1 del plan, contrastando cada punto contra el código fuente real del repositorio (`tailwind.config.js`, `index.html`, `src/styles/index.css` y los componentes en `src/`).

| # | Observación Recibida | Resultado de la Investigación en Código | Veredicto | Corrección Aplicada al Plan (v2.0) | Justificación y Evidencia en Código |
| :- | :--- | :--- | :---: | :--- | :--- |
| **1** | **Compatibilidad real con Tailwind CSS (`h-13`, `h-19`, `xs:h-19`):** Estas utilidades no existen en la escala por defecto de Tailwind v3 salvo configuración personalizada. | Al inspeccionar `tailwind.config.js` (líneas 34–40), el proyecto **sí tiene extendida la escala `spacing`** con `'4.5': '1.125rem'` (`18px`), `'13': '3.25rem'` (`52px`), `'15': '3.75rem'` (`60px`), `'19': '4.75rem'` (`76px`) y `'21': '5.25rem'` (`84px`). Por ende, `h-13` y `h-19` **sí generan CSS válido** y ya se usan en `CommunityCardsPicker.tsx` (L170, L188, L209) y `CustomNumberModal.tsx` (L141). En cambio, `theme.extend.screens` **no existe**, por lo que cualquier variante `xs:*` (`xs:inline`, `xs:h-19`) es silenciosamente ignorada hoy. | **Parcialmente confirmada (Matizada con evidencia)** | 1. Se documenta la tabla exacta de extensiones existentes en `tailwind.config.js` (`spacing` y `scale`).<br>2. Se exige declarar `screens: { xs: '360px' }` antes de usar cualquier prefijo `xs:`.<br>3. Se agregan tamaños intermedios explícitos (`h-[68px]` o `h-16`) donde no existe token en `spacing`. | Evidencia `[CÓDIGO]`: `tailwind.config.js` L34–43 define `spacing: { '4.5', '13', '15', '19', '21' }` y `scale: { '98': '0.98' }`, pero carece de `screens`. |
| **2** | **Ergonomía insuficiente en `PlayerCountSelector.tsx`:** Reducir `gap` en `grid-cols-8` sigue dejando botones de `~28px–29px` de ancho en `320px`, insuficientes para el pulgar. |En `PlayerCountSelector.tsx` (L41), `grid-cols-8` dentro de `266px` (`320px` viewport) deja `(266 - 28) / 8 = 29.75px` de ancho por botón con `gap-1`, e incluso en `360px` (`306px` internos) deja `33px` de ancho. Ambos están muy por debajo del objetivo ergonómico de `44×44px` para uso rápido a una mano. | **Confirmada al 100%** | Se descarta mantener `grid-cols-8` en móviles y se adopta la **Alternativa B (`grid-cols-4 gap-2` en 2 filas de 4 botones: `2..5` y `6..9` con `h-11` = `44px`)**, elevando el ancho de cada botón a **`60.5px` en `320px`** y **`70.5px` en `360px`**. | Evidencia `[CÁLCULO]` + `[CÓDIGO]`: `PlayerCountSelector.tsx` L41–60. En `grid-cols-4 gap-2`, cada botón pasa de `28×44px` a `60.5×44px` en `320px` (+116% de superficie táctil). |
| **3** | **Geometría de `PokerTable.tsx`:** Reducir `rx = 39.5, ry = 35` y `max-h` sin evaluar las distancias reales centro a centro para 2 a 9 jugadores puede causar superposiciones entre asientos adyacentes. | En `PokerTable.tsx` (L35–42), `angle = (index / total) * 2 * Math.PI + Math.PI / 2` distribuye ángulos uniformes sobre una elipse achatada (`aspect-[16/9.5]`). En una elipse con $a > b$, el parámetro angular uniforme **agrupa los asientos en los flancos izquierdo y derecho** ($\theta \approx 0, \pi$): para 9 jugadores en `320px` (`292×173.4px`), la distancia centro a centro entre `BB` ($170^\circ$) y `UTG` ($210^\circ$) y entre `MP` ($330^\circ$) y `HJ` ($10^\circ$) es de apenas **`46.6px`**, mientras que arriba entre `UTG+1` y `UTG+2` es de **`81.9px`**. Si se reduce `ry` a `35` y `max-h` a `165px`, la distancia `BB–UTG` cae a **`41.2px`**, haciendo que un asiento Hero (`44px + ring = 48px`) y un rival (`40px`, suma de radios `44px`) **se superpongan `2.8px`**. | **Confirmada al 100% (Hallazgo Crítico)** | 1. Se corrige el cálculo erróneo de V1 que asumía distribución uniforme por perímetro.<br>2. Se cambia la proporción del contenedor a `aspect-[16/10]` (`+9px` de eje vertical en `320px`).<br>3. Se introduce **ecualización angular elíptica** en `getCoordinates`: $\theta' = \theta + 0.12 \sin(2\theta)$ con `rx = 40.5`, `ry = 36`. Esto separa los asientos de los flancos de `46.6px` a **`56.8px` en `320px`** (`>12px` de luz libre entre bordes incluso con `ring-2` y badge `D`). | Evidencia `[CÁLCULO]` + `[CÓDIGO]`: `PokerTable.tsx` L35–42 y L114–125. Ver demostración trigonométrica completa en la Sección 6. |
| **4** | **Adaptación vertical de `PokerTable.tsx` (`aspect-ratio` vs `max-height`):** Usar `w-full aspect-[16/9.5] max-h-[168px]` depende del ancho (`xs:`, `sm:`) y aplasta la relación de aspecto cuando `max-height` restringe a `w-full`. | En CSS Box Sizing, aplicar `max-height` sobre un elemento con `width: 100%` (`w-full`) recorta únicamente la altura manteniendo el ancho al `100%`, **deformando la relación de aspecto de la mesa** y achicando aún más la distancia vertical entre asientos. Además, `xs:max-h-[195px]` depende del ancho (`360px`) y no distingue entre `360×640` y `360×800`. | **Confirmada al 100%** | Se elimina `max-h-[168px] xs:max-h-[195px] sm:max-h-[215px]` sobre `PokerTable`. Para conservar el `aspect-[16/10]` intacto, el escalado en pantallas de baja altura (`@media (max-height: 640px)`) se controla acotando el **`max-width`** (`max-w-[300px]` en baja altura vs `max-w-sm` en altura normal) junto con el scroll interno del App Shell. | Evidencia `[CÓDIGO]`: `PokerTable.tsx` L54. Acotar `max-width` escala proporcionalmente $W$ y $H$ respetando `aspect-ratio` sin achatar la elipse. |
| **5** | **Safe Areas y preservación del padding (`src/styles/index.css`):** `.pt-safe { padding-top: max(0.5rem, env(...)) }` evita el `0px`, pero reduce el `p-3.5` (`14px`) original a `8px` (`0.5rem`) cuando `env()` es `0px`. | En `SessionActiveView.tsx` (L152) se usa `p-3.5 sm:p-4 pt-safe pb-safe`, en `HandRecorderView.tsx` (L374) `px-3.5 pt-safe pb-safe`, y en `NewSessionView.tsx` (L61 y L133) se aplica `pb-safe` **dos veces** (en la raíz y en el footer `fixed`). Si `.pt-safe` usa `0.5rem` (`8px`), pisa los `14px` (`0.875rem`) de `p-3.5`. | **Confirmada al 100%** | 1. Se separan los paddings horizontales (`px-3 xs:px-3.5 sm:px-4`) de los verticales en las 4 vistas.<br>2. Se definen `.pt-safe` y `.pb-safe` preservando el padding base de diseño (`0.75rem` = `12px` arriba y `0.875rem` = `14px` abajo) y sumando de forma segura el inset del sistema: `padding-top: max(0.75rem, env(safe-area-inset-top, 0px))` y `padding-bottom: max(0.875rem, calc(env(safe-area-inset-bottom, 0px) + 0.25rem))`.<br>3. Se elimina la doble aplicación de `pb-safe` en `NewSessionView.tsx`. | Evidencia `[CÓDIGO]`: `src/styles/index.css` L47–52, `NewSessionView.tsx` L61/L133, `SessionActiveView.tsx` L152. |
| **6** | **Contradicción en el teclado numérico (`CustomNumberModal.tsx`):** Usar `h-11 xs:h-12 sm:h-14` hace que en *landscape* (`667×375` o `844×390`, donde el ancho supera `640px` = `sm:`) se active `sm:h-14` (`56px`), agrandando las teclas cuando menos altura hay. | En `CustomNumberModal.tsx` (L108, L116, L123, L130), el código actual tiene `h-12 sm:h-14`. En un teléfono girado en horizontal (`667×375` o `844×390`), `width >= 640px` dispara `sm:h-14` (`56px`), llevando la altura del modal a `~450px > 375px`. | **Confirmada al 100%** | 1. Se elimina `sm:h-14` (las teclas no deben crecer por ancho de pantalla).<br>2. En vertical (`320×568` en adelante), las teclas usan `h-12` (`48px`), sumando `406px` totales que entran **sin scroll incluso en `320×568` (`568px`)**.<br>3. Para *landscape* (`max-height: 480px`), se define la variante `landscape-short:` en `tailwind.config.js` que dispone el modal en 2 columnas (display + confirmar a la izquierda, teclado `3×4` con teclas `h-10` = `40px` a la derecha, altura total `230px <= 345px`). | Evidencia `[CÓDIGO]` + `[CÁLCULO]`: `CustomNumberModal.tsx` L80–145. |
| **7** | **Viewport, Zoom y Accesibilidad (`index.html`):** `maximum-scale=1.0, user-scalable=no` bloquea el zoom de accesibilidad. Evaluar cómo permitirlo sin romper la PWA ni el uso rápido. | `index.html` (L6) incluye `maximum-scale=1.0, user-scalable=no`. Si se retira para cumplir WCAG 1.4.4, hay dos efectos colaterales en iOS Safari que deben mitigarse en CSS:<br>a) El doble toque rápido sobre botones `[-]`/`[+]` hace *double-tap zoom* si no tienen `touch-action: manipulation`.<br>b) El único `<input>` nativo de la app (`SessionExtras.tsx` L72, `id="session-note"`) tiene `text-xs` (`12px`), lo que provoca **auto-zoom forzado en iOS Safari al enfocar el input** si el tamaño de fuente es `<16px`. | **Confirmada con Hallazgo Colateral Crítico** | 1. En `index.html`: Cambiar a `content="width=device-width, initial-scale=1.0, viewport-fit=cover"`.<br>2. En `src/styles/index.css`: Añadir `touch-action: manipulation` en `button, a, input, [role="button"]` para impedir el *double-tap zoom* accidental al pulsar rápido.<br>3. En `SessionExtras.tsx` (L72): Cambiar la fuente del `<input>` a `text-base sm:text-sm` (`16px` en móviles) para evitar el auto-zoom de Safari al abrir el teclado virtual. | Evidencia `[CÓDIGO]`: `index.html` L6 y `SessionExtras.tsx` L65–73 (`className="... text-xs sm:text-sm"`). |
| **8** | **Arquitectura de Scroll y App Shell (`h-[100dvh] overflow-hidden`):** Validar qué ocurre en orientación horizontal (`375px` de alto), con teclado virtual abierto y en el Paso 2 (`ActionConsole` + `PreflopActionTimeline`). | En `HandRecorderView.tsx` (Paso 2), `Header` (`56px`) + `Context Bar` (`46px`) + `ActionConsole` (`206px`, ubicada en el footer fijo L714) + `Safe Areas` (`22px`) suman **`330px` fijos**. En vertical (`568px` a `932px`), deja entre `238px` y `514px` para `PreflopActionTimeline` (óptimo). **Pero en horizontal (`667×375`) o con teclado virtual abierto (`<480px` de alto)**, `375px - 330px` dejaría solo **`45px`** para el timeline si el contenedor raíz fuerza `h-[100dvh] overflow-hidden`. | **Confirmada (Refinamiento Arquitectónico Clave)** | Se crea la clase utilitaria `.app-shell` en `src/styles/index.css`:<br>• En altura normal (`min-height: 481px`): aplica `min-h-screen h-[100dvh] max-h-[100dvh] overflow-hidden` con scroll interno aislado en `<main className="flex-1 min-h-0 overflow-y-auto">`.<br>• En baja altura extrema (`@media (max-height: 480px)`, *landscape* o teclado virtual abierto): relaja a `min-h-[100dvh] h-auto max-h-none overflow-y-auto` para que ningún control ni el timeline queden aplastados. | Evidencia `[CÓDIGO]` + `[CÁLCULO]`: `HandRecorderView.tsx` L374–448 y L699–778; `ActionConsole.tsx` L107–254. |
| **9** | **Validación visual y pruebas reales:** Diferenciar entre problema comprobado en código, inferido por cálculo o pendiente de DOM; incluir las 12 resoluciones y mediciones `getBoundingClientRect()`. | La Versión 1 no distinguía explícitamente las categorías de evidencia ni advertía que `overflow-hidden` puede enmascarar un `scrollWidth > clientWidth` si no se miden los hijos con `getBoundingClientRect()`. | **Confirmada al 100%** | Se incorpora en las Secciones 10, 11 y 18 la taxonomía estricta de evidencia (`[CÓDIGO]`, `[CÁLCULO]`, `[BUILD/TEST]`, `[PENDIENTE DOM]`), la matriz de 12+ resoluciones (incluyendo fronteras `359px`/`360px` y `479px`/`480px`) y el protocolo de verificación con `getBoundingClientRect()`. | Ver Secciones 10, 11 y 18. |
| **10** | **Inconsistencias internas del documento V1:**<br>A. 10 vs 11 problemas.<br>B. `266px` vs `268px` de ancho útil.<br>C. `238px` vs `248px` en `CommunityCardsPicker`.<br>D. `RESP-11` duplicado en P0 y P2.<br>E. Justificación de archivos excluidos.<br>F/G. Riesgos "nulos" y garantías absolutas. | Todas las inconsistencias señaladas existían en el texto de V1:<br>• El borde de `1px` a cada lado (`2px` totales) explica por qué `320 - 28 (px-3.5) - 24 (p-3) - 2 (border) = 266px` (y no `268px`).<br>• En `CommunityCardsPicker`, `3×48 + 2×40 + 4×6 = 248px` (en la tabla de la Sección 10 decía `238px` por error de tipeo).<br>• `NewSessionView` figuraba en P0 y también como `RESP-11` en P2. | **Confirmada al 100%** | Se corrigen todas las cifras y asignaciones en el documento:<br>• **11 hallazgos (`RESP-01` a `RESP-11`)** unificados.<br>• Ancho interno exacto en `320px`: **`266px`** con `px-3.5` y **`274px`** con `px-2.5` (descontando los `2px` de `border`).<br>• Suma de `CommunityCardsPicker` en `320px`: **`248px`** en todas las secciones.<br>• `RESP-11` asignado exclusivamente a **Fase P0**.<br>• Tabla completa de los 21 archivos indicando cuáles se modifican y por qué. | Ver Secciones 1, 3, 4, 11, 14 y 16. |

---

## 1. RESUMEN EJECUTIVO CORREGIDO

Tras auditar los **21 archivos frontend** de **RecTheHand26** evaluando tanto el **ancho disponible (`320px` a `1024px`)** como la **altura disponible (`375px` en horizontal y `568px` a `932px` en vertical)**, se identifican **11 hallazgos técnicos (`RESP-01` a `RESP-11`)** que afectan la adaptación al viewport, la ergonomía táctil y la estabilidad del scroll:

1. **`RESP-01` (`[CÓDIGO]` — Crítico P0):** En [SessionActiveView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/SessionActiveView.tsx#L152), [HandRecorderView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/HandRecorderView.tsx#L374) y [HandReviewView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/HandReviewView.tsx#L110), el contenedor raíz usa `min-h-[100dvh] flex flex-col justify-between` y el área central usa `flex-1 overflow-y-auto`. En CSS Flexbox, un hijo con `overflow-y: auto` **no activa su propio scroll interno si el contenedor padre solo tiene `min-height` y carece de una altura restringida (`h-[100dvh] max-h-[100dvh]`) y `min-h-0` en el hijo**. Cuando el contenido supera el alto del viewport, toda la página se estira y desplaza el encabezado y los botones inferiores fuera de la pantalla.
2. **`RESP-02` (`[CÓDIGO]` — Crítico P0):** En [index.css](file:///c:/Users/shako/Downloads/RecTheHand26/src/styles/index.css#L47-L52), `.pt-safe` (`padding-top: env(safe-area-inset-top, 0px)`) y `.pb-safe` (`padding-bottom: env(safe-area-inset-bottom, 0px)`) están declarados después de `@tailwind utilities`. En dispositivos donde `env(safe-area-inset-*)` devuelve `0px` (navegadores Android, iPhones SE, escritorio), `.pt-safe` y `.pb-safe` **sobrescriben el `padding-top` y `padding-bottom` a `0px`**, pegando los controles contra los bordes físicos de la pantalla. Además, en [NewSessionView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/NewSessionView.tsx#L61) `pb-safe` se aplica por duplicado (en el contenedor raíz L61 y en el footer L133).
3. **`RESP-03` (`[CÓDIGO]` — Crítico P0):** En [PresetPill.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/common/PresetPill.tsx#L28) (y [ToggleSwitch.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/common/ToggleSwitch.tsx#L25)) se utiliza `clsx` directo en lugar de [`cn()`](file:///c:/Users/shako/Downloads/RecTheHand26/src/utils/cn.ts) (`tailwind-merge`). Cuando [BlindsPicker.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/session/BlindsPicker.tsx#L118) o [StackPicker.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/session/StackPicker.tsx#L81) pasan `className="px-1.5"`, el `px-3.5` (`28px` horizontales) base no se elimina, provocando recortes de texto en pantallas estrechas.
4. **`RESP-04` (`[CÁLCULO]` + `[CÓDIGO]` — Crítico P0):** En [BlindsPicker.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/session/BlindsPicker.tsx#L73-L108), la grilla `grid-cols-2 gap-2.5` dispone de `128px` por columna en un viewport de `320px` (`266px` internos con `px-3.5`), pero cada [NumberStepper.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/common/NumberStepper.tsx#L61) exige un ancho intrínseco de **`146px`** (`36px + 62px + 36px + 12px`), generando un desborde de **`36px`**. Asimismo, la fila de 4 presets (`500 / 1.000`, `1.000 / 1.000`, `1.000 / 2.000`, `Otro`) con `whitespace-nowrap` no entra en celdas de `61.8px` a `320px`.
5. **`RESP-05` (`[CÁLCULO]` + `[CÓDIGO]` — Crítico P0):** En [CommunityCardsPicker.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/CommunityCardsPicker.tsx#L163-L217), los 5 slots horizontales (`3 × 56px + 2 × 48px + 4 × 8px = 296px`) superan los **`266px`** internos de la tarjeta en `320px`, desbordando **`30px`**.
6. **`RESP-06` (`[CÁLCULO]` + `[CÓDIGO]` — Crítico P0):** En [HandRecorderView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/HandRecorderView.tsx#L456-L532) (Paso 1), cuando el stack está activo, el botón izquierdo del monto (`$50.000 (50 BB)`) y los 4 botones derechos (`-`, `+`, `Editar`, `X`) suman **`~325px`** en una fila `flex` sin `wrap`, superando los `272px` internos disponibles en `320px`.
7. **`RESP-07` (`[CÓDIGO]` — Alta P1):** En [SessionActiveView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/SessionActiveView.tsx#L317) y [SessionExtras.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/session/SessionExtras.tsx#L51) se usa la clase `hidden xs:inline`, pero el breakpoint `xs` **no está definido** en [tailwind.config.js](file:///c:/Users/shako/Downloads/RecTheHand26/tailwind.config.js), ocultando el chip del Flop en todos los teléfonos (`<640px`). Además, en [index.html](file:///c:/Users/shako/Downloads/RecTheHand26/index.html#L6) `user-scalable=no` bloquea el zoom y el `<input>` de [SessionExtras.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/session/SessionExtras.tsx#L72) usa `text-xs` (`12px`), susceptible a auto-zoom en iOS Safari.
8. **`RESP-08` (`[CÁLCULO]` + `[CÓDIGO]` — Alta P1):** En [PokerTable.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/PokerTable.tsx#L35-L42), el uso de ángulos paramétricos uniformes sobre una elipse `aspect-[16/9.5]` con `rx = 41%`, `ry = 38%` provoca: (a) que el asiento superior (`top: 12%`) sobresalga **`3.3px`** del contenedor en `320px`, y (b) **agrupamiento angular en los flancos izquierdo y derecho** para 9 jugadores (`BB–UTG` y `MP–HJ` quedan a solo **`46.6px` centro a centro** en `320px`, superponiéndose `1.4px` cuando Hero lleva `ring-2`).
9. **`RESP-09` (`[CÁLCULO]` + `[CÓDIGO]` — Alta P1):** En [ActionConsole.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/ActionConsole.tsx#L109-L135), el indicador `HERO (UTG+1) — TU TURNO` y el botón `Folds hasta Hero` compiten en una misma línea `flex` sin `truncate` (`~335px` combinados), colisionando en `320px` y `360px`.
10. **`RESP-10` (`[CÁLCULO]` + `[CÓDIGO]` — Alta P1):** En [PlayerCountSelector.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/session/PlayerCountSelector.tsx#L41), la fila única `grid-cols-8` reduce cada botón a **`28px × 44px`** en `320px` y **`33px × 44px`** en `360px` (incómodo para el pulgar); en [CardSelector.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/CardSelector.tsx#L105-L173), la cabecera con 2 cartas activas más el botón `"Borrar"` con texto suma `279px > 266px` en `320px`; y en [CustomNumberModal.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/common/CustomNumberModal.tsx#L108) `sm:h-14` agranda las teclas en modo horizontal (*landscape* `667×375`).
11. **`RESP-11` (`[CÓDIGO]` — Media P0/Arquitectura):** En [NewSessionView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/NewSessionView.tsx#L61-L146), el layout utiliza un footer `fixed bottom-0 left-0 right-0` desacoplado con `pb-24` manual, a diferencia de las otras 3 vistas basales, y duplica la clase `pb-safe`.

---

## 2. AUDITORÍA DE COMPATIBILIDAD REAL CON TAILWIND CSS (`v3.4.17`)

### 2.1. Inspección de `tailwind.config.js` y `package.json` (`[CÓDIGO]`)
* **Versión instalada en `package.json` (L29):** `"tailwindcss": "^3.4.17"`, `"tailwind-merge": "^3.0.2"`, `"clsx": "^2.1.1"`.
* **Extensiones actuales en `tailwind.config.js` (L34–43):**
  ```js
  spacing: {
    '4.5': '1.125rem', // 18px -> habilita w-4.5, h-4.5, p-4.5, gap-4.5
    '13': '3.25rem',   // 52px -> habilita h-13, w-13
    '15': '3.75rem',   // 60px -> habilita h-15, w-15
    '19': '4.75rem',   // 76px -> habilita h-19, w-19
    '21': '5.25rem',   // 84px -> habilita h-21, w-21
  },
  scale: {
    '98': '0.98',      // habilita scale-98, active:scale-98
  },
  ```

### 2.2. Verificación de Utilidades de Dimensión y Variantes
| Clase CSS | ¿En Tailwind v3 por defecto? | ¿En `tailwind.config.js` actual? | ¿Genera CSS válido hoy? | Uso Actual / Propuesto y Acción Requerida |
| :--- | :---: | :---: | :---: | :--- |
| `w-4.5`, `h-4.5` (`18px`) | No | **Sí** (`spacing['4.5']`) | **Sí** | Usado en `BlindsPicker.tsx` L59. Válido sin cambios. |
| `h-13` (`52px`) | No | **Sí** (`spacing['13']`) | **Sí** | Usado en `CustomNumberModal.tsx` L141 (`sm:h-13`). Válido sin cambios. |
| `h-19` (`76px`) | No | **Sí** (`spacing['19']`) | **Sí** | Usado en `CommunityCardsPicker.tsx` L170, L188, L209, L213. Válido sin cambios. |
| `active:scale-98` (`0.98`) | No | **Sí** (`scale['98']`) | **Sí** | Usado en `SessionActiveView`, `HandRecorderView`, `HandReviewView`, `ExportModal`. Válido. |
| `xs:inline`, `xs:h-19`, `xs:w-14`, `xs:grid-cols-4` | No | **No** (`screens.xs` no existe) | **NO (Ignorado)** | **Acción Obligatoria en Fase P0:** Declarar `screens: { xs: '360px', 'landscape-short': { raw: '(max-height: 480px) and (orientation: landscape)' } }` dentro de `theme.extend` en `tailwind.config.js`. |
| `h-16` (`64px`), `w-12` (`48px`), `w-10` (`40px`) | **Sí** | N/A | **Sí** | Escala estándar de Tailwind v3 (`4rem`, `3rem`, `2.5rem`). |

---

## 3. INVENTARIO COMPLETO DE LOS 21 ARCHIVOS AUDITADOS Y SU ALCANCE

Cada uno de los **21 archivos** del frontend fue auditado. A continuación se detalla su diagnóstico, si requiere modificación, en qué fase se interviene o por qué se excluye de cambios:

| # | Archivo | Estado Responsive Actual | ¿Se modifica? | Fase Asignada | Justificación Técnica |
| :- | :--- | :--- | :---: | :---: | :--- |
| 1 | [index.html](file:///c:/Users/shako/Downloads/RecTheHand26/index.html) | `user-scalable=no, maximum-scale=1.0` bloquea zoom de accesibilidad. | **Sí** | **Fase P0** | Permitir zoom accesible (`WCAG 1.4.4`) mitigando el *double-tap zoom* mediante `touch-action: manipulation` en CSS. |
| 2 | [src/styles/index.css](file:///c:/Users/shako/Downloads/RecTheHand26/src/styles/index.css) | `.pt-safe`/`.pb-safe` pisan el padding a `0px` cuando `env()` es `0px`; falta `.app-shell` y `touch-action`. | **Sí** | **Fase P0** | Definir `.app-shell` (con relajación en `@media (max-height: 480px)`), `.pt-safe`, `.pb-safe`, `.px-safe` y `touch-action: manipulation`. |
| 3 | [tailwind.config.js](file:///c:/Users/shako/Downloads/RecTheHand26/tailwind.config.js) | Carece de `screens.xs` (`360px`) y `landscape-short`. | **Sí** | **Fase P0** | Habilitar el breakpoint `xs: '360px'` (ya invocado en el código) y `landscape-short` para vistas apaisadas. |
| 4 | [src/App.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/App.tsx) | Usa `min-h-screen` sin marco delimitador para tablets/desktop. | **Sí** | **Fase P3** | Usar `min-h-[100dvh] bg-[#05080C]` y enmarcar el contenedor móvil en pantallas `>=640px`. |
| 5 | [src/views/NewSessionView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/NewSessionView.tsx) | Usa footer `fixed` desacoplado, `pb-24` rígido y duplica `pb-safe`. | **Sí** | **Fase P0** | Migrar a `.app-shell` con `<main className="flex-1 min-h-0 overflow-y-auto">` y `<footer className="shrink-0">` (`RESP-01`, `RESP-11`). |
| 6 | [src/components/session/StackPicker.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/session/StackPicker.tsx) | En `320px`, el título `"Stack inicial"` se trunca frente al `min-w-[144px]` del stepper. | **Sí** | **Fase P1** | Ajustar proporción entre cabecera y `NumberStepper` compacto en `<360px`. |
| 7 | [src/components/session/BlindsPicker.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/session/BlindsPicker.tsx) | En `320px`, los 2 steppers desbordan `36px` y los 4 presets cortan texto. | **Sí** | **Fase P1** | Usar `grid-cols-1 xs:grid-cols-2` para los steppers y `grid-cols-2 xs:grid-cols-4` para los presets (`RESP-04`). |
| 8 | [src/components/session/PlayerCountSelector.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/session/PlayerCountSelector.tsx) | `grid-cols-8` deja botones de `28px` de ancho en `320px` y `33px` en `360px`. | **Sí** | **Fase P1** | Cambiar a **`grid-cols-4 gap-2` (2 filas de 4 botones `h-11` = `44px`)**, subiendo el ancho a `60.5px` en `320px` (`RESP-10`). |
| 9 | [src/components/session/SessionExtras.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/session/SessionExtras.tsx) | Usa `hidden xs:inline` y el `<input>` tiene `text-xs` (`12px`, causa auto-zoom en iOS). | **Sí** | **Fase P1** | Cambiar `<input>` a `text-base sm:text-sm` (`16px` en móvil) y ajustar padding interno de switches en `320px` (`px-2.5 xs:px-3`). |
| 10 | [src/views/SessionActiveView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/SessionActiveView.tsx) | `min-h-[100dvh]` no activa scroll interno; `p-3.5` colisiona con `pt-safe pb-safe`. | **Sí** | **Fase P0** | Migrar a `.app-shell` con scroll interno real en la lista de manos (`RESP-01`, `RESP-02`, `RESP-07`). |
| 11 | [src/views/HandRecorderView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/HandRecorderView.tsx) | `min-h-[100dvh]` sin scroll aislado; barra de stack en Paso 1 desborda en `320px`. | **Sí** | **Fase P0 / P1** | Migrar a `.app-shell` en **P0** (`RESP-01`) y eliminar el botón redundante `"Editar"` de la barra de stack en **P1** (`RESP-06`). |
| 12 | [src/components/poker/PokerTable.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/PokerTable.tsx) | Asiento superior sobresale `3.3px`; flancos `BB–UTG` y `MP–HJ` se agrupan a `46.6px` en `320px`. | **Sí** | **Fase P2** | Proporción `aspect-[16/10]`, radios `rx = 40.5`, `ry = 36`, ecualización angular $\theta' = \theta + 0.12\sin(2\theta)$ y asientos `w-10/w-11` en `320px` (`RESP-08`). |
| 13 | [src/components/poker/CardSelector.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/CardSelector.tsx) | En `320px`, la cabecera con 2 cartas + botón `"Borrar"` suma `279px > 266px`. | **Sí** | **Fase P2** | Ocultar el texto `"Borrar"` en `<360px` (`hidden xs:inline`) manteniendo el ícono `<Trash2 />` (`RESP-10`). |
| 14 | [src/components/poker/PreflopActionTimeline.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/PreflopActionTimeline.tsx) | Chips con `flex-wrap` y filas con `truncate` ya se adaptan entre `266px` y `390px`. | **No** | — | **Excluido con justificación:** Sus 3 zonas usan `flex-wrap` y `min-w-0 truncate`; su problema de scroll vertical en manos con múltiples limpers se resuelve en `HandRecorderView.tsx` (`RESP-01`). |
| 15 | [src/components/poker/ActionConsole.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/ActionConsole.tsx) | Píldora `HERO (POS) — TU TURNO` + `Folds hasta Hero` chocan en `320px` y `360px`. | **Sí** | **Fase P2** | Usar `min-w-0 truncate` y etiqueta compacta en `<360px` (`RESP-09`). |
| 16 | [src/components/poker/CommunityCardsPicker.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/CommunityCardsPicker.tsx) | Los 5 slots (`296px`) desbordan `30px` en `320px` (`266px` internos). | **Sí** | **Fase P2** | Escalar slots a `w-12 h-16 xs:w-14 xs:h-19` (Flop) y `w-10 h-16 xs:w-12 xs:h-19` (Turn/River) con `gap-1.5 xs:gap-2` (`248px` totales, `RESP-05`). |
| 17 | [src/components/poker/FlopActionConsole.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/FlopActionConsole.tsx) | En `320px`, el título `"Acción de Hero en el Flop (UTG+1)"` + botón `"Limpiar"` quedan justos. | **Sí** | **Fase P2** | Añadir `min-w-0 truncate` al título de cabecera y `px-3 xs:px-3.5` al contenedor para ganar `4px` internos en `320px`. |
| 18 | [src/views/HandReviewView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/HandReviewView.tsx) | `min-h-[100dvh]` impide que el header y el footer queden fijos al scrollear manos largas. | **Sí** | **Fase P0** | Migrar a `.app-shell` con scroll interno aislado en `<main>` (`RESP-01`). |
| 19 | [src/components/common/CustomNumberModal.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/common/CustomNumberModal.tsx) | `sm:h-14` agranda las teclas en *landscape* (`667×375`), forzando scroll. | **Sí** | **Fase P3** | Eliminar `sm:h-14`, fijar `h-12` (`48px`) en vertical y layout compacto de 2 columnas en `landscape-short:` (`RESP-10`). |
| 20 | [src/components/common/ExportModal.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/common/ExportModal.tsx) | En *landscape* (`375px` de alto), el padding `p-4` reduce el área visible. | **Sí** | **Fase P3** | Ajustar a `p-3.5 sm:p-5 max-h-[90dvh] overscroll-contain` para scroll fluido en baja altura. |
| 21 | [src/components/common/GlassCard.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/common/GlassCard.tsx), [PresetPill.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/common/PresetPill.tsx), [ToggleSwitch.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/common/ToggleSwitch.tsx), [NumberStepper.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/common/NumberStepper.tsx) | `PresetPill` y `ToggleSwitch` usan `clsx`; `NumberStepper` tiene `min-w-[124px]` rígido; `GlassCard` ya usa `cn()` y `p-3`. | **Sí** *(excepto `GlassCard`)* | **Fase P0 / P1** | `PresetPill` y `ToggleSwitch` pasan a `cn()` en **P0** (`RESP-03`); `NumberStepper` pasa a ancho fluido en **P1** (`RESP-04`); `GlassCard.tsx` no requiere cambios. |

---

## 4. ANÁLISIS MATEMÁTICO CORREGIDO DEL ANCHO DISPONIBLE (`320px` A `1024px`)

### 4.1. Fórmula Exacta de Caja CSS (`box-sizing: border-box`)
En las 4 vistas principales (`max-w-md` = `448px`), el ancho interior útil ($W_{\text{tarjeta}}$) dentro de una tarjeta con `p-3` (`12px × 2 = 24px`) y `border` (`1px × 2 = 2px`, total `26px` de tarjeta) depende del padding horizontal de la vista:
* Con padding de vista actual `px-3.5` (`14px × 2 = 28px`):
  $$W_{\text{tarjeta (px-3.5)}} = \min(\text{ViewportWidth}, 448\text{px}) - 28\text{px} - 26\text{px} = \min(\text{ViewportWidth}, 448\text{px}) - 54\text{px}$$
* Con padding de vista optimizado en `<360px` (`px-2.5 xs:px-3.5`, donde `px-2.5` = `10px × 2 = 20px`):
  $$W_{\text{tarjeta (px-2.5 en <360px)}} = 320\text{px} - 20\text{px} - 26\text{px} = \mathbf{274\text{px}}$$

| Viewport Width | Ancho Interno Vista (`px-3.5` / `px-2.5`) | Ancho Interno Tarjeta `p-3 border` (`Actual` → `Con px-2.5`) | Columna en `grid-cols-2` (`gap-2.5` = `10px`) | Celda en `grid-cols-4` (`gap-2` = `24px` tot.) | Celda en `grid-cols-6` (`gap-1.5` = `30px` tot.) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **`320px`** | `292px` → **`300px`** | **`266px`** → **`274px`** | `128px` → `132px` *(En `<360px` se apila en `1 col` de `274px` para `BlindsPicker`)* | `60.5px` → **`62.5px`** *(Óptimo para `PlayerCountSelector`)* | `39.3px` → **`40.6px`** *(Entra `"100K"` con `px-1`)* |
| **`360px`** (`xs`) | `332px` | **`306px`** | **`148px`** *(Entra `NumberStepper` compacto de `138px`)* | **`70.5px`** | **`46.0px`** |
| **`375px`** | `347px` | **`321px`** | `155.5px` | `74.2px` | `48.5px` |
| **`390px`** | `362px` | **`336px`** | `163.0px` | `78.0px` | `51.0px` |
| **`393px`** | `365px` | **`339px`** | `164.5px` | `78.7px` | `51.5px` |
| **`412px`** | `384px` | **`358px`** | `174.0px` | `83.5px` | `54.6px` |
| **`430px`** | `402px` | **`376px`** | `183.0px` | `88.0px` | `57.6px` |
| **`667px` / `768px` / `1024px`** | `416px` (`sm:px-4`) | **`390px`** | `190.0px` | `91.5px` | `60.0px` |

---

## 5. EVALUACIÓN ERGONÓMICA OBLIGATORIA: `PlayerCountSelector.tsx` (CORRECCIÓN 2)

### 5.1. Problema Ergonómico Confirmado
En [PlayerCountSelector.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/session/PlayerCountSelector.tsx#L41), los 8 valores (`2, 3, 4, 5, 6, 7, 8, 9`) están dispuestos en `grid grid-cols-8 gap-1.5`.
* **Mínimo de accesibilidad (WCAG 2.2 SC 2.5.8 AA):** `24 × 24px`.
* **Objetivo ergonómico recomendado (WCAG 2.5.5 AAA / Apple HIG / Material Design para uso rápido a una mano):** **`>= 44 × 44px`**.
* En el diseño actual (`grid-cols-8`), el ancho de cada botón es de **`28.0px` en `320px`**, **`33.0px` en `360px`** y **`34.8px` en `375px`**, lo que incrementa el riesgo de pulsar el número vecino con el pulgar.

### 5.2. Comparativa Técnica de las 3 Alternativas

| Criterio de Evaluación | Alternativa A: `grid-cols-8` (1 fila horizontal optimizada) | Alternativa B (SELECCIONADA): `grid-cols-4 gap-2` (2 filas × 4 columnas) | Alternativa C: Adaptable (`grid-cols-4` en `<390px` y `grid-cols-8` en `>=390px`) |
| :--- | :--- | :--- | :--- |
| **Tamaño real de cada botón (`320px`)** | `29.7px × 44px` (Insuficiente en ancho) | **`62.5px × 44px`** (`+110%` de ancho táctil) | `62.5px × 44px` en `<390px` |
| **Tamaño real de cada botón (`360px`)** | `33.0px × 44px` (Estrecho para pulgar) | **`70.5px × 44px`** (Amplio y seguro) | `36.7px × 44px` al saltar a 8 columnas en `390px` |
| **Facilidad de selección con el pulgar** | Baja en `<390px` (requiere precisión fina con la punta del dedo). | **Excelente** en el 100% de los teléfonos (`62px` a `91px` de ancho × `44px` de alto). | Media (en `390px` el ancho cae bruscamente de `74px` a `36.7px`). |
| **Riesgo de pulsaciones accidentales** | Alto entre `5/6` y `8/9`. | **Mínimo** (`8px` de separación `gap-2` entre botones de `>62px`). | Bajo en `<390px`, moderado en `390px–412px`. |
| **Altura total del componente** | `104px` (1 fila de `44px`). | **`156px`** (`2 × 44px + 8px = 96px` de grilla, `+52px` totales). | Variable (`156px` o `104px` según el teléfono). |
| **Impacto en el scroll de `NewSessionView`** | `0px` adicionales. | Con `.app-shell`, en `>=667px` de alto (`375×667`, `390×844`) sigue entrando **sin scroll**; en `320×568` y `360×640` suma `52px` al scroll interno de `<main>` manteniendo fijo el botón `"Comenzar sesión"`. | Cambia la disposición espacial de los números según el teléfono (rompe la memoria muscular entre fila superior `2–5` y fila inferior `6–9`). |
| **Consistencia visual en RecTheHand26** | Única grilla de 8 columnas en toda la app. | **100% alineada** con las grillas de 4 columnas de `BlindsPicker`, `ActionConsole` y los 4 palos de `CardSelector`. | Inconsistente entre dispositivos. |

### 5.3. Decisión Justificada Incorporada al Plan
Se selecciona la **Alternativa B (`grid grid-cols-4 gap-2` con botones `h-11` = `44px`)** para todos los dispositivos dentro del contenedor `max-w-md`:
* Fila 1: `[2] [3] [4] [5]` (Heads-Up y mesas cortas).
* Fila 2: `[6] [7] [8] [9]` (6-Max y Full Ring).
* Cada botón supera holgadamente el estándar ergonómico de `44 × 44px` en todas las resoluciones (`62.5×44px` en `320px` hasta `91.5×44px` en `448px`).
* *Nota de contingencia:* Dado que `PlayerCountSelector` cambia de 1 fila a 2 filas en la vista `NewSessionView`, se incluye como punto explícito de validación visual en la Fase P1.

---

## 6. REVISIÓN GEOMÉTRICA PROFUNDA Y ADAPTACIÓN VERTICAL DE `PokerTable.tsx` (CORRECCIONES 3 Y 4)

### 6.1. Análisis del Algoritmo Real en Código (`[CÓDIGO]`)
En [PokerTable.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/PokerTable.tsx#L35-L42), la posición de cada asiento $i \in \{0, \dots, N-1\}$ se calcula mediante:
```ts
const getCoordinates = (index: number, total: number) => {
  const angle = (index / total) * 2 * Math.PI + Math.PI / 2;
  const rx = 41; // Radio horizontal %
  const ry = 38; // Radio vertical %
  const x = 50 + rx * Math.cos(angle);
  const y = 50 + ry * Math.sin(angle);
  return { x, y };
};
```
* **Contenedor padre (L54):** `relative w-full aspect-[16/9.5] max-w-sm mx-auto my-0.5 select-none` (`max-w-sm` = `384px`).
* **Asiento Hero (L115):** `w-12 h-12` (`48×48px`) + `ring-2` (`2px` exteriores a cada lado = **`52px` de diámetro visual total**, radio $R_{\text{hero}} = 26\text{px}$).
* **Asiento Rival (L116):** `w-11 h-11` (`44×44px`, `border` interno por `border-box` = **`44px` de diámetro visual**, radio $R_{\text{rival}} = 22\text{px}$).
* **Badge Dealer `D` (L122):** `absolute -top-1 -right-1 w-4 h-4` (`16×16px`, sobresale `4px` hacia arriba y `4px` hacia la derecha del borde del asiento). Por defecto `dealerPosition = 'BTN'`, que siempre es `index = 0` ($\theta = 90^\circ$, asiento inferior central), por lo que el badge `D` apunta **hacia el interior del paño** y no hacia el borde inferior del contenedor.

### 6.2. El Defecto Matemático de los Ángulos Paramétricos Uniformes en una Elipse
En una elipse de semieje horizontal $a = W \cdot \frac{rx}{100}$ y semieje vertical $b = H \cdot \frac{ry}{100}$ donde $W / H = 16 / 9.5 \approx 1.6842 \implies a \approx 1.817 \cdot b$, avanzar un incremento constante $\Delta\theta = \frac{2\pi}{N}$ **NO distribuye los asientos a distancias iguales sobre el perímetro**:
* La rapidez de desplazamiento respecto al ángulo es $\left\|\frac{d\mathbf{r}}{d\theta}\right\| = \sqrt{a^2 \sin^2\theta + b^2 \cos^2\theta}$.
* En la parte superior e inferior ($\theta \approx 90^\circ, 270^\circ$), $\sin^2\theta \approx 1$, el paso es horizontal ($\propto a$) y **los asientos se separan excesivamente**.
* En los flancos izquierdo y derecho ($\theta \approx 0^\circ, 180^\circ$), $\cos^2\theta \approx 1$, el paso es casi puramente vertical ($\propto b$) y **los asientos se amontonan**.

#### Demostración Numérica del Problema Actual en `320px` ($N = 9$ jugadores, `W = 292px`, `H = 173.4px`, `rx = 41`, `ry = 38`):
Para $N = 9$ ($\Delta\theta = 40^\circ$), los ángulos son: `BTN` ($90^\circ$), `SB` ($130^\circ$), `BB` ($170^\circ$), `UTG` ($210^\circ$), `UTG+1` ($250^\circ$), `UTG+2` ($290^\circ$), `MP` ($330^\circ$), `HJ` ($10^\circ$), `CO` ($50^\circ$).
* **Par crítico lateral izquierdo (`BB` a $170^\circ$ y `UTG` a $210^\circ$) y derecho (`MP` a $330^\circ$ y `HJ` a $10^\circ$):**
  $$\Delta X = 292 \times 0.41 \times |\cos(210^\circ) - \cos(170^\circ)| = 119.72 \times 0.1188 = 14.22\text{px}$$
  $$\Delta Y = 173.4 \times 0.38 \times |\sin(210^\circ) - \sin(170^\circ)| = 65.89 \times 0.6736 = 44.38\text{px}$$
  $$d_{\text{actual}}(\text{BB}, \text{UTG}) = \sqrt{14.22^2 + 44.38^2} = \mathbf{46.60\text{px}}$$
  Si Hero (`52px` con `ring-2`, $R=26\text{px}$) está en `BB` y `UTG` es rival ($R=22\text{px}$), la suma de radios es $26 + 22 = 48\text{px} > 46.60\text{px} \implies$ **¡se superponen `1.4px`!**
  *(Nota: Esto demuestra que la afirmación de la Versión 1 de que "el perímetro de 680px entre 9 deja 75px centro a centro" era matemáticamente incorrecta por ignorar la compresión paramétrica en los polos horizontales).*

### 6.3. Solución Geométrica Verificable: Ecualización Angular Elíptica + `aspect-[16/10]`
Para maximizar la separación mínima entre asientos adyacentes sin achicar los botones por debajo de `40px`/`44px` y garantizando contención del 100% dentro del contenedor:

1. **Relación de aspecto del contenedor:** Cambiar de `aspect-[16/9.5]` a **`aspect-[16/10]`** (`W / H = 1.6`). En `320px` (con `px-2.5`, $W = 300\text{px}$), la altura pasa de `173.4px` a **`187.5px`** (`+14.1px` verticales ganados en los flancos).
2. **Ecualización armónica del ángulo en `getCoordinates`:**
   ```ts
   const getCoordinates = (index: number, total: number) => {
     const baseAngle = (index / total) * 2 * Math.PI + Math.PI / 2;
     // Compensación de curvatura elíptica: abre +24% el paso angular en los flancos (0° y 180°)
     // y preserva intactos los 4 puntos cardinales (90°, 180°, 270°, 360°).
     const angle = total >= 5 ? baseAngle + 0.12 * Math.sin(2 * baseAngle) : baseAngle;
     const rx = 40.5;
     const ry = 36.0;
     const x = 50 + rx * Math.cos(angle);
     const y = 50 + ry * Math.sin(angle);
     return { x, y };
   };
   ```
   * **Por qué funciona $\theta' = \theta + 0.12 \sin(2\theta)$:**
     * En $\theta = 90^\circ$ (`BTN`), $180^\circ$, $270^\circ$ y $360^\circ$, $\sin(2\theta) = 0$ (la simetría izquierda-derecha y arriba-abajo se conserva al 100%).
     * Para $N = 9$, en `BB` ($170^\circ$) y `UTG` ($210^\circ$), $\theta'$ desplaza `BB` a $167.6^\circ$ y `UTG` a $216.0^\circ$, ampliando el arco lateral de $40^\circ$ a **$48.4^\circ$** (`+21%` de separación vertical) y acercando ligeramente `UTG+1` y `UTG+2` arriba (que tenían `82px` de sobra).
3. **Tamaño de asientos (`w-11/w-10` en `<360px` y `w-12/w-11` en `>=360px`):**
   * En `<360px` (`320px`): Hero `w-11 h-11` (`44px`, con `ring-2` = `48px`, $R_{\text{hero}} = 24\text{px}$); Rival `w-10 h-10` (`40px`, $R_{\text{rival}} = 20\text{px}$). Suma máxima de radios adyacentes (Hero + Rival): **$44\text{px}$** (Rival + Rival: **$40\text{px}$**).
   * En `>=360px` (`xs:`): Hero `xs:w-12 xs:h-12` (`48px`, con `ring-2` = `52px`, $R_{\text{hero}} = 26\text{px}$); Rival `xs:w-11 xs:h-11` (`44px`, $R_{\text{rival}} = 22\text{px}$). Suma máxima de radios adyacentes (Hero + Rival): **$48\text{px}$** (Rival + Rival: **$44\text{px}$**).

### 6.4. Tabla de Distancias Reales Calculadas para 2 a 9 Jugadores (`320px` a `430px`) (`[CÁLCULO]`)
Con `aspect-[16/10]`, `rx = 40.5%`, `ry = 36.0%` y $\theta' = \theta + 0.12 \sin(2\theta)$:
* **Dimensiones de la caja `PokerTable`:**
  * **`320px`** (`px-2.5` → $W = 300\text{px}, H = 187.5\text{px}$): Semiejes $a = 121.5\text{px}, b = 67.5\text{px}$.
  * **`360px`** (`xs:px-3.5` → $W = 332\text{px}, H = 207.5\text{px}$): Semiejes $a = 134.5\text{px}, b = 74.7\text{px}$.
  * **`375px`** ($W = 347\text{px}, H = 216.9\text{px}$): Semiejes $a = 140.5\text{px}, b = 78.1\text{px}$.
  * **`390px`** ($W = 362\text{px}, H = 226.3\text{px}$): Semiejes $a = 146.6\text{px}, b = 81.5\text{px}$.
  * **`412px` y `430px`** (acotado por `max-w-sm` = $W = 384\text{px}, H = 240.0\text{px}$): Semiejes $a = 155.5\text{px}, b = 86.4\text{px}$.

| Jugadores ($N$) | Par Adyacente Más Cercano | Distancia Centro a Centro $d_{\min}$ en `320px` ($300\times 187.5$) | Luz Libre Entre Bordes en `320px` (Hero+Rival $44\text{px}$) | Distancia Centro a Centro $d_{\min}$ en `360px` ($332\times 207.5$) | Luz Libre Entre Bordes en `360px` (Hero+Rival $48\text{px}$) | Distancia Centro a Centro $d_{\min}$ en `390px` / `412px+` |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **2 (HU)** | `BTN` ($90^\circ$) – `BB` ($270^\circ$) | `135.0px` | **`+91.0px`** | `149.4px` | **`+101.4px`** | `163.0px` / `172.8px` |
| **3** | `SB` ($210^\circ$) – `BB` ($330^\circ$) | `181.2px` | **`+137.2px`** | `200.5px` | **`+152.5px`** | `218.7px` / `231.9px` |
| **4** | `BTN` ($90^\circ$) – `SB` ($180^\circ$) | `139.0px` | **`+95.0px`** | `153.8px` | **`+105.8px`** | `167.8px` / `177.9px` |
| **5** | `SB` – `BB` (flanco izq.) | `98.4px` | **`+54.4px`** | `108.9px` | **`+60.9px`** | `118.8px` / `126.0px` |
| **6 (6-Max)** | `SB` – `BB` (flanco izq.) | `83.6px` | **`+39.6px`** | `92.5px` | **`+44.5px`** | `100.9px` / `107.0px` |
| **7** | `BB` – `UTG` (flanco izq.) | `72.1px` | **`+28.1px`** | `79.8px` | **`+31.8px`** | `87.1px` / `92.3px` |
| **8** | `SB` – `BB` ($180^\circ$) | `63.5px` | **`+19.5px`** | `70.3px` | **`+22.3px`** | `76.7px` / `81.3px` |
| **9 (Full Ring)** | `BB` – `UTG` y `MP` – `HJ` | **`56.8px`** *(antes `46.6px`)* | **`+12.8px`** *(cero solapamiento)* | **`62.9px`** | **`+14.9px`** *(cero solapamiento)* | **`68.6px` / `72.7px`** (`+20.6px` a `+24.7px` libres) |

#### Verificación de Contención Perimetral (Bordes del Contenedor y Badge `D`):
* **Borde Superior e Inferior ($\theta = 270^\circ$ y $\theta = 90^\circ$, donde $y = 14\%$ y $y = 86\%$ con `ry = 36%`):**
  * En `320px` ($H = 187.5\text{px}$): Distancia del centro del asiento al borde superior/inferior = $0.14 \times 187.5 = \mathbf{26.25\text{px}} > R_{\text{hero}} (24\text{px})$. Sobran **`+2.25px`** reales dentro de la caja.
  * En `360px` ($H = 207.5\text{px}$): Distancia al borde = $0.14 \times 207.5 = \mathbf{29.05\text{px}} > R_{\text{hero}} (26\text{px})$. Sobran **`+3.05px`** reales dentro de la caja.
* **Borde Izquierdo y Derecho ($\theta = 180^\circ$ y $\theta = 0^\circ$, donde $x = 9.5\%$ y $x = 90.5\%$ con `rx = 40.5%`):**
  * En `320px` ($W = 300\text{px}$): Distancia al borde lateral = $0.095 \times 300 = \mathbf{28.5\text{px}} > R_{\text{hero}} (24\text{px})$. Sobran **`+4.5px`**.
  * En `360px` ($W = 332\text{px}$): Distancia al borde lateral = $0.095 \times 332 = \mathbf{31.54\text{px}} > R_{\text{hero}} (26\text{px})$. Sobran **`+5.54px`**.

### 6.5. Estrategia Correcta de Adaptación Vertical de `PokerTable` (Corrección 4)
* **Por qué se descarta `max-h-[168px] xs:max-h-[195px]`:**
  1. En CSS, aplicar `max-height` a un bloque con `w-full` (`width: 100%`) y `aspect-[16/10]` trunca solo la altura manteniendo el ancho al `100%`, **achatando la elipse** y reduciendo la distancia vertical entre `BB` y `UTG`.
  2. Un breakpoint de ancho (`xs:`) no distingue entre `360 × 640` (bajo) y `360 × 800` (alto).
* **Solución que preserva `aspect-[16/10]` en cualquier altura:**
  * Nunca restringir `max-height` directamente sobre un contenedor `w-full aspect-[16/10]`.
  * Si se desea compactar proporcionalmente la mesa en pantallas de baja altura (`@media (max-height: 640px)`), se acota el **`max-width`** (`max-w-[300px]` en `short:` vs `max-w-sm` = `384px` en pantallas estándar), lo cual reduce tanto $W$ como $H$ respetando la proporción exacta `16:10`.
  * En `320 × 568` (`568px` de alto), la mesa mantiene sus `300 × 187.5px` íntegros para no comprometer los `56.8px` de separación entre los 9 asientos, y el excedente vertical de `~45px` del Paso 1 es absorbido limpiamente por el scroll interno de `<main>` mientras el Header y el botón `"Siguiente: Preflop"` permanecen fijos.

---

## 7. SAFE AREAS, PRESERVACIÓN DE PADDING, VIEWPORT Y ZOOM (CORRECCIONES 5 Y 7)

### 7.1. Solución Definitiva para Safe Areas sin Pérdida del Padding de Diseño (`src/styles/index.css`)
#### Diagnóstico de lo que ocurre hoy en el código (`[CÓDIGO]`):
* `SessionActiveView.tsx` (L152) declara `p-3.5 sm:p-4 pt-safe pb-safe`.
* `HandRecorderView.tsx` (L374) y `HandReviewView.tsx` (L110) declaran `px-3.5 pt-safe pb-safe`.
* `NewSessionView.tsx` (L61 y L133) declara `pt-safe pb-safe` en el contenedor padre **y vuelve a declarar `pb-safe` en el footer hijo** (doble aplicación).
* Si `.pt-safe` se define como `max(0.5rem, env(...))`, cuando `env()` es `0px`, el padding superior de `SessionActiveView` cae de `14px` (`p-3.5`) a `8px` (`0.5rem`).

#### Regla CSS Unificada y Sin Colisiones:
1. En las 4 vistas principales, el contenedor raíz `.app-shell` utiliza clases de padding horizontal de Tailwind (`px-2.5 xs:px-3.5 sm:px-4`) y delega el padding vertical **exclusivamente** a `.pt-safe` y `.pb-safe` en el nodo raíz (eliminando `p-3.5` shorthand en `SessionActiveView` y el segundo `pb-safe` en `NewSessionView`).
2. En `src/styles/index.css`, `.pt-safe`, `.pb-safe` y `.px-safe` preservan el espaciado base de diseño (`10px` arriba y `14px` = `0.875rem` abajo) cuando `env()` es `0px`, y se adaptan cuando existe *Notch* o *Home Indicator*:
   ```css
   /* Safe area utilities con preservación del padding base de diseño */
   .pt-safe {
     padding-top: max(0.625rem, env(safe-area-inset-top, 0px));
   }
   .pb-safe {
     padding-bottom: max(0.875rem, calc(env(safe-area-inset-bottom, 0px) + 0.25rem));
   }
   .px-safe {
     padding-left: max(0.625rem, env(safe-area-inset-left, 0px));
     padding-right: max(0.625rem, env(safe-area-inset-right, 0px));
   }
   ```
* **Verificación en los 3 escenarios reales:**
  * **Android Chrome / iPhone SE / Desktop (`inset-top = 0px, inset-bottom = 0px`):** `padding-top = 10px` (`+ 8px` del `py-2` del `<header>` = `18px` totales), `padding-bottom = 14px` (idéntico al `p-3.5` original).
  * **iPhone 14/15/16 Pro en PWA Standalone (`inset-top = 59px, inset-bottom = 34px`):** `padding-top = 59px` (libra la Dynamic Island sin sumar `14px` vacíos extra), `padding-bottom = 38px` (`34px + 4px`, librando la barra Home Indicator).
  * **Modo Horizontal (*Landscape* con notch lateral `inset-left/right = 47px`):** `.px-safe` evita que el contenido quede debajo de la cámara frontal en teléfonos sin marco `max-w-md`.

### 7.2. Configuración de Viewport, Zoom y Prevención de Auto-Zoom en iOS (`index.html` y `SessionExtras.tsx`)
1. **Problema de `maximum-scale=1.0, user-scalable=no` en `index.html` (L6):**
   * Viola el criterio de accesibilidad **WCAG 2.2 SC 1.4.4 (Resize Text)** al impedir que usuarios con presbicia o baja visión amplíen la pantalla mediante *pinch-to-zoom*.
2. **Riesgo de quitar `user-scalable=no` sin contramedidas técnicas:**
   * **Riesgo A (*Double-tap to zoom*):** En una app de póker donde el usuario pulsa `[-]` o `[+]` repetidamente en menos de `300ms`, el navegador móvil puede interpretar dos toques rápidos como orden de hacer zoom.
     * **Mitigación CSS Obligatoria (`src/styles/index.css`):** Aplicar `touch-action: manipulation;` a todos los elementos interactivos (`button, a, input, select, textarea, [role="button"]`). Esta propiedad estándar desactiva exclusivamente el *double-tap zoom* manteniendo intacto el *pinch-to-zoom* con dos dedos.
   * **Riesgo B (*Auto-zoom de iOS Safari al enfocar `<input>` con fuente `< 16px`*):**
     * En [SessionExtras.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/session/SessionExtras.tsx#L72), el campo `<input id="session-note">` tiene actualmente `className="... text-xs sm:text-sm"` (`12px` en móvil). En iOS Safari, cuando `maximum-scale=1.0` no está presente, tocar cualquier `<input>` con `font-size < 16px` provoca un **zoom automático brusco de toda la página** que descoloca el layout.
     * **Mitigación Obligatoria (`SessionExtras.tsx` L72):** Cambiar la clase tipográfica del `<input>` a `text-base sm:text-sm` (`16px` en móviles `<640px`, `14px` en tablets `>=640px`).

---

## 8. RESPONSIVE VERTICAL DEL TECLADO NUMÉRICO: `CustomNumberModal.tsx` (CORRECCIÓN 6)

### 8.1. Corrección de la Contradicción `sm:h-14` en Orientación Horizontal
En [CustomNumberModal.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/common/CustomNumberModal.tsx#L108), las teclas usan `h-12 sm:h-14` (`48px` en `<640px` y `56px` en `>=640px`).
* En un viewport horizontal de **`667 × 375`** o **`844 × 390`**, el ancho supera `640px` (`sm:`), por lo que las teclas crecen a `56px` (`4 × 56px = 224px` solo la grilla), llevando el alto total del modal a `~450px` cuando el viewport solo tiene **`375px` de alto**.

### 8.2. Diseño Multi-Escenario (Vertical y Horizontal) sin Reducir Teclas por Debajo de `44px`
1. **En orientación vertical (`320 × 568`, `360 × 640`, `390 × 844`):**
   * Eliminar `sm:h-14` y fijar las 12 teclas del teclado en **`h-12` (`48px`)** y el botón `"Confirmar valor"` en **`h-12` (`48px`)**, con contenedor `p-3.5 sm:p-4 gap-2.5`.
   * **Presupuesto vertical exacto en modo retrato:**
     * Header (`36px`) + Display `$ 50.000` (`50px`) + Grilla `4 × 48px + 3 × 8px` (`216px`) + Botón Confirmar (`48px`) + Paddings/Gaps (`52px`) = **`402px` totales**.
     * En **`320 × 568`**: `402px <= 522px` (`92dvh`) → **Entra al 100% sin scroll y con teclas amplias de `48px`**.
     * En **`360 × 640`** y **`390 × 844`**: Sobran `238px` y `442px` respectivamente.
2. **En orientación horizontal de baja altura (`667 × 375` y `844 × 390` — variante `landscape-short:`):**
   * Mediante el breakpoint `landscape-short: { raw: '(max-height: 480px) and (orientation: landscape)' }` en `tailwind.config.js`:
   * El modal amplía su ancho máximo a `landscape-short:max-w-lg` (`512px`) y organiza su interior en **2 columnas paralelas** (`landscape-short:grid landscape-short:grid-cols-2 landscape-short:gap-4 landscape-short:items-center`):
     * **Columna Izquierda:** Título + Display numérico `$ 50.000` + Botón `"Confirmar valor"` (`h-11` = `44px`).
     * **Columna Derecha:** Grilla `3 × 4` con teclas `landscape-short:h-11` (`44px`).
   * **Presupuesto vertical en `667 × 375` y `844 × 390`:** `4 × 44px + 3 × 6px + 28px padding = 222px <= 345px` (`92dvh` de `375px`) → **Cero scroll necesario y teclas de `44px` de alto**.
   * Además, se mantiene `max-h-[92dvh] overflow-y-auto overscroll-contain` como salvaguarda final si el usuario abre el modal en una ventana dividida extrema.

---

## 9. ARQUITECTURA DE SCROLL Y APP SHELL VALIDADA (CORRECCIÓN 8)

### 9.1. Comportamiento de `.app-shell` en los 4 Escenarios Críticos
Para evitar que `h-[100dvh] overflow-hidden` aplaste el área central cuando la altura disponible cae drásticamente (rotación a *landscape* o apertura del teclado virtual del sistema en `NewSessionView`), se define en `src/styles/index.css`:

```css
.app-shell {
  min-height: 100vh;
  min-height: 100dvh;
  height: 100vh;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* En baja altura extrema (modo horizontal 375px o teclado virtual abierto),
   permitir scroll de documento completo para no comprimir el área central */
@media (max-height: 480px) {
  .app-shell {
    height: auto;
    max-height: none;
    overflow-y: auto;
    overflow-x: hidden;
  }
}
```

### 9.2. Verificación del Paso 2 en `HandRecorderView.tsx` (`PreflopActionTimeline` + `ActionConsole`)
En [HandRecorderView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/HandRecorderView.tsx#L384-L778), durante el Paso 2 (`Preflop`):
* **Zona Superior Fija (`shrink-0`):** `<header>` (`56px`) + Barra de Contexto `Hero / Pozo / Apuesta` (`46px`) = **`102px`**.
* **Zona Central Scrollable (`flex-1 min-h-0 overflow-y-auto`):** Contiene exclusivamente [PreflopActionTimeline.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/PreflopActionTimeline.tsx).
* **Zona Inferior Fija (`shrink-0`):** Contiene [ActionConsole.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/ActionConsole.tsx) (`206px` de alto cuando hay turno activo) o el banner `"Ronda Preflop Completada"` (`104px` cuando concluye la calle).
* **Balance de alturas resultante:**
  * En **`320 × 568`** (`568px` PWA): `568 - 102 - 206 - 24 (safe) = 236px` libres para `PreflopActionTimeline`. La consola de acción está **100% fija y accesible al pulgar**, mientras que el timeline muestra las 3 zonas (Folds, Turno Actual y En Espera) y permite hacer scroll interno si hay múltiples jugadores que hicieron *limp/call*.
  * En **`360 × 640`** a **`430 × 932`**: Quedan entre **`308px` y `600px`** libres para `PreflopActionTimeline` (cero necesidad de scroll en manos normales).
  * En **`667 × 375` (*Landscape*)**: Se activa `@media (max-height: 480px)`, permitiendo desplazar verticalmente el conjunto sin que `ActionConsole` tape el timeline.

---

## 10. MATRIZ DE VALIDACIÓN MULTIDISPOSITIVO (12+ RESOLUCIONES Y CATEGORÍAS DE EVIDENCIA)

### 10.1. Leyenda de Categorías de Evidencia (Corrección 9.E)
* **`[CÓDIGO]`:** Problema o regla confirmada directamente por lectura estática del código fuente actual.
* **`[CÁLCULO]`:** Problema o dimensión demostrada matemáticamente a partir del *box model* CSS (`width`, `padding`, `border`, `gap`, trigonometría).
* **`[BUILD/TEST]`:** Comprobado mediante ejecución real de compilador TypeScript (`tsc`), empaquetador (`vite build`) y suite Vitest (`npm test`).
* **`[PENDIENTE DOM]`:** Comportamiento dependiente del motor de renderizado de fuentes o layout final que **debe validarse con `getBoundingClientRect()` y captura visual** al implementar la fase correspondiente.

### 10.2. Matriz Completa por Resolución (`320×568` a `1024×768` + Fronteras de Breakpoint)

| Resolución Viewport | Dispositivo / Caso de Prueba | Vistas / Componentes Críticos | Estado Actual y Evidencia | Resultado Esperado Post-Implementación | Método de Medición DOM |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **`320 × 568`** | iPhone SE (1ª gen) / Móvil ultra-compacto | Todas (`BlindsPicker`, `PlayerCount`, `Stack Bar`, `PokerTable`, `CommunityCards`, `CustomNumberModal`) | Desborda `36px` en `BlindsPicker` `[CÁLCULO]`, `30px` en `CommunityCardsPicker` `[CÁLCULO]` y `~50px` en `Stack Bar` `[CÁLCULO]`. Botones de jugador de `28px` `[CÁLCULO]`. | `0px` de desborde; steppers apilados `1 col`; presets ciegas `2×2`; jugadores `4×2` (`62.5×44px`); 5 cartas comunitarias en `248px <= 274px`; mesa `300×187.5px` con $d_{\min} = 56.8\text{px}$. | `scrollWidth <= clientWidth` en raíz y tarjetas + `getBoundingClientRect()` en los 9 asientos. |
| **`359 × 640`** *(Frontera `<xs`)* | Límite superior del layout base (`<360px`) | `BlindsPicker`, `CardSelector`, `SessionActiveView` | Verificar que justo antes de `360px` el layout compacto no deje huecos desproporcionados `[PENDIENTE DOM]`. | Transición limpia sin roturas a `1px` del breakpoint `xs`. | Inspección DOM en `width: 359px`. |
| **`360 × 640`** *(Frontera `xs`)* | Android compacto estándar (Galaxy S8/S9, Moto G) | `SessionActiveView` (chip Flop), `BlindsPicker` (`2 cols`), `PokerTable` (`w-12/w-11`), `ActionConsole` | Chip de Flop oculto por falta de `xs` `[CÓDIGO]`; `.pb-safe` vale `0px` `[CÓDIGO]`; `ActionConsole` justa `[CÁLCULO]`. | Se activa `xs:`: chip de Flop visible, steppers de ciegas en 2 columnas (`148px` c/u), cartas del Flop en `w-14 h-19` (`56×76px`), asientos Hero `48px` / Rival `44px`. | `getComputedStyle(flopChip).display !== 'none'` y `paddingBottom >= 14px`. |
| **`360 × 800`** | Android moderno alargado (relación `20:9`) | `NewSessionView`, `HandRecorderView` (Pasos 1, 2, 3) | Mismo ancho que `360×640` (`306px` en tarjeta) pero `+160px` de altura libre. | Las 4 vistas entran con **cero scroll vertical** en estados normales y `.app-shell` mantiene el CTA anclado abajo. | `mainEl.scrollHeight <= mainEl.clientHeight` en Paso 1 y Paso 2 inicial. |
| **`375 × 667`** | iPhone SE (2ª/3ª gen) / iPhone 8 | `PokerTable`, `HandRecorderView`, `SessionActiveView` | Asiento superior de `PokerTable` sobresale `~2px` `[CÁLCULO]`; historial de +10 manos desplaza toda la ventana `[CÓDIGO]`. | Mesa de `347×216.9px` 100% contenida; scroll exclusivo en la lista de manos. | `seatRect.top >= tableRect.top` para los 9 asientos. |
| **`390 × 844`** | iPhone 13 / 14 / 15 estándar | Todas las vistas + Safe Areas iOS | En PWA con `viewport-fit=cover`, `NewSessionView` duplica `pb-safe` `[CÓDIGO]`. | Espaciado inferior exacto de `38px` (`34px + 4px`) sin doble aplicación. | Verificar `paddingBottom` en contenedor raíz y `0px` en footer hijo. |
| **`393 × 873`** | Pixel 7 / 8 / Android gama media-alta | Todas las vistas | `PlayerCountSelector` pasa de `37px` (`grid-cols-8`) a `78.7px` (`grid-cols-4`). | Botones amplios y consistentes en toda la sesión. | `btnRect.width >= 75` y `btnRect.height === 44`. |
| **`412 × 915`** | Samsung Galaxy S22/S23/S24 Ultra / Pixel Pro | `PokerTable` (alcanza `max-w-sm` = `384px`) | La mesa alcanza su tope `384×240px` con $d_{\min} = 72.7\text{px}$. | Máxima holgura visual; historial muestra 8–9 manos visibles sin scroll. | `tableRect.width === 384` y `tableRect.height === 240`. |
| **`430 × 932`** | iPhone 14/15/16 Pro Max | Todas las vistas | Buen ancho; adolece de los mismos fallos estructurales `RESP-01`, `RESP-02`, `RESP-07` `[CÓDIGO]`. | Layout fluido con tarjetas de `376px` internos y scroll aislado. | Verificación de `.app-shell` e historial. |
| **`667 × 375`** *(Landscape)* | iPhone SE / 8 en horizontal (`width >= 640px`, `height = 375px`) | `CustomNumberModal`, `HandRecorderView` (Paso 2), `ExportModal` | `sm:h-14` agranda las teclas del modal numérico a `56px` en `375px` de alto `[CÓDIGO]`. | Se activan `@media (max-height: 480px)` en `.app-shell` y `landscape-short:` en `CustomNumberModal` (layout de 2 columnas de `222px` de alto). | `modalRect.height <= window.innerHeight * 0.92` sin recortar el botón Confirmar. |
| **`844 × 390`** *(Landscape)* | iPhone 14 / Android en horizontal | `CustomNumberModal`, `NewSessionView`, `HandRecorderView` | Mismo conflicto de `sm:h-14` y compresión vertical si `h-[100dvh]` bloquea el scroll `[CÓDIGO]`. | Scroll vertical habilitado por `@media (max-height: 480px)` y modal en 2 columnas. | Todos los botones de `ActionConsole` y `Timeline` accesibles mediante scroll. |
| **`768 × 1024`** y **`1024 × 768`** | iPad Mini / iPad Air (Vertical y Horizontal) | `App.tsx`, `NewSessionView` | El footer `fixed` de `NewSessionView` se estira a los `768px`/`1024px` de ancho `[CÓDIGO]`. | Contenedor `max-w-md mx-auto` enmarcado con `sm:border-x sm:border-slate-800/60 sm:shadow-2xl` y footer contenido en los `448px`. | `footerRect.width <= 448`. |

---

## 11. INVENTARIO CONSOLIDADO DE LOS 11 PROBLEMAS (`RESP-01` A `RESP-11`)

| ID | Archivo(s) y Líneas | Categoría de Evidencia | Descripción Técnica Exacta | Fase Asignada | Nivel de Riesgo y Posibles Regresiones |
| :- | :--- | :---: | :--- | :---: | :--- |
| **RESP-01** | `SessionActiveView.tsx` (L152), `HandRecorderView.tsx` (L374), `HandReviewView.tsx` (L110) | `[CÓDIGO]` | El contenedor raíz usa `min-h-[100dvh]` sin `h-[100dvh] max-h-[100dvh]` ni `min-h-0` en el hijo `flex-1 overflow-y-auto`, impidiendo el scroll interno y desplazando toda la ventana. | **Fase P0** | **Medio:** Si se aplica `h-[100dvh] overflow-hidden` sin excepción para baja altura (`<480px`), en *landscape* (`375px` de alto) el área central del Paso 2 quedaría de `45px`. Se mitiga con `@media (max-height: 480px)` en `.app-shell`. |
| **RESP-02** | `src/styles/index.css` (L47–52), `SessionActiveView.tsx` (L152), `NewSessionView.tsx` (L61, L133) | `[CÓDIGO]` | `.pt-safe` y `.pb-safe` sobrescriben el padding vertical a `0px` cuando `env()` es `0px`. En `NewSessionView` se aplica `pb-safe` dos veces. | **Fase P0** | **Bajo-Medio:** Cambiar `p-3.5` por `px-2.5 xs:px-3.5` + `.pt-safe`/`.pb-safe` requiere verificar que ninguna vista sume el inset dos veces ni pierda sus `14px` inferiores base. |
| **RESP-03** | `PresetPill.tsx` (L28), `ToggleSwitch.tsx` (L25) | `[CÓDIGO]` | Usan `clsx` en vez de `cn()` (`tailwind-merge`). Al pasar `className="px-1.5"`, el `px-3.5` base no se elimina y recorta los textos de los presets. | **Fase P0** | **Bajo:** `cn()` ya está probado en `GlassCard` y `NumberStepper`. |
| **RESP-04** | `BlindsPicker.tsx` (L73, L111), `NumberStepper.tsx` (L61) | `[CÁLCULO]` + `[CÓDIGO]` | En `320px` (`266px`–`274px` internos), 2 steppers en `grid-cols-2` (`302px` requeridos) desbordan `28px–36px`, y los 4 presets en `grid-cols-4` cortan `"1.000 / 2.000"`. | **Fase P1** | **Bajo-Medio:** Apilar los 2 steppers en `grid-cols-1 xs:grid-cols-2` y los presets en `grid-cols-2 xs:grid-cols-4` suma `~92px` de altura únicamente en `<360px` (`320×568`), absorbidos por el scroll de `.app-shell`. |
| **RESP-05** | `CommunityCardsPicker.tsx` (L163–217) | `[CÁLCULO]` + `[CÓDIGO]` | Los 5 slots del board (`3×56px + 2×48px + 4×8px = 296px`) superan los `266px–274px` internos de la tarjeta en `320px`. | **Fase P2** | **Bajo:** Con `w-12 h-16 xs:w-14 xs:h-19` y `w-10 h-16 xs:w-12 xs:h-19` + `gap-1.5 xs:gap-2`, la fila mide **`248px`** en `320px` (`26px` libres dentro de `274px`) y conserva los `296px` originales desde `360px`. |
| **RESP-06** | `HandRecorderView.tsx` (L456–532) | `[CÁLCULO]` + `[CÓDIGO]` | En la barra de stack del Paso 1, el monto izquierdo y los 4 botones derechos (`-`, `+`, `Editar`, `X`) suman `~325px` en una fila sin `wrap`. | **Fase P1** | **Bajo:** Eliminar el botón redundante `"Editar"` (ahorra `64px`) exige añadir un ícono `<Edit3 className="w-3.5 h-3.5" />` junto al monto para que la affordance de edición manual siga siendo evidente. |
| **RESP-07** | `tailwind.config.js`, `index.html` (L6), `SessionActiveView.tsx` (L317), `SessionExtras.tsx` (L51, L72) | `[CÓDIGO]` | `xs:` no existe en `tailwind.config.js` (oculta el chip del Flop en todos los móviles `<640px`); `index.html` bloquea zoom con `user-scalable=no`; `<input>` de nota tiene `text-xs` (`12px`). | **Fase P0 / P1** | **Medio:** Al habilitar el zoom en `index.html` (P0), es obligatorio aplicar `touch-action: manipulation` en `index.css` (P0) y subir el `<input>` de `SessionExtras.tsx` a `text-base sm:text-sm` (`16px` en móvil, P1) para evitar auto-zoom en iOS Safari. |
| **RESP-08** | `PokerTable.tsx` (L35–42, L54, L114–125) | `[CÁLCULO]` + `[CÓDIGO]` | Con `aspect-[16/9.5]`, `rx=41`, `ry=38` y ángulos uniformes, el asiento superior sobresale `3.3px` y los asientos laterales `BB–UTG` y `MP–HJ` en 9-max quedan a `46.6px` en `320px` (superponiéndose `1.4px` con `ring-2`). | **Fase P2** | **Medio:** Modificar la geometría de `PokerTable` requiere validar visualmente y con `getBoundingClientRect()` las 8 configuraciones (`2` a `9` jugadores) para confirmar que ningún asiento ni badge `D` se solape ni salga de la caja. |
| **RESP-09** | `ActionConsole.tsx` (L109–135) | `[CÁLCULO]` + `[CÓDIGO]` | La píldora `HERO (UTG+1) — TU TURNO` y el botón `Folds hasta Hero` suman `~335px` sin `truncate`, chocando en `320px` y `360px`. | **Fase P2** | **Bajo:** Usar `min-w-0 truncate` y mostrar `HERO (${pos})` en `<360px` y `HERO (${pos}) · TU TURNO` en `>=360px` mantiene la claridad sin colisión. |
| **RESP-10** | `PlayerCountSelector.tsx` (L41), `CardSelector.tsx` (L105–173), `CustomNumberModal.tsx` (L108) | `[CÁLCULO]` + `[CÓDIGO]` | `PlayerCountSelector` en `grid-cols-8` deja botones de `28px` en `320px`; `CardSelector` comprime su cabecera en `320px`; `CustomNumberModal` usa `sm:h-14` que agranda teclas en *landscape*. | **Fase P1 / P2 / P3** | **Bajo-Medio:** Cambiar `PlayerCountSelector` a `grid-cols-4 gap-2` (2 filas, P1), compactar el botón `"Borrar"` de `CardSelector` en `<360px` (P2) y adaptar `CustomNumberModal` con `h-12` + `landscape-short:grid-cols-2` (P3). |
| **RESP-11** | `NewSessionView.tsx` (L61, L75, L133) | `[CÓDIGO]` | Usa footer `fixed bottom-0 left-0 right-0` desacoplado del contenedor `max-w-md`, requiere `pb-24` manual y duplica `pb-safe`. | **Fase P0** | **Bajo:** Al unificar `NewSessionView` dentro de `.app-shell` en la Fase P0, el footer queda nativamente anclado al flujo flex del contenedor `max-w-md`. |

---

## 12. METODOLOGÍA DE IMPLEMENTACIÓN INCREMENTAL Y CONTROL DE CALIDAD POR FASE (CORRECCIÓN 14)

Se abandona cualquier ejecución masiva de fases en bloque. La implementación se regirá estrictamente por el ciclo de compuertas de calidad:

> **POLÍTICA OBLIGATORIA:**  
> **`UNA FASE IMPLEMENTADA → UNA FASE VALIDADA (TESTS + BUILD + DOM/VISUAL) → REPORTE DE EVIDENCIA → APROBACIÓN DEL USUARIO → SIGUIENTE FASE`**

### Protocolo de 12 Puntos Obligatorios para Cada Fase (`P0`, `P1`, `P2`, `P3`)
1. **Estado inicial documentado:** Verificar `git status` limpio antes de iniciar la fase (recomendando crear un commit o punto de control previo).
2. **Archivos autorizados:** Modificar exclusivamente la lista cerrada de archivos declarada para esa fase.
3. **Lista de cambios previstos:** Aplicar únicamente las transformaciones CSS/JSX aprobadas en la fase.
4. **Pruebas unitarias y de integración (`[BUILD/TEST]`):** Ejecutar `npm test` (`vitest run`) verificando que las **4 suites / 28 tests** pasen al 100%.
5. **Compilación y tipos (`[BUILD/TEST]`):** Ejecutar `npm run build` (`tsc && vite build`) verificando `0` errores de TypeScript, generación de bundle CSS y Service Worker PWA.
6. **Pruebas visuales y mediciones DOM (`[PENDIENTE DOM]`):** Verificar en las resoluciones críticas de la fase (`320×568`, `360×640`, `390×844`, `667×375`, `768×1024`) las métricas reales (`scrollWidth`, `clientWidth`, `getBoundingClientRect()`, `getComputedStyle()`).
7. **Pruebas funcionales interactivas:** Comprobar que los flujos de usuario de los componentes tocados (selección, edición, guardado, scroll) operen sin regresiones.
8. **Comparación Antes vs. Después:** Documentar las dimensiones medidas antes y después de la fase.
9. **Criterios de aceptación cumplidos:** Ninguna fase se considera terminada solo porque `npm run build` devuelva código `0`; debe cumplir todos sus criterios geométricos y visuales.
10. **Condiciones de reversión (*Rollback*):** Si una fase introduce un recorte visual, bloqueo de scroll o fallo en tests que no pueda resolverse dentro del alcance de la fase, se ejecuta `git checkout -- <archivos_de_la_fase>` para restaurar el estado previo.
11. **Evidencia de finalización y Commit recomendado:** Presentar el reporte de validación de la fase junto con el mensaje de commit sugerido (`feat(ui): ...`).
12. **Solicitud de aprobación explícita:** Detenerse y aguardar tu autorización antes de iniciar la fase siguiente.

---

## 13. PLAN FINAL CORREGIDO POR FASES (`FASE P0` A `FASE P3`)

### Trazabilidad de Hallazgos y Fases (Versión 1 → Versión 2)
* **`Fase P0` (Fundación CSS, App Shell, Safe Areas, Viewport y `cn()`):** Resuelve **`RESP-01`**, **`RESP-02`**, **`RESP-03`**, **`RESP-07` (parcial: `tailwind.config.js` + `index.html`)** y **`RESP-11`** *(unificado en P0, eliminando su duplicación en P2)*.
* **`Fase P1` (Ergonomía y Cero Desborde en Configuración de Sesión y Barra de Stack):** Resuelve **`RESP-04`**, **`RESP-06`**, **`RESP-07` (completo: `SessionExtras.tsx`)** y **`RESP-10` (parcial: `PlayerCountSelector.tsx` en `grid-cols-4`)**.
* **`Fase P2` (Geometría Elíptica de `PokerTable`, Cartas y Consolas de Acción):** Resuelve **`RESP-08`**, **`RESP-05`**, **`RESP-09`** y **`RESP-10` (parcial: `CardSelector.tsx`)**.
* **`Fase P3` (Modales en Baja Altura / Landscape y Enmarcado en Tablets):** Resuelve **`RESP-10` (completo: `CustomNumberModal.tsx`)**, `ExportModal.tsx` y presentación en `768×1024` / `1024×768`.

---

### FASE P0 — FUNDACIÓN RESPONSIVE: APP SHELL, SAFE AREAS, VIEWPORT Y FUSIÓN DE CLASES

* **1. Objetivo:** Establecer la infraestructura CSS base del proyecto: registrar los breakpoints `xs` (`360px`) y `landscape-short` en Tailwind, reparar `.pt-safe` / `.pb-safe` preservando el padding base de diseño (`10px` arriba / `14px` abajo), habilitar el zoom accesible en `index.html` con `touch-action: manipulation`, migrar `PresetPill` y `ToggleSwitch` a `cn()`, y unificar las 4 vistas principales bajo la arquitectura `.app-shell` con scroll interno aislado y relajación automática en baja altura (`@media (max-height: 480px)`).
* **2. Problemas incluidos:** `RESP-01`, `RESP-02`, `RESP-03`, `RESP-07` (configuración `xs` y viewport), `RESP-11` (unificación de `NewSessionView`).
* **3. Archivos afectados (9 archivos):**
  1. [tailwind.config.js](file:///c:/Users/shako/Downloads/RecTheHand26/tailwind.config.js)
  2. [index.html](file:///c:/Users/shako/Downloads/RecTheHand26/index.html)
  3. [src/styles/index.css](file:///c:/Users/shako/Downloads/RecTheHand26/src/styles/index.css)
  4. [src/components/common/PresetPill.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/common/PresetPill.tsx)
  5. [src/components/common/ToggleSwitch.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/common/ToggleSwitch.tsx)
  6. [src/views/NewSessionView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/NewSessionView.tsx)
  7. [src/views/SessionActiveView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/SessionActiveView.tsx)
  8. [src/views/HandRecorderView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/HandRecorderView.tsx)
  9. [src/views/HandReviewView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/HandReviewView.tsx)
* **4. Solución técnica detallada:**
  * **`tailwind.config.js`:** Añadir dentro de `theme.extend`:
    ```js
    screens: {
      xs: '360px',
      'landscape-short': { raw: '(max-height: 480px) and (orientation: landscape)' },
    },
    ```
  * **`index.html`:** Cambiar el meta viewport a `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />`.
  * **`src/styles/index.css`:**
    * Añadir `touch-action: manipulation;` en `button, a, input, select, textarea, [role="button"]`.
    * Definir `.app-shell` (`min-h-screen h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between` con media query `@media (max-height: 480px)` que conmuta a `height: auto; max-height: none; overflow-y: auto;`).
    * Actualizar `.pt-safe` a `padding-top: max(0.625rem, env(safe-area-inset-top, 0px));` (`10px` mínimo) y `.pb-safe` a `padding-bottom: max(0.875rem, calc(env(safe-area-inset-bottom, 0px) + 0.25rem));` (`14px` mínimo, preservando `p-3.5`).
  * **`PresetPill.tsx` y `ToggleSwitch.tsx`:** Reemplazar `import { clsx } from 'clsx'` por `import { cn } from '../../utils/cn'`.
  * **Las 4 vistas (`NewSessionView`, `SessionActiveView`, `HandRecorderView`, `HandReviewView`):**
    * Usar en el nodo raíz: `className="relative app-shell bg-[#070C12] text-white w-full max-w-md mx-auto px-2.5 xs:px-3.5 sm:px-4 pt-safe pb-safe"`.
    * En `NewSessionView.tsx`, mover el `<header>` arriba del `<main className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-2.5 py-2 z-10">` y reemplazar el footer `fixed bottom-0` por `<footer className="shrink-0 pt-2 z-20">` (eliminando `pb-24` y el segundo `pb-safe`).
    * En `SessionActiveView.tsx`, `HandRecorderView.tsx` y `HandReviewView.tsx`, añadir `shrink-0` al `<header>` y al bloque inferior, y `min-h-0` al contenedor central `flex-1 min-h-0 overflow-y-auto`.
* **5. Alternativas descartadas:**
  * *Mantener `min-h-[100dvh]` con `sticky top-0` y `sticky bottom-0`:* Descartado porque en contenedores flex largos el scroll sigue ocurriendo en `window`, causando rebote elástico sobre los bordes fijos en iOS.
  * *Aplicar `h-[100dvh] overflow-hidden` sin `@media (max-height: 480px)`:* Descartado porque en *landscape* (`375px` de alto) dejaría solo `45px` visibles para `PreflopActionTimeline`.
* **6. Dependencias:** Ninguna (Fase inicial).
* **7. Riesgos:**
  * Que algún contenedor hijo directo de `.app-shell` carezca de `min-h-0`, impidiendo el encogimiento flex en Safari.
  * Que al quitar `user-scalable=no` el `<input>` de `SessionExtras.tsx` (`12px`) haga auto-zoom en iOS hasta ejecutar P1 (por ello se verifica inmediatamente o se coordina con P1).
* **8. Mitigaciones:** Revisión línea por línea de la presencia de `flex-1 min-h-0 overflow-y-auto` en las 4 vistas y aplicación de `touch-action: manipulation` en `index.css`.
* **9. Criterios de aceptación:**
  1. En `SessionActiveView` con +12 manos, al hacer scroll hasta la última mano, `header.getBoundingClientRect().top >= 0` y `footer.getBoundingClientRect().bottom <= window.innerHeight`.
  2. Cuando `env(safe-area-inset-bottom)` es `0px`, `getComputedStyle(rootEl).paddingBottom` devuelve **`14px`** (`0.875rem`) y nunca `0px`.
  3. En `360×640`, el chip de cartas del Flop en `SessionActiveView` (`hidden xs:inline`) tiene `display: inline`.
  4. `PresetPill` con `className="px-1.5"` compila sin conservar `px-3.5` en el DOM (`paddingLeft === '6px'`).
* **10. Pruebas:** `npm test` (28/28), `npm run build`, e inspección de scroll y paddings en `320×568`, `360×640`, `390×844` y `667×375`.
* **11. Procedimiento de reversión:** `git checkout -- tailwind.config.js index.html src/styles/index.css src/components/common/PresetPill.tsx src/components/common/ToggleSwitch.tsx src/views/`
* **12. Requisitos para continuar a P1:** Evidencia de compilación limpia, tests en verde y aprobación expresa del usuario.

---

### FASE P1 — ERGONOMÍA Y ELIMINACIÓN DE DESBORDAMIENTOS EN CONFIGURACIÓN DE SESIÓN Y STACK (`320px–430px`)

* **1. Objetivo:** Eliminar el desbordamiento horizontal de `36px` en `BlindsPicker.tsx` a `320px`, transformar `PlayerCountSelector.tsx` a una grilla ergonómica de `4 × 2` (`>= 62.5 × 44px` por botón), evitar el auto-zoom de iOS en el `<input>` de `SessionExtras.tsx`, y eliminar la colisión horizontal de `~325px` en la barra de Stack del Paso 1 de `HandRecorderView.tsx`.
* **2. Problemas incluidos:** `RESP-04`, `RESP-06`, `RESP-07` (`SessionExtras.tsx`), `RESP-10` (`PlayerCountSelector.tsx`).
* **3. Archivos afectados (6 archivos):**
  1. [src/components/common/NumberStepper.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/common/NumberStepper.tsx)
  2. [src/components/session/BlindsPicker.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/session/BlindsPicker.tsx)
  3. [src/components/session/StackPicker.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/session/StackPicker.tsx)
  4. [src/components/session/PlayerCountSelector.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/session/PlayerCountSelector.tsx)
  5. [src/components/session/SessionExtras.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/session/SessionExtras.tsx)
  6. [src/views/HandRecorderView.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/views/HandRecorderView.tsx) *(únicamente la barra de Stack del Paso 1, L456–567)*
* **4. Solución técnica detallada:**
  * **`NumberStepper.tsx`:** En modo `compact`, cambiar `min-w-[124px]` por `w-full min-w-0` con botones `w-8 h-8 xs:w-9 xs:h-9` (`32px` en `<360px`, `36px` en `>=360px`); en modo estándar (`StackPicker`), usar `min-w-[132px] xs:min-w-[148px] sm:min-w-[168px]` para no comprimir el título `"Stack inicial"`.
  * **`BlindsPicker.tsx`:**
    * Cambiar la grilla de los 2 steppers (`SB` y `BB`) de `grid-cols-2 gap-2.5` a **`grid-cols-1 xs:grid-cols-2 gap-2 xs:gap-2.5`** (en `320px` cada stepper dispone de los `274px` completos; desde `360px` se muestran en 2 columnas de `148px`+ donde caben sin desborde).
    * Cambiar la fila de 4 presets de `grid-cols-4 gap-1.5` a **`grid-cols-2 xs:grid-cols-4 gap-1.5`** (en `320px` forma una grilla `2×2` de `134px` de ancho por píldora; desde `360px` forma 1 fila de 4 columnas de `72px`+ con `px-1.5` efectivo gracias a `cn()`).
  * **`StackPicker.tsx`:** En la fila de 6 presets (`grid-cols-6 gap-1 xs:gap-1.5`), usar `px-1 xs:px-1.5 text-xs` para que `"100K"` entre holgadamente en los `41px` por celda a `320px`.
  * **`PlayerCountSelector.tsx`:** Cambiar `grid grid-cols-8 gap-1.5` (L41) por **`grid grid-cols-4 gap-2`**, elevando el tamaño de cada botón de `28×44px` a **`62.5×44px` en `320px`** y **`70.5×44px` en `360px`**.
  * **`SessionExtras.tsx`:** En los 2 recuadros de `Straddle` y `Rake` (L40, L49), usar `px-2.5 xs:px-3 py-2`; en el `<input id="session-note">` (L72), cambiar `text-xs sm:text-sm` a **`text-base sm:text-sm`** (`16px` en móvil para evitar auto-zoom de iOS Safari).
  * **`HandRecorderView.tsx` (Barra de Stack en Paso 1, L456–532):**
    * Cuando `stackAtStart > 0`: eliminar el botón duplicado `"Editar"` de la derecha y añadir un ícono `<Edit3 className="w-3.5 h-3.5 text-emerald-400/80 flex-shrink-0" />` dentro del botón izquierdo del monto (`$50.000 (50 BB)`), dejando a la derecha únicamente `[-]`, `[+]` y `[X]`. Esto reduce el ancho requerido de `~325px` a **`~252px <= 274px`**.
* **5. Alternativas descartadas:**
  * *Mantener `grid-cols-8` en `PlayerCountSelector`:* Descartado en la Corrección 2 porque `28px–33px` de ancho por botón incumple el objetivo ergonómico de `44×44px`.
  * *Mantener `grid-cols-2` para los steppers de `BlindsPicker` en `320px` reduciendo los botones `[-]`/`[+]` a `24px`:* Descartado porque crearía controles diminutos difíciles de acertar con el pulgar.
* **6. Dependencias:** Requiere Fase `P0` (`xs: '360px'` en `tailwind.config.js` y `cn()` en `PresetPill.tsx`).
* **7. Riesgos:** Que en `360px` (`xs:grid-cols-4` en `BlindsPicker`) el texto `"1.000 / 2.000"` (`13` caracteres) quede justo dentro de los `72px` de la celda.
* **8. Mitigaciones:** Usar `text-[11px] xs:text-xs px-1` en los `PresetPill` de `BlindsPicker.tsx` para que en `360px` (`72px` de ancho con `8px` de padding total = `64px` útiles de texto) `"1.000 / 2.000"` (`~58px` de ancho en `11px/12px`) entre con margen de seguridad, y verificarlo con `scrollWidth <= clientWidth` en `360px`.
* **9. Criterios de aceptación:**
  1. En `320×568` y `360×640`, `BlindsPicker`, `StackPicker`, `PlayerCountSelector`, `SessionExtras` y la barra de Stack del Paso 1 cumplen `el.scrollWidth <= el.clientWidth`.
  2. Cada botón de `PlayerCountSelector` mide `>= 60px` de ancho y `44px` de alto en `320×568`.
  3. El `<input id="session-note">` tiene `getComputedStyle(input).fontSize === '16px'` en viewports `<640px`.
* **10. Pruebas:** `npm test`, `npm run build` y medición `getBoundingClientRect()` en `NewSessionView` y Paso 1 de `HandRecorderView` a `320×568`, `359×640`, `360×640` y `390×844`.
* **11. Procedimiento de reversión:** `git checkout -- src/components/common/NumberStepper.tsx src/components/session/ src/views/HandRecorderView.tsx`
* **12. Requisitos para continuar a P2:** Reporte de mediciones DOM de P1 y aprobación del usuario.

---

### FASE P2 — GEOMETRÍA ELÍPTICA DE `PokerTable`, SELECTOR DE CARTAS Y CONSOLAS DE ACCIÓN

* **1. Objetivo:** Implementar la corrección geométrica verificada en `PokerTable.tsx` (`aspect-[16/10]`, `rx = 40.5`, `ry = 36.0`, ecualización angular $\theta' = \theta + 0.12 \sin(2\theta)$ y asientos escalables `w-11/w-10` en `<360px`), eliminar el desbordamiento de `30px` en `CommunityCardsPicker.tsx` a `320px`, y evitar colisiones horizontales en las cabeceras de `CardSelector.tsx`, `ActionConsole.tsx` y `FlopActionConsole.tsx`.
* **2. Problemas incluidos:** `RESP-08`, `RESP-05`, `RESP-09`, `RESP-10` (`CardSelector.tsx`).
* **3. Archivos afectados (5 archivos):**
  1. [src/components/poker/PokerTable.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/PokerTable.tsx)
  2. [src/components/poker/CardSelector.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/CardSelector.tsx)
  3. [src/components/poker/ActionConsole.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/ActionConsole.tsx)
  4. [src/components/poker/CommunityCardsPicker.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/CommunityCardsPicker.tsx)
  5. [src/components/poker/FlopActionConsole.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/poker/FlopActionConsole.tsx)
* **4. Solución técnica detallada:**
  * **`PokerTable.tsx`:**
    * Cambiar el contenedor (L54) de `aspect-[16/9.5]` a **`aspect-[16/10]`** (sin `max-h-*` que deforme el `aspect-ratio`).
    * Actualizar `getCoordinates` (L35–42) con `rx = 40.5`, `ry = 36` y `const angle = total >= 5 ? baseAngle + 0.12 * Math.sin(2 * baseAngle) : baseAngle;`.
    * Escalar asientos (L115–116): Hero `w-11 h-11 xs:w-12 xs:h-12` (`44px` en `320px`, `48px` desde `360px`); Rival `w-10 h-10 xs:w-11 xs:h-11` (`40px` en `320px`, `44px` desde `360px`).
  * **`CardSelector.tsx`:**
    * En el botón `"Borrar"` (L159–163), envolver el texto en `<span className="hidden xs:inline">Borrar</span>` dejando siempre visible `<Trash2 className="w-3.5 h-3.5" />`, y en los slots vacíos (`Carta 1`, `Carta 2`, L119) usar `px-2 xs:px-2.5 min-w-[48px] xs:min-w-[54px]`.
  * **`ActionConsole.tsx`:**
    * En la fila superior (L109–135), añadir `min-w-0` al indicador de turno de Hero (L111) con `<span className="truncate">HERO ({currentPosition})<span className="hidden xs:inline"> — TU TURNO</span></span>` y `flex-shrink-0` al botón `"Folds hasta Hero"` (`px-2.5 xs:px-3`).
    * En los 4 botones de acción principales (L143, L154, L167, L179), usar `h-13 xs:h-14` (`52px` en `320px`, `56px` desde `360px`, ambos válidos en `tailwind.config.js`).
  * **`CommunityCardsPicker.tsx`:**
    * En la fila de 5 cartas del board (L163–217), cambiar `gap-2` por `gap-1.5 xs:gap-2`, las 3 cartas del Flop (L170, L188) de `w-14 h-19` a **`w-12 h-16 xs:w-14 xs:h-19`** (`48×64px` en `<360px`, `56×76px` en `>=360px`), y los 2 placeholders de Turn/River (L209, L213) de `w-12 h-19` a **`w-10 h-16 xs:w-12 xs:h-19`** (`40×64px` en `<360px`, `48×76px` en `>=360px`).
    * En el botón `"Borrar"` de la cabecera (L156), usar `<span className="hidden xs:inline">Borrar</span>` para evitar colisión cuando también está visible `"Ocultar teclado"`.
  * **`FlopActionConsole.tsx`:**
    * Usar `p-3 xs:p-3.5` en el contenedor (L64) y añadir `min-w-0 truncate` al título `"Acción de Hero en el Flop ({heroPosition})"` (L71).
* **5. Alternativas descartadas:**
  * *Usar `max-h-[168px]` sobre `PokerTable`:* Descartado en la Corrección 4 porque rompe la relación `aspect-[16/10]` y achata verticalmente la elipse.
  * *Mantener ángulos uniformes sin ecualización $\sin(2\theta)$:* Descartado en la Corrección 3 porque deja `BB` y `UTG` a solo `46.6px` en `320px`.
* **6. Dependencias:** Requiere Fase `P0` (`xs: '360px'`).
* **7. Riesgos:** Que al cambiar las coordenadas de `PokerTable` algún texto dentro del óvalo central (`Posición: UTG+1` + 2 cartas de Hero) quede próximo a los asientos internos.
* **8. Mitigaciones:** El óvalo interior punteado tiene `w-[76%] h-[68%]` y los centros de asientos están en el perímetro `rx = 40.5%`, `ry = 36%` (`81%` de ancho y `72%` de alto entre centros), dejando el centro libre. Se verificará con 2, 3, 4, 5, 6, 7, 8 y 9 jugadores.
* **9. Criterios de aceptación:**
  1. En `PokerTable` a `320×568` con 9 jugadores, la distancia medida entre bordes de cualquier par de asientos adyacentes (incluyendo `ring-2`) es **`>= 10px`** y todos los asientos cumplen `seatRect.top >= tableRect.top` y `seatRect.bottom <= tableRect.bottom`.
  2. En `CommunityCardsPicker` a `320×568`, la suma de anchos de los 5 slots + 4 gaps es exactamente **`248px <= 274px`** (`0px` de desborde).
  3. En `ActionConsole` a `320×568`, el indicador de turno y `"Folds hasta Hero"` conviven en una sola línea con `>= 8px` de separación.
* **10. Pruebas:** `npm test`, `npm run build` y validación geométrica de `PokerTable` (2 a 9 jugadores) + Paso 2 y Paso 3 en `320×568`, `360×640`, `375×667` y `390×844`.
* **11. Procedimiento de reversión:** `git checkout -- src/components/poker/`
* **12. Requisitos para continuar a P3:** Reporte de validación geométrica de P2 y aprobación del usuario.

---

### FASE P3 — MODALES ADAPTATIVOS (VERTICAL Y LANDSCAPE) Y ENMARCADO EN TABLETS/DESKTOP

* **1. Objetivo:** Resolver la contradicción de altura de `CustomNumberModal.tsx` en modo horizontal (`667×375` y `844×390`), optimizar `ExportModal.tsx` para baja altura y enmarcar estéticamente el contenedor móvil `max-w-md` en resoluciones de tablet/desktop (`768×1024` y `1024×768`).
* **2. Problemas incluidos:** `RESP-10` (`CustomNumberModal.tsx`), adaptación de `ExportModal.tsx` y presentación en tablets (`App.tsx`).
* **3. Archivos afectados (3 archivos):**
  1. [src/components/common/CustomNumberModal.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/common/CustomNumberModal.tsx)
  2. [src/components/common/ExportModal.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/components/common/ExportModal.tsx)
  3. [src/App.tsx](file:///c:/Users/shako/Downloads/RecTheHand26/src/App.tsx)
* **4. Solución técnica detallada:**
  * **`CustomNumberModal.tsx`:**
    * Eliminar `sm:h-14` en las 12 teclas y usar **`h-12 landscape-short:h-10`** (`48px` en vertical para todas las pantallas desde `320×568`; `40px` en *landscape* de baja altura).
    * En `landscape-short:`, ampliar el contenedor del modal a `landscape-short:max-w-lg` y disponer un layout de 2 columnas (`landscape-short:grid landscape-short:grid-cols-2 landscape-short:gap-4 landscape-short:items-center`) donde la columna izquierda contiene la cabecera, el visor `$ 50.000` y el botón `"Confirmar valor"`, y la columna derecha contiene la grilla `3 × 4` de dígitos.
  * **`ExportModal.tsx`:**
    * Ajustar el contenedor a `p-3.5 sm:p-5 max-h-[90dvh] overflow-y-auto overscroll-contain` y compactar el padding de las tarjetas de exportación en baja altura (`p-3 xs:p-4`).
  * **`App.tsx`:**
    * Cambiar `min-h-screen bg-[#070C12]` por `min-h-[100dvh] bg-[#05080C] sm:flex sm:justify-center` para que el contenedor `max-w-md` de las vistas destaque con bordes laterales sutiles en pantallas de `768px` y `1024px`.
* **5. Alternativas descartadas:**
  * *Usar `h-11 xs:h-12 sm:h-14` en `CustomNumberModal`:* Descartado en la Corrección 6 porque `sm:h-14` se activa en `667×375` (*landscape*), agrandando las teclas cuando menos altura existe.
* **6. Dependencias:** Requiere Fase `P0` (variante `landscape-short` en `tailwind.config.js`).
* **7. Riesgos:** Que al usar `landscape-short:grid-cols-2` en `CustomNumberModal` el botón de cerrar `X` quede en la columna izquierda en lugar de la esquina superior derecha del modal.
* **8. Mitigaciones:** Mantener la cabecera (`title` + botón `X`) ocupando las 2 columnas (`landscape-short:col-span-2`) arriba, y debajo dividir en columna izquierda (Display `$` + botón `"Confirmar valor"`) y columna derecha (Teclado `3 × 4`).
* **9. Criterios de aceptación:**
  1. En `320×568` (vertical), `CustomNumberModal` mide `~402px` de alto (`<= 522px` de `92dvh`) con teclas de `48px` (`h-12`) y **cero scroll interno**.
  2. En `667×375` y `844×390` (*landscape*), `CustomNumberModal` se dispone en 2 columnas (`~245px` de alto `<= 345px` de `92dvh`) con **cero scroll interno** y botón `"Confirmar valor"` inmediatamente visible.
  3. En `768×1024` y `1024×768`, la aplicación se muestra centrada en `448px` sin footers desbordados.
* **10. Pruebas:** `npm test`, `npm run build` e inspección de `CustomNumberModal` y `ExportModal` en `320×568`, `390×844`, `667×375`, `844×390` y `768×1024`.
* **11. Procedimiento de reversión:** `git checkout -- src/components/common/CustomNumberModal.tsx src/components/common/ExportModal.tsx src/App.tsx`
* **12. Requisitos de cierre:** Suite completa de 28 tests en verde, build de producción limpio y reporte final de auditoría cerrando las 4 fases.

---

## 14. REVISIÓN DE LAS DECISIONES PENDIENTES DE APROBACIÓN (`D-R1` A `D-R6`)

Mantenemos los identificadores originales **`D-R1` a `D-R4`** para trazabilidad directa con la Versión 1, incorporando las condiciones técnicas de la Revisión Correctiva y sumando **`D-R5`** y **`D-R6`** surgidas de las Correcciones 2 y 7:

1. **`D-R1` — Arquitectura de Scroll `.app-shell` con Relajación en Baja Altura (`Fase P0`):**
   * **Recomendación técnica:** Aprobar la unificación de las 4 vistas bajo `.app-shell` (`h-[100dvh] max-h-[100dvh] overflow-hidden` con `<main className="flex-1 min-h-0 overflow-y-auto">`), **condicionada** a incluir la regla `@media (max-height: 480px)` que relaja el contenedor a `height: auto; overflow-y: auto` en modo horizontal (`375px` de alto) o cuando se abre el teclado virtual del sistema, garantizando que `ActionConsole` nunca aplaste a `PreflopActionTimeline`.
2. **`D-R2` — Reorganización de `BlindsPicker` en `<360px` y Validación en `360px` (`Fase P1`):**
   * **Recomendación técnica:** Aprobar que en `<360px` (`320px`) los 2 steppers se apilen en `grid-cols-1 xs:grid-cols-2` y los 4 presets se dispongan en `grid-cols-2 xs:grid-cols-4`, **condicionada** a comprobar mediante medición DOM en `360px` exactos que la etiqueta `"1.000 / 2.000"` quepa sin truncado dentro de su celda de `72px` (usando `px-1 text-[11px] xs:text-xs`).
3. **`D-R3` — Eliminación del Botón `"Editar"` Redundante en la Barra de Stack con Indicación Visual (`Fase P1`):**
   * **Recomendación técnica:** Aprobar la eliminación del botón textual `"Editar"` a la derecha cuando el stack ya está definido (liberando `64px` horizontales), **condicionada** a agregar un ícono `<Edit3 className="w-3.5 h-3.5" />` integrado dentro del botón del monto (`$50.000 (50 BB)`) para que el usuario identifique visualmente que tocar el monto abre el teclado numérico.
4. **`D-R4` — Breakpoint `xs: '360px'` y `landscape-short` en `tailwind.config.js` (`Fase P0`):**
   * **Recomendación técnica:** Aprobar la definición de `xs: '360px'` y `landscape-short: '(max-height: 480px) and (orientation: landscape)'` en `theme.extend.screens`. No se utiliza `xs` como solución mágica universal, sino combinado con grillas fluidas (`min-w-0`), comprobando explícitamente la ausencia de discontinuidades entre `359px` y `360px`.
5. **`D-R5` *(Nueva — Corrección 2)* — Selector de Jugadores `PlayerCountSelector` en Grilla `4 × 2` (`Fase P1`):**
   * **Recomendación técnica:** Aprobar el cambio de `grid-cols-8` (1 fila con botones de `28px–33px` de ancho) a **`grid-cols-4 gap-2` (2 filas de 4 botones de `h-11` = `44px`)**, garantizando áreas táctiles de **`62.5 × 44px` en `320px`** y **`70.5 × 44px` en `360px`**.
6. **`D-R6` *(Nueva — Corrección 7)* — Habilitación de Zoom Accesible en `index.html` + Mitigación en iOS (`Fase P0 / P1`):**
   * **Recomendación técnica:** Aprobar la eliminación de `maximum-scale=1.0, user-scalable=no` en `index.html`, acompañada obligatoriamente de `touch-action: manipulation` en `src/styles/index.css` y `text-base sm:text-sm` (`16px` en móvil) en el `<input>` de `SessionExtras.tsx` para evitar el auto-zoom forzado de iOS Safari.

---

## ESTADO DE PREPARACIÓN PARA IMPLEMENTACIÓN

### 1. Correcciones Realizadas en esta Versión 2 del Plan
* **Compatibilidad con Tailwind CSS verificada (`Corrección 1`):** Se comprobó en `tailwind.config.js` (L34–43) que `h-13`, `h-19`, `w-4.5` y `scale-98` ya existen en `theme.extend`, y se documentó la adición obligatoria de `screens.xs` y `screens['landscape-short']`.
* **Rediseño ergonómico de `PlayerCountSelector.tsx` (`Corrección 2`):** Se reemplazó la insuficiente reducción de `gap` en `grid-cols-8` por una grilla `grid-cols-4 gap-2` de 2 filas (`>= 62.5 × 44px` por botón desde `320px`).
* **Demostración trigonométrica y ecualización elíptica de `PokerTable.tsx` (`Correcciones 3 y 4`):** Se corrigió el cálculo de separación de asientos en los flancos laterales (`BB–UTG` y `MP–HJ` en 9-max), incorporando `aspect-[16/10]`, `rx = 40.5`, `ry = 36` y ecualización armónica $\theta' = \theta + 0.12 \sin(2\theta)$ que eleva la distancia mínima centro a centro en `320px` de `46.6px` a **`56.8px`** (`+12.8px` de luz libre entre bordes), eliminando además los `max-h-*` que deformaban el `aspect-ratio`.
* **Preservación de padding base en Safe Areas (`Corrección 5`):** Se ajustaron `.pt-safe` (`>=10px`) y `.pb-safe` (`>=14px`) desacoplados del padding horizontal y eliminando el doble `pb-safe` de `NewSessionView.tsx`.
* **Solución en 2 columnas para `CustomNumberModal.tsx` en *landscape* (`Corrección 6`):** Se eliminó `sm:h-14` (que agrandaba las teclas en `667×375`) y se diseñó el layout `landscape-short:grid-cols-2` que entra en `222px` de alto sin scroll.
* **Accesibilidad de Viewport sin auto-zoom en iOS (`Corrección 7`):** Se planificó quitar `user-scalable=no` junto con `touch-action: manipulation` y fuente de `16px` (`text-base`) en el `<input>` de `SessionExtras.tsx`.
* **Saneamiento de consistencia interna (`Corrección 10`):** Se unificaron los **11 hallazgos (`RESP-01` a `RESP-11`)**, el ancho interior exacto de tarjeta en `320px` (`266px` con `px-3.5` / `274px` con `px-2.5`), la suma de `248px` en `CommunityCardsPicker`, la asignación única de `RESP-11` a la Fase P0 y el alcance sobre los 21 archivos auditados.

### 2. Riesgos Técnicos Pendientes de Vigilar Durante la Implementación
1. **Renderizado exacto de fuentes en `320px` y `360px` (`[PENDIENTE DOM]`):** Verificar con `getBoundingClientRect()` que las cadenas dinámicas (`"$50.000 (50 BB)"`, `"1.000 / 2.000"`, `"HERO (UTG+1)"`) no generen truncados inesperados.
2. **Interacción del teclado virtual en `NewSessionView` (`[PENDIENTE DOM]`):** Confirmar que al enfocar el `<input id="session-note">` en una pantalla de baja altura se active limpiamente el scroll hacia el campo sin que el botón `"Comenzar sesión"` lo cubra.
3. **Geometría de 9 jugadores en `PokerTable` (`[PENDIENTE DOM]`):** Contrastar en el DOM real las posiciones de los 9 asientos y el badge `D` contra los valores trigonométricos calculados en la Tabla 6.4.

### 3. Pruebas que Todavía Deben Ejecutarse (En Cada Fase de Implementación)
* Ejecución de `npm test` (`vitest run`, 28 tests) y `npm run build` (`tsc && vite build`) al cierre de cada una de las 4 fases.
* Medición DOM real (`scrollWidth <= clientWidth`, `getBoundingClientRect()`, `getComputedStyle()`) en la matriz de 12 resoluciones (`320×568` a `1024×768` + fronteras `359×640` y `667×375`).

### 4. Decisiones Pendientes de tu Aprobación (`D-R1` a `D-R6`)
* Confirmar aprobación de **`D-R1`**, **`D-R2`**, **`D-R3`**, **`D-R4`**, **`D-R5`** (`PlayerCountSelector` en `4×2`) y **`D-R6`** (Viewport con zoom accesible + `touch-action: manipulation` + input `16px`).

### 5. Orden de Ejecución Recomendado (Estrictamente Incremental)
1. **Fase P0** → Validación P0 + Reporte → *Aprobación del usuario*
2. **Fase P1** → Validación P1 + Reporte → *Aprobación del usuario*
3. **Fase P2** → Validación P2 + Reporte → *Aprobación del usuario*
4. **Fase P3** → Validación P3 + Reporte Final → *Cierre del proyecto*

### 6. Condiciones Necesarias para Comenzar la Fase P0
* Árbol de trabajo verificado sin modificaciones no autorizadas en `src/`.
* Aprobación explícita de las decisiones **`D-R1` a `D-R6`** y autorización para ejecutar **únicamente la Fase P0** como primer paso.
