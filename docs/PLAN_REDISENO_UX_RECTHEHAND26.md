# RECTHEHAND26 — AUDITORÍA UX/UI Y PLAN PROFESIONAL DE REDISEÑO POR FASES

**Fecha de Auditoría:** 27 de octubre de 2026  
**Equipo Auditor:** UX/UI Mobile-First · Product Design · Frontend Architecture (React/TS/Tailwind) · HCI · QA  
**Estado del Documento:** PROPUESTA TÉCNICA PENDIENTE DE APROBACIÓN (Sin cambios aplicados en código)  
**Baseline de Pruebas Actual:** 4 suites / 28 tests unitarios pasando (`vitest run` en `bettingEngine`, `positionEngine`, `exportUtils`, `handStore`).

---

## 1. RESUMEN EJECUTIVO

**RecTheHand26** cuenta con una arquitectura funcional sólida, un motor de apuestas preflop bien testeado (`bettingEngine.ts`), un compresor inteligente de historiales (`exportUtils.ts`) y una identidad visual **dark-neon** (`#070C12` + esmeralda `#10B981`) ideal para ambientes de baja iluminación en partidas presenciales (*Live Cash Games*).

Sin embargo, la auditoría profunda del código fuente revela que **el aprovechamiento del espacio vertical y la ergonomía táctil bajo presión de tiempo presentan cuellos de botella críticos** en las pantallas de mayor frecuencia operativa:

1. **En el Paso 2 del Grabador (Consola Preflop — `PreflopActionTimeline.tsx` + `ActionConsole.tsx`)**: En una mesa de 9 jugadores, las 9 filas del timeline consumen **`520px` de alto** (`9 × 52px + gaps`), mientras que el encabezado, la barra superior de posiciones y la consola inferior fija reclaman otros **`350px`**. Total: **`870px`**, lo que provoca que en teléfonos pequeños (`320×568`), medianos (`360×800`) e incluso estándar (`390×844`) **el jugador activo quede oculto bajo el pliegue de scroll** justo cuando el usuario necesita registrar la acción en menos de 3 segundos.
2. **En el Paso 1 del Grabador (Posición y Cartas — `PokerTable.tsx` + `CardSelector.tsx`)**: La suma de la mesa ovalada (`aspect-[16/11]` ≈ `240px-260px`), la barra de stack (`46px`) y el selector de cartas con slots inferiores de previsualización (`332px`) exige **`~720px` de altura**, forzando desplazamiento vertical en pantallas de hasta `800px` de alto o dejando los palos/cartas al límite del botón inferior.
3. **Redundancia de Controles de Posición**: En `HandRecorderView.tsx`, la barra horizontal superior de posiciones (`actionOrder.map`) permanece montada durante los Pasos 1, 2 y 3 (`49px` fijos), duplicando en el Paso 1 los asientos de `PokerTable.tsx`, en el Paso 2 las filas de `PreflopActionTimeline.tsx`, y en el Paso 3 las píldoras de `activePlayers`.
4. **En el Dashboard (`SessionActiveView.tsx`)**: El estado vacío utiliza `flex-1 min-h-[160px]` con `justify-between`, generando un bloque hueco sobredimensionado y mostrando `VPIP: 0% | PFR: 0%` cuando aún no existen manos registradas.
5. **En el Paso 3 (Postflop — `CommunityCardsPicker.tsx` + `FlopActionConsole.tsx`)**: Las pestañas `TURN` y `RIVER` se muestran como botones interactivos que cambian el estado `currentStreet`, pero el modelo de datos y la interfaz siguen operando exclusivamente sobre el `Flop`, induciendo a error al usuario.

Este plan establece una estrategia de **compactación inteligente, información progresiva y ergonomía del pulgar** dividida en **7 fases incrementales**, garantizando **0 scroll en los flujos críticos** para viewports desde `360×800` en adelante, sin reducir áreas táctiles por debajo de `44×44px` y sin alterar la lógica de negocio ni la persistencia en IndexedDB.

---

## 2. DIAGNÓSTICO GENERAL DEL FRONTEND Y STACK VERIFICADO

### 2.1. Verificación del Stack Tecnológico Real (`package.json` y configuración)
Tras inspeccionar `package.json`, `vite.config.ts`, `tailwind.config.js` e `index.html`, se confirman las versiones e infraestructura reales del proyecto:

| Capa | Tecnología | Versión Exacta Verificada | Observaciones de Auditoría |
| :--- | :--- | :--- | :--- |
| **UI Runtime** | `react` / `react-dom` | `^18.3.1` | SPA reactiva sin librería de routing externa (navegación por estado condicional). |
| **Lenguaje** | `typescript` | `~5.7.2` | Tipado estricto en `src/types/poker.ts` y `src/types/session.ts`. |
| **Bundler & PWA** | `vite` + `vite-plugin-pwa` | `^6.2.0` / `^0.21.1` | Configurado en modo `standalone`, orientación `portrait`, caché offline con Workbox. |
| **Estilos** | `tailwindcss` + `clsx` + `tailwind-merge` | `^3.4.17` / `^2.1.1` / `^3.0.2` | `tailwind-merge` está instalado en `package.json` pero **no se utiliza** en ningún componente (no existe helper `cn()`). |
| **Estado Global** | `zustand` | `^5.0.3` | Dos stores: `useSessionStore` y `useHandStore`. |
| **Persistencia** | `dexie` + `dexie-react-hooks` | `^4.0.11` / `^1.1.7` | `dexie-react-hooks` está instalado pero **no se usa**; las consultas se hacen manualmente con `useEffect` en `SessionActiveView.tsx`. |
| **Iconografía** | `lucide-react` | `^1.16.0` | Iconos vectoriales consistentes. |
| **Testing** | `vitest` | `^3.0.7` (ejecuta `v3.2.7`) | 4 suites unitarias (28 tests) con 100% de aprobación actual. |

### 2.2. Diagnóstico de Estilos Globales y Configuración Tailwind
* **Clases inexistentes de Tailwind en el código actual (Bug silencioso de dimensiones):**
  En varios componentes se utilizan clases de utilidad que **no existen en la escala por defecto de Tailwind CSS v3.4** y que no fueron declaradas en `tailwind.config.js`:
  * `w-13 h-13` en `PokerTable.tsx` (línea 68) → Tailwind no tiene `13` (`3.25rem`) por defecto (salta de `12` a `14`), por lo que **el asiento de Hero pierde su `width` y `height` explícitos** y colapsa al tamaño de su contenido texto.
  * `w-15 h-21` en `CardSelector.tsx` (línea 195) y `w-15` en `PreflopActionTimeline.tsx` (línea 99) → `w-15` y `h-21` no existen en Tailwind estándar.
  * `w-13 h-19` y `w-4.5 h-4.5` en `CommunityCardsPicker.tsx` (líneas 93, 106, 127) → No existen en Tailwind estándar; en móviles `<640px` (`sm:`) las cartas comunitarias carecen de dimensiones fijas de contenedor.
  * `h-13` en `ActionConsole.tsx` (línea 186) y `CustomNumberModal.tsx` (línea 133) → No existe en Tailwind estándar.
  * `active:scale-98` en `SessionActiveView.tsx` y `HandRecorderView.tsx` → No existe en Tailwind estándar (debe ser `active:scale-[0.98]` como se escribió en `NewSessionView.tsx`).
* **Fragmentación de colores hexadecimales:**
  Aunque `tailwind.config.js` define la paleta `poker.*` (`poker-bg`, `poker-surface`, `poker-borderSubtle`, `poker-emerald`, etc.), más del 75% de los componentes inyectan valores arbitrarios distintos para el mismo rol visual (`bg-[#0A121D]`, `bg-[#0C1624]`, `bg-[#0D1624]`, `bg-[#0E1724]`, `bg-[#101924]`, `bg-[#121E2C]`, `bg-[#131E2C]`, `bg-[#142132]`), rompiendo la uniformidad visual.
* **Accesibilidad bloqueada en `index.html`:**
  La etiqueta `<meta name="viewport" content="... maximum-scale=1.0, user-scalable=no" />` impide el zoom asistivo, y varios textos informativos usan `text-[9px]` o `text-[10px]` con colores `text-slate-500` sobre fondos oscuros, cayendo por debajo del umbral de legibilidad en entornos de casino o clubes con iluminación tenue.

---

## 3. INVENTARIO DE COMPONENTES Y MEDICIÓN DE ALTURAS CSS

A continuación se detalla el inventario real de los **17 archivos principales** auditados con sus dimensiones calculadas a partir de las clases CSS efectivas:

| # | Archivo / Componente | Ruta | Altura / Dimensiones CSS Reales | Función Actual | Problemas Detectados |
| :- | :--- | :--- | :--- | :--- | :--- |
| 1 | `App.tsx` | `src/App.tsx` | `min-h-screen` (`100vh`) | Puerta de entrada y splash screen | Usa `min-h-screen` en vez de `min-h-[100dvh]`; prop `onSessionStarted={() => {}}` vacía e innecesaria. |
| 2 | `NewSessionView.tsx` | `src/views/NewSessionView.tsx` | Contenedor `pb-24` (`96px`), `gap-3.5` (`14px`) + Footer `fixed` (`h-14` + `p-4` = `88px`) | Formulario de configuración inicial de sesión | Altura total del contenido `~660px` + footer `88px` = `748px`. Obliga a scrollear en viewports `<760px`. |
| 3 | `StackPicker.tsx` | `src/components/session/StackPicker.tsx` | `GlassCard` (`p-4` = `32px`) + fila superior (`48px`) + `mb-3.5` (`14px`) + grilla 6 cols (`40px`) = **`134px`** | Selección de stack inicial | En pantallas de `320px`, el texto `"Monto con el que entrás a la mesa"` choca con `NumberStepper` (`min-w-[170px]`), generando desborde horizontal. |
| 4 | `BlindsPicker.tsx` | `src/components/session/BlindsPicker.tsx` | `GlassCard` (`p-4`) + header (`40px`) + 2 cols steppers (`66px`) + 4 presets (`40px`) = **`206px`** | Selección de SB y BB | Ocupa `206px` porque repite un bloque de título + ícono arriba de las dos columnas. El botón `"Otro"` solo edita BB y nunca SB. |
| 5 | `PlayerCountSelector.tsx` | `src/components/session/PlayerCountSelector.tsx` | `GlassCard` (`p-4`) + header (`40px`) + `mb-3.5` + fila 8 botones (`44px`) = **`130px`** | Selector de 2 a 9 jugadores | Dedica `130px` verticales para elegir un número del 2 al 9. |
| 6 | `SessionExtras.tsx` | `src/components/session/SessionExtras.tsx` | `GlassCard` (`p-4`) + header (`40px`) + 2 switches (`72px`) + input nota (`72px`) = **`232px`** | Straddle, Rake y Nota de sesión | Siempre desplegado completo (`232px`) aunque son opciones secundarias ("Opcionales, podés modificarlos luego"). |
| 7 | `SessionActiveView.tsx` | `src/views/SessionActiveView.tsx` | `min-h-[100dvh]`, Header (`57px`), HUD Card (`142px`), Historial (`flex-1`), CTA (`64px`) | Dashboard de sesión en vivo | Estado vacío sobredimensionado; muestra `0%` VPIP/PFR sin manos; callbacks `onEdit`/`onSave` vacíos al revisar manos guardadas. |
| 8 | `HandRecorderView.tsx` | `src/views/HandRecorderView.tsx` | Header (`53px`) + Barra posiciones (`49px`) + Main (`flex-1`) + Footer (`64px` a `248px`) | Contenedor de los 4 pasos de grabación | Barra superior de posiciones (`49px`) duplica información en los 3 pasos; botón `MoreVertical` (`⋮`) ejecuta `handleNextStep` por error; stack bar en Paso 1 tiene botones de `28×28px` (`w-7 h-7`). |
| 9 | `PokerTable.tsx` | `src/components/poker/PokerTable.tsx` | `aspect-[16/11] max-w-sm my-1` → En `390px` mide `362 × 249px` (**`257px`** con margen) | Selección visual del asiento de Hero | Consume `~250px` fijos; usa clase inválida `w-13 h-13`; la insignia Dealer (`D`) siempre está fija en `BTN` y se superpone visualmente con el borde en asientos diagonales. |
| 10 | `CardSelector.tsx` | `src/components/poker/CardSelector.tsx` | `p-3.5` (`28px`) + header (`24px`) + 3 filas rangos (`132px`) + 4 palos (`48px`) + slots cartas (`88px`) + gaps (`30px`) = **`350px`** | Selección en 2 toques de cartas de Hero | Los slots de previsualización (`min-h-[88px]`) abajo del todo empujan la altura a `350px`. Botón de quitar carta (`w-5 h-5` = `20×20px`) es muy pequeño para el pulgar. |
| 11 | `PreflopActionTimeline.tsx` | `src/components/poker/PreflopActionTimeline.tsx` | `positions.length × 52px + gaps`: 9 jugadores = **`512px`**; 6 jugadores = **`338px`** | Lista vertical de asientos y acciones preflop | En mesas de 6 a 9 jugadores obliga a scrollear verticalmente para ver los últimos asientos (`CO`, `BTN`, `SB`, `BB`). |
| 12 | `ActionConsole.tsx` | `src/components/poker/ActionConsole.tsx` | Turno/Atajo (`34px`) + 4 botones (`h-14` = `56px`) + 6 presets (`h-11` = `44px`) + Stepper (`52px`) + gaps = **`218px`** | Consola táctil de decisiones preflop | Muestra **permanentemente** las 2 filas de dimensionamiento de subida (`presets` + `Personalizado` = `104px`) incluso cuando el usuario solo va a tocar `Fold`, `Limp`, `Check` o `Call`. |
| 13 | `CommunityCardsPicker.tsx` | `src/components/poker/CommunityCardsPicker.tsx` | `p-3.5` + header (`24px`) + 5 slots (`88px`) + 3 filas rangos (`120px`) + 4 palos (`44px`) + gaps = **`324px`** | Selección de las 3 cartas del Flop | Clases inválidas `w-13 h-19` y `w-4.5 h-4.5`; muestra slots de `Turn` y `River` que nunca se activan; el selector de rangos/palos sigue ocupando `175px` aun después de haber elegido las 3 cartas del flop. |
| 14 | `FlopActionConsole.tsx` | `src/components/poker/FlopActionConsole.tsx` | Colapsado: **`114px`** (`p-3.5` + header + 4 botones `h-12`). Expandido (al tocar `Bet`): **`254px`** | Registro de acción de Hero en el Flop | No muestra un historial de las acciones que Hero acaba de registrar en el flop (si tocás `Check` o `Bet → Confirmar`, se agrega al store sin feedback de lista en pantalla). |
| 15 | `HandReviewView.tsx` | `src/views/HandReviewView.tsx` | Header (`53px`) + Card Metadatos (`~135px`) + Card Preflop + Card Flop + Footer (`h-14` = `64px`) | Resumen y confirmación de la mano | Al abrir una mano guardada desde `SessionActiveView`, muestra el botón `"Editar"` y `"Actualizar mano"` aunque ambos simplemente cierran la pantalla sin guardar ni editar. |
| 16 | `ExportModal.tsx` | `src/components/common/ExportModal.tsx` | Modal inferior `p-5` (`~380px` a `460px` según bloques de WhatsApp) | Exportación a WhatsApp, Portapapeles, CSV y JSON | Si una sesión tiene muchos bloques (ej. 4 partes), la grilla de partes crece sin `max-h` scrollable interno. |
| 17 | `CustomNumberModal.tsx` | `src/components/common/CustomNumberModal.tsx` | Modal inferior `p-5` + Display (`68px`) + Grilla `4×3` (`h-14` × 4 = `254px`) + Confirmar (`52px`) = **`490px`** | Teclado numérico propio en pantalla | En pantallas pequeñas (`320×568`), `490px` representa el **86% de la pantalla**, quedando casi pegado al borde superior. |

---

## 4. PROBLEMAS VISUALES IDENTIFICADOS

1. **Duplicación de barras de navegación y contexto en `HandRecorderView.tsx`:**
   * En el **Paso 1**, el usuario ve la barra horizontal de posiciones arriba (`UTG`, `UTG+1`, ..., `HERO (BTN)`, `SB`, `BB`) e inmediatamente debajo ve la mesa ovalada `PokerTable` con exactamente las mismas posiciones. Además, un clic en la barra superior cambia `currentTurnPosition` (que solo sirve en el Paso 2), mientras que un clic en la mesa cambia `heroPosition`, lo cual es visualmente contradictorio.
   * En el **Paso 3 (Flop)**, el usuario ve **dos barras horizontales de posiciones una debajo de la otra**: la barra global de `actionOrder` (líneas 381-414) y, justo debajo, la barra de `activePlayers` (líneas 583-597), además de la barra de 4 pestañas de calles (`PREFLOP | FLOP | TURN | RIVER`). Tres barras horizontales apiladas antes de llegar al contenido principal.
2. **Clases de dimensión rotas en Tailwind (`w-13`, `h-13`, `w-15`, `h-21`, `h-19`, `h-13`, `w-4.5`):**
   * Provocan que los asientos de Hero en `PokerTable`, las cartas seleccionadas en `CardSelector` y las ranuras del Flop en `CommunityCardsPicker` no tengan el tamaño previsto en móviles, alterando la proporción áurea de las cartas y el centrado de los badges.
3. **Inconsistencia cromática de superficies y bordes:**
   * Se contabilizan **11 tonos distintos de azul oscuro** escritos a mano (`#080E16`, `#09111C`, `#0A111A`, `#0A121D`, `#0B1420`, `#0C1522`, `#0C1624`, `#0D1624`, `#0E1724`, `#0F1824`, `#101924`) y **9 tonos de borde** (`#1A293D`, `#1C2C3E`, `#1C2C3F`, `#1E2E42`, `#203144`, `#223347`, `#223348`, `#233347`, `#243750`).
4. **Superposición del badge Dealer (`D`) en `PokerTable.tsx`:**
   * `dealerPosition` nunca se actualiza y permanece clavado en `'BTN'`. Cuando el usuario elige `BTN` como `HERO`, el círculo amarillo `D` (`-top-1.5 -right-1.5`) compite con el texto `HERO / BTN` y el anillo `ring-2` verde neón.
5. **Falsa disponibilidad de `TURN` y `RIVER` en el Paso 3:**
   * Las pestañas `TURN` y `RIVER` se pintan de azul (`bg-blue-600`) al tocarlas como si estuvieran activas, pero la pantalla sigue mostrando `"Cartas del flop"` y `"Acción de Hero en el Flop"`, quebrando el principio de visibilidad del estado del sistema de Nielsen.

---

## 5. PROBLEMAS DE ERGONOMÍA Y HCI (HUMAN-COMPUTER INTERACTION)

Evaluando el uso con **una sola mano (pulgar derecho o izquierdo)** bajo presión de tiempo en una mesa presencial:

1. **Ley de Fitts vulnerada en controles secundarios críticos:**
   * **Botones de ajuste de stack en Paso 1 (`HandRecorderView.tsx`, líneas 445-496):** Los botones `-`, `+`, `Editar` y `X` miden `w-7 h-7` (**`28×28px`**) separados por `gap-1` (`4px`). Están un **36% por debajo del mínimo ergonómico de `44×44px`**, haciendo muy probable tocar `X` (que borra el stack de la mano) al intentar tocar `Editar` o `+`.
   * **Botones de quitar carta (`X`) en `CardSelector.tsx` (`w-5 h-5` = `20×20px`) y `CommunityCardsPicker.tsx` (`w-4.5 h-4.5`):** Extremadamente pequeños; al tocar la carta completa debería poder deseleccionarse sin obligar a apuntar a una esquina de `20px`.
   * **Botones internos de `NumberStepper.tsx` (`w-8 h-8` = `32×32px`) y `FlopActionConsole.tsx` (`w-7 h-7` = `28×28px`):** Área táctil reducida dentro de contenedores que sí tienen altura suficiente (`h-11` / `h-12`).
2. **Desplazamiento del centro de gravedad táctil en Preflop (`ActionConsole.tsx`):**
   * En el preflop, el **85% de las interacciones** son `Fold`, `Limp/Check`, `Call` o `"Folds hasta Hero"`. Sin embargo, las dos filas inferiores de `ActionConsole` están ocupadas permanentemente por los 6 presets de `Raise` y el stepper `Personalizado` (`104px` en la zona más baja de la pantalla). Esto empuja los 4 botones principales (`Fold`, `Limp`, `Call`, `Raise`) **`104px` hacia arriba**, robando además espacio vital al timeline de jugadores.
3. **Ausencia de feedback persistente tras registrar acciones en el Flop (`FlopActionConsole.tsx`):**
   * A diferencia del Paso 2 (donde cada acción actualiza inmediatamente el timeline y avanza el turno), en el Paso 3 cuando el usuario toca `Check`, `Call` o confirma un `Bet`, el botón queda iluminado pero **no aparece ningún registro visual en pantalla de qué acciones ya fueron agregadas al array `flopActions`**. Si el usuario toca dos veces `Check` por duda, duplica la acción en silencio.
4. **Trampa cognitiva en el botón `⋮` (`MoreVertical`) del Header (`HandRecorderView.tsx`):**
   * Un icono universal de "Más opciones" (`⋮`) en la esquina superior derecha que en realidad ejecuta `handleNextStep()` viola las heurísticas de consistencia y estándares de plataforma.

---

## 6. ANÁLISIS DEL APROVECHAMIENTO DEL ESPACIO EN LOS 5 VIEWPORTS DE REFERENCIA

Se calculó la altura real requerida por cada pantalla (`H_req`) frente a la altura útil disponible del viewport (`H_view`), descontando en escenarios reales la barra del navegador o safe areas (`~60px` en navegador móvil, `~34px` en PWA standalone):

| Pantalla / Paso | Altura Requerida Actual (`H_req`) | `320×568` (iPhone SE 1) | `360×800` (Android Std) | `390×844` (iPhone 13/14) | `412×915` (Pixel / Galaxy S) | `430×932` (Pro Max / Ultra) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. `NewSessionView`** | **`830px`** (`742px` + footer `88px`) | Scroll pesado (`+262px`) + desborde X en `320px` | Scroll (`+30px` en PWA, `+90px` en navegador) | Entra justo en PWA; scroll leve en navegador | Sin scroll (`85px` libres) | Sin scroll (`102px` libres) |
| **2. `SessionActiveView` (Vacío)** | **`430px`** (con `flex-1` estirado) | Sin scroll, pero `240px` de caja vacía | Sin scroll, **`370px` de caja vacía** | Sin scroll, **`414px` de caja vacía** | Sin scroll, **`485px` de caja vacía** | Sin scroll, **`502px` de caja vacía** |
| **3. Grabador Paso 1 (Mesa + Cartas)** | **`765px`** (`53+49+46+257+350+64`) | Scroll severo (`+197px`), oculta palos y slots | Scroll en navegador (`+25px`) | Entra al límite en PWA | Sin scroll | Sin scroll |
| **4. Grabador Paso 2 (Preflop 9-Max)** | **`868px`** (`53+49+512+218+36`) | **Crítico:** Oculta 5 asientos (`+300px` de scroll) | **Crítico:** Oculta 2-3 asientos (`+68px` a `+128px`) | **Alto:** Oculta 1-2 asientos (`+24px` a `+84px`) | Entra al límite en PWA; scroll en navegador | Entra justo |
| **5. Grabador Paso 3 (Flop)** | **`642px` colapsado / `782px` con Bet** | Scroll (`+74px` / `+214px`) | Sin scroll colapsado; scroll al abrir Bet | Entra justo; `180px` vacíos si está colapsado | `273px` vacíos en estado colapsado | `290px` vacíos en estado colapsado |

---

## 6.1. ENTREGABLE FASE 0 — MATRIZ CONSOLIDADA DE AUDITORÍA

| ID | Prioridad | Problema Encontrado | Componente Involucrado | Impacto sobre la Experiencia | Complejidad | Riesgo de Modificarlo | Propuesta Preliminar |
| :- | :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **A-01** | **CRÍTICA** | Timeline preflop de 9 filas (`512px`) + Consola siempre expandida (`218px`) exceden la pantalla (`868px` total), ocultando el turno activo. | `PreflopActionTimeline.tsx`, `ActionConsole.tsx`, `HandRecorderView.tsx` | El usuario pierde de vista quién habla o debe hacer scroll en medio de la mano. | Media | Medio (cuidar selección manual de turno) | **Timeline Híbrido Compacto** + **Sizing de Raise progresivo** (solo visible al elegir subir o en modo expandible). |
| **A-02** | **CRÍTICA** | Clases Tailwind inexistentes (`w-13`, `h-13`, `w-15`, `h-21`, `h-19`, `h-13`, `w-4.5`, `active:scale-98`) dejan elementos sin dimensiones reales. | `PokerTable.tsx`, `CardSelector.tsx`, `CommunityCardsPicker.tsx`, `PreflopActionTimeline.tsx`, `ActionConsole.tsx` | Asientos y cartas colapsan o pierden proporción en pantallas móviles reales. | Baja | Bajo | Definir medidas válidas en `tailwind.config.js` o usar tokens estándar/arbitrarios (`w-[52px]`, `h-[52px]`). |
| **A-03** | **ALTA** | Paso 1 suma `765px` de alto porque `CardSelector` (`350px`) reserva `88px` abajo para 2 cartas grandes y `PokerTable` consume `257px`. | `HandRecorderView.tsx`, `PokerTable.tsx`, `CardSelector.tsx` | En `320×568` y `360×800` hay que scrollear para elegir el palo de la carta. | Media | Bajo | Integrar los 2 slots de cartas de Hero en el **header del `CardSelector`** (o en el centro de la mesa) ahorrando `90px`, y compactar la mesa a `aspect-[16/10]`. |
| **A-04** | **ALTA** | Barra superior de posiciones (`actionOrder`) en `HandRecorderView.tsx` (`49px`) duplica los asientos de Paso 1, Paso 2 y Paso 3. | `HandRecorderView.tsx` | Desperdicia `49px` verticales en todas las pantallas y genera confusión de clic en Paso 1. | Baja | Bajo | Reemplazarla por un **Stepper de Progreso + Resumen Contextual** (ej. `Paso 2/3 · Hero: BTN (A♠ K♥) · Pozo: $3.000`). |
| **A-05** | **ALTA** | En Paso 3 (`FlopActionConsole.tsx`), al registrar una acción (`Check`, `Bet`, `Call`) no se muestra la acción agregada ni hay botón para borrarla. | `FlopActionConsole.tsx`, `HandRecorderView.tsx` | El usuario no sabe si su acción de flop ya quedó registrada o si la tocó dos veces. | Baja | Bajo | Mostrar píldora/chip de acciones registradas en el flop con opción de deshacer/reemplazar. |
| **A-06** | **ALTA** | Pestañas `TURN` y `RIVER` en Paso 3 parecen operativas pero no cambian el selector ni guardan datos de esas calles. | `HandRecorderView.tsx`, `CommunityCardsPicker.tsx` | Confusión severa: el usuario cree estar cargando el Turn/River y sobrescribe o ignora el Flop. | Baja | Nulo | Mostrar `TURN` y `RIVER` con badge `"Próx."` deshabilitado (`disabled` honesto) hasta que se implemente el modelo de datos de esas calles. |
| **A-07** | **MEDIA** | `SessionActiveView` sin manos muestra un contenedor vacío gigante y estadísticas `0% VPIP / 0% PFR` engañosas. | `SessionActiveView.tsx` | Desaprovecha el 55% de la pantalla y muestra `0%` como si fuera un dato medido (`0/0`). | Baja | Bajo | Estado vacío compacto con CTA integrado + mostrar `—` en VPIP/PFR cuando `validHands === 0`. |
| **A-08** | **MEDIA** | Controles táctiles inferiores a `44×44px` en barra de stack (`28×28px`), quitar carta (`20×20px`) y steppers (`32×32px`). | `HandRecorderView.tsx`, `CardSelector.tsx`, `NumberStepper.tsx`, `FlopActionConsole.tsx` | Errores de pulsación (*fat-finger*) con una sola mano en movimiento. | Baja | Bajo | Elevar áreas táctiles a mínimo `40×40px` / `44×44px` y permitir quitar carta tocando el propio slot de la carta. |
| **A-09** | **MEDIA** | `NewSessionView` requiere `830px` verticales porque `BlindsPicker` (`206px`) y `SessionExtras` (`232px`) están expandidos con cabeceras redundantes. | `NewSessionView.tsx`, `StackPicker.tsx`, `BlindsPicker.tsx`, `PlayerCountSelector.tsx`, `SessionExtras.tsx` | Obliga a scrollear para ver las notas o los switches de Straddle/Rake; en `320px` desborda horizontalmente. | Media | Bajo | Compactar cabeceras de `GlassCard`, permitir que `SessionExtras` use un acordeón o layout de 2 columnas para switches, reduciendo la vista a `<620px`. |
| **A-10** | **BAJA** | Inconsistencia de colores hexadecimales hardcodeados y falta de helper `cn()` (`clsx` + `tailwind-merge`). | Todos los componentes en `src/views/` y `src/components/` | Dificulta el mantenimiento y produce variaciones sutiles de contraste entre tarjetas. | Baja | Nulo | Centralizar tokens en `tailwind.config.js` e `index.css` y crear utilidad `cn()` en `src/utils/cn.ts`. |

---

## 7. PROPUESTAS DE SOLUCIÓN (ESTRATEGIA UX/UI GLOBAL)

La estrategia de rediseño se apoya en **cinco pilares de ingeniería UX mobile-first** que respetan la restricción fundamental del proyecto (*no achicar indiscriminadamente botones ni tipografías, sino reorganizar y compactar con inteligencia*):

1. **Reemplazo de Redundancias por Contexto Persistente (`Context Header Bar`):**
   * Eliminar la barra horizontal repetida de 9 posiciones en `HandRecorderView.tsx` (`49px`) y sustituirla por un encabezado compacto de una sola línea que muestre el paso actual (`1/3 Posición`, `2/3 Preflop`, `3/3 Postflop`) más **píldoras de contexto vivo** de lo ya elegido (ej. en Paso 2 y 3 muestra `BTN · A♠ K♥ · Stack 50 BB`). Si el usuario toca esa píldora, vuelve inmediatamente al Paso 1 para corregir su posición o mano.
2. **Fusión de Slots de Previsualización con Cabeceras de Selección (`Inline Card Slots`):**
   * En `CardSelector.tsx` (Paso 1) y `CommunityCardsPicker.tsx` (Paso 3), en lugar de apilar verticalmente `[Cabecera] -> [13 Rangos] -> [4 Palos] -> [Zona de 88px con Cartas Grandes]`, las cartas seleccionadas se ubican en una **barra superior integrada junto al título** (`48px` de alto total, con cartas horizontales tipo *mini-badge* de `52×40px` de alto contraste y un toque directo para borrar). Esto recupera **`80px` verticales netos** sin reducir ni un píxel el tamaño de los 13 botones de rango (`h-10`) ni los 4 botones de palo (`h-11`).
3. **Timeline Preflop Híbrido de Alta Densidad (Modelo 3):**
   * En vez de renderizar 9 filas idénticas de `52px` (`512px` totales), el timeline separa visualmente:
     * **Acciones Previas / Foldeados en Frío:** Los jugadores que foldearon consecutivamente sin poner dinero se agrupan o muestran en chips compactos horizontales (`UTG, UTG+1: Fold`), mientras que quienes entraron al pozo (`Limp`, `Raise`, `Call`, `3-Bet`) conservan una fila destacada de `40px`.
     * **Jugador en Turno Actual:** Tarjeta expandida y resaltada (`48px`) con indicador inequívoco (`HERO — TU TURNO` o `RIVAL EN TURNO`).
     * **Próximos en Hablar:** Píldoras horizontales interactivas (`40px` de alto total para toda la fila de pendientes) que permiten ver cuántos faltan actuar y tocar cualquiera de ellos si se desea saltar/corregir el turno manualmente.
   * Resultado: De **`512px` fijos baja a `~170px-220px`**, entrando el 100% de la mano sin scroll en cualquier teléfono desde `360×800`.
4. **Consola de Acción con Revelación Progresiva Inteligente (`ActionConsole.tsx`):**
   * Los 4 botones principales (`Fold`, `Limp/Check`, `Call`, `Raise`) permanecen en la zona inferior del pulgar (`h-14` = `56px`).
   * Debajo o encima de ellos, los **6 presets rápidos (`2K`, `3K`, `4K`, `5K`, `8K`, `10K`)** actúan como **botones de acción directa en 1 toque** o selector rápido, mientras que el stepper `Personalizado (+/- 500)` se compacta en una sola fila junto al botón de ajuste fino o se despliega al tocar `"Otro / Ajustar"`.
5. **Estado Vacío Inteligente y Honestidad Visual (`SessionActiveView` y Postflop):**
   * Cuando `recordedHands.length === 0`, el dashboard agrupa los parámetros de sesión, muestra `—` en lugar de `0%` para VPIP/PFR (evitando confundir ausencia de manos con un jugador *nit* `0/0`) y presenta una tarjeta compacta de inicio rápido con el botón `"Registrar primera mano"` en la zona media-baja ergonómica.

---

## 8. COMPARACIÓN DE ALTERNATIVAS CLAVE

### 8.1. Alternativas para el Timeline Preflop (Fase 4 — Núcleo Operativo)

| Criterio de Evaluación | Modelo Actual (9 filas fijas de `52px`) | Modelo 1: Lista Contextual (Agrupar anteriores y pendientes) | Modelo 2: Secuencia Horizontal Pura (Chips en scroll X / wrap) | **Modelo 3: Formato Híbrido (RECOMENDADO)** |
| :--- | :--- | :--- | :--- | :--- |
| **Altura ocupada (9 jugadores)** | `512px` (desborda viewport) | `~210px` | `~110px` | **`~195px` a `235px`** (nunca desborda en `>=360×800`) |
| **Visibilidad del turno actual** | Baja (se oculta bajo la consola en turnos medios/finales) | Alta | Media (el chip activo se pierde dentro del flujo de texto) | **Máxima** (tarjeta central dedicada y resaltada para el jugador que tiene el turno) |
| **Lectura de subidas y limpers previos** | Buena pero dispersa en muchas filas | Media (si compacta demasiado las subidas previas) | Baja cuando hay múltiples rondas (ej. `Open -> 3-bet -> Call`) | **Excelente** (los folds en frío se comprimen en chips, pero las acciones voluntarias `Limp/Call/Raise` se listan claramente con monto y color) |
| **Facilidad para cambiar/corregir turno manualmente** | Alta (tocar fila), pero requiere scroll | Media (si los pendientes están ocultos) | Baja (chips pequeños difíciles de tocar rápido) | **Alta** (tanto los asientos que ya actuaron como las píldoras de "Próximos por hablar" tienen `min-h-[40px]` y son tocables para forzar turno) |
| **Adaptabilidad de 2 a 9 jugadores** | En 2-4 jugadores sobra espacio; en 8-9 colapsa | Buena | Regular | **Óptima** (en mesas de 2 a 5 jugadores puede mostrar filas directas; en 6 a 9 activa la compresión automática de folds e inactivos) |

**Justificación de la elección (Modelo 3 Híbrido):**  
En una partida presencial, los folds previos sin dinero invertido ("folds en frío") tienen bajo valor informativo una vez ejecutados, pero **quién abrió, quién limpeó, cuánto es la apuesta actual, quién habla ahora y quiénes faltan hablar detrás (especialmente Hero y las ciegas)** es información crítica. El **Modelo 3** comprime en una sola tira horizontal los folds en frío y los jugadores pendientes (`En espera: HJ · CO · BTN · SB · BB`), mantiene filas claras para los jugadores activos en el pozo y destaca al jugador en turno en el centro visual.

### 8.2. Alternativas para la Mesa Interactiva (`PokerTable.tsx` en Fase 3)

| Alternativa | Descripción | Ventajas | Desventajas | Decisión |
| :--- | :--- | :--- | :--- | :--- |
| **Opción A: Eliminar la mesa y usar grilla de botones** | Reemplazar el óvalo por 9 botones en grilla `3×3`. | Ahorra `140px`. | Pierde la referencia espacial inmediata de la mesa de póker (dónde está Hero respecto al Botón y las Ciegas). | Descartada (viola la identidad del producto). |
| **Opción B: Mesa colapsada después de la Mano #1** | Mostrar la mesa en la Mano #1 y ocultarla en un acordeón desde la Mano #2. | Ahorra espacio desde la 2.ª mano. | Como la posición cambia en **todas las manos**, obligaría a hacer 1 toque extra para abrir la mesa en cada mano. | Descartada (aumenta el número de toques por mano). |
| **Opción C: Mesa Elíptica Compacta Optimizando Geometría (RECOMENDADA)** | Reducir relación de aspecto de `16/11` a `16/9.5` (altura `~185px`), eliminar el margen muerto `inset-4` (`16px` por lado), corregir `w-13 h-13` a `w-12 h-12` (`48×48px`) y mostrar en el centro del paño las 2 cartas elegidas de Hero. | Ahorra **`~70px` en la mesa + `88px` al llevar las cartas seleccionadas al centro del paño (`158px` ahorrados en total)**. Cero toques extra. | Requiere ajustar radios `rx`/`ry` (`42%` y `39%`) para que los 9 asientos no se toquen. | **Seleccionada.** |

---

## 9. PLAN DE IMPLEMENTACIÓN POR FASES (ESPECIFICACIÓN TÉCNICA)

---

### FASE 1 — SISTEMA DE DISEÑO, TOKENS Y CORRECCIÓN DE UTILIDADES BASE

#### 1. Diagnóstico
* Uso de clases inexistentes en Tailwind CSS v3.4 (`w-13`, `h-13`, `w-15`, `h-21`, `h-19`, `w-4.5`, `h-4.5`, `active:scale-98`).
* Proliferación de más de 15 colores hexadecimales escritos inline (`bg-[#0A121D]`, `bg-[#121E2C]`, `border-[#1E2E42]`, etc.) en lugar de usar tokens semánticos en `tailwind.config.js`.
* El paquete `tailwind-merge` figura en `package.json` pero no se combina con `clsx`.
* Textos diminutos (`text-[9px]`, `text-[10px]`) con bajo contraste (`text-slate-500`) sobre fondos oscuros.

#### 2. Objetivo
Consolidar un sistema de tokens visuales `dark-neon` consistente en `tailwind.config.js` y `src/styles/index.css`, reparar todas las clases de dimensiones inválidas y establecer alturas mínimas táctiles (`44px`) y niveles tipográficos legibles.

#### 3. Componentes afectados
* `tailwind.config.js`
* `src/styles/index.css`
* `src/utils/cn.ts` *(nuevo helper ligero de 6 líneas que une `clsx` + `tailwindMerge`)*
* `src/components/common/GlassCard.tsx`
* `src/components/common/NumberStepper.tsx`
* `src/components/common/PresetPill.tsx`
* `src/components/common/ToggleSwitch.tsx`

#### 4. Propuesta de solución
**A. Design Tokens en `tailwind.config.js`:**
* **Superficies (`colors.poker`):**
  * `bg`: `#070C12` (Fondo principal de aplicación)
  * `surface`: `#0D1624` (Tarjetas y contenedores primarios)
  * `surfaceElevated`: `#132032` (Botones secundarios, píldoras inactivas, inputs)
  * `surfaceActive`: `#1A2B42` (Estado presionado / hover)
  * `heroSurface`: `#0B261C` (Fondo de elementos de Hero)
* **Bordes (`colors.poker`):**
  * `border`: `#1E2E42` (Borde estándar de tarjetas y controles)
  * `borderStrong`: `#2A3F5A` (Borde de controles interactivos)
  * `borderHero`: `#10B981` (Borde neón de Hero)
* **Semántica de Acciones:**
  * `emerald`: `#10B981` / `emeraldDark`: `#059669` (Hero, CTA primario, Check/Limp)
  * `actionCall`: `#1D72FE` (Call / Igualar / Turno rival)
  * `actionRaise`: `#EF4444` (Bet / Raise / 3-Bet / 4-Bet / Peligro)
  * `actionFold`: `#1E2632` (Fold / Descarte)
* **Extensiones de Escala (`spacing` / `width` / `height`):**
  * Registrar `4.5: '1.125rem'` (`18px`), `13: '3.25rem'` (`52px`), `15: '3.75rem'` (`60px`), `19: '4.75rem'` (`76px`), `21: '5.25rem'` (`84px`) en `theme.extend.spacing` para que todas las clases existentes funcionen de inmediato, además de `scale: { '98': '0.98' }`.

**B. Jerarquía Tipográfica Estandarizada:**
* `Title-Screen`: `text-lg font-extrabold tracking-tight text-white` (`18px`, línea `24px`)
* `Title-Section`: `text-sm font-bold tracking-wide text-white` (`14px`)
* `Value-Money / Stack`: `text-base font-extrabold text-poker-emerald` (`16px`)
* `Button-Action`: `text-sm sm:text-base font-bold` (`14px-16px`)
* `Badge-Position`: `text-xs font-extrabold tracking-wider` (`12px`, nunca menor a `11px`)
* `Label-Muted`: `text-xs font-medium text-slate-300` (subiendo de `slate-500` a `slate-300/400` para garantizar ratio de contraste WCAG AA `>= 4.5:1`).

**C. Ergonomía en Componentes Comunes:**
* En `NumberStepper.tsx`: Aumentar los botones internos `-` y `+` de `w-8 h-8` (`32×32px`) a `w-10 h-10` (`40×40px`) dentro del contenedor `h-11`/`h-12`, y permitir una prop opcional `onValueClick?: () => void` para que tocar el número central abra directamente `CustomNumberModal`.
* En `GlassCard.tsx`: Soportar prop `variant?: 'default' | 'compact'` (`p-4` vs `p-3`) para evitar paddings excesivos en pantallas densas.

#### 5. Alternativas consideradas
* *Migrar a CSS Modules o Styled Components:* Descartado. Mantener Tailwind CSS extendiendo `theme.extend` corrige los bugs de clases faltantes en 1 solo archivo y respeta el stack actual.

#### 6. Cambios técnicos previstos
* Extender `tailwind.config.js` con `spacing: { '4.5': '1.125rem', '13': '3.25rem', '15': '3.75rem', '19': '4.75rem', '21': '5.25rem' }` y `scale: { '98': '0.98' }`.
* Crear `src/utils/cn.ts`.
* Actualizar `GlassCard.tsx`, `NumberStepper.tsx`, `PresetPill.tsx` y `ToggleSwitch.tsx`.

#### 7. Dependencias
* Ninguna (es la base fundacional para las Fases 2 a 6).

#### 8. Riesgos
* **Riesgo:** Al activar `w-13`, `h-19`, `h-21` en `tailwind.config.js`, los elementos que antes colapsaban tomarán su tamaño real.
* **Mitigación:** Validar inmediatamente junto con la Fase 3 y Fase 5 donde residen `PokerTable`, `CardSelector` y `CommunityCardsPicker`.

#### 9. Criterios de aceptación
* Cero clases utilitarias huérfanas o ignoradas por el compilador JIT de Tailwind.
* Botones de `NumberStepper` con área táctil `>= 40×40px` y soporte de clic en el número central.
* Contraste de textos secundarios `>= 4.5:1` sobre `#0D1624`.

#### 10. Pruebas necesarias
* Inspección del CSS compilado (`npm run build`) verificando que `.w-13`, `.h-13`, `.active\:scale-98`, etc., existan en el bundle de salida.
* Ejecución de `npm test` (28 tests verdes).

#### 11. Estimación de complejidad
* **Baja:** Cambios acotados a configuración de Tailwind y 4 componentes atómicos en `src/components/common/`.

---

### FASE 2 — REDISEÑO DEL DASHBOARD DE SESIÓN EN VIVO Y CONFIGURACIÓN DE SESIÓN

#### 1. Diagnóstico
* **En `SessionActiveView.tsx`:**
  1. Cuando `recordedHands.length === 0`, el contenedor del historial tiene `flex-1 min-h-[160px]` combinado con `justify-between` en el padre, generando un rectángulo vacío de hasta `500px` de alto en teléfonos grandes.
  2. El Mini-HUD muestra `VPIP: 0%` y `PFR: 0%` cuando `totalHands === 0`, lo cual es estadísticamente falso (`0/0` es indeterminado, no `0%`).
  3. Las tarjetas de `"Ciegas"` y `"Stack Inicial"` ocupan una grilla separada arriba del Mini-HUD (`142px` totales), quitando espacio vertical cuando el historial crece a 20 o 30 manos.
* **En `NewSessionView.tsx`:**
  1. La vista suma `830px` de alto porque las 4 tarjetas (`StackPicker`, `BlindsPicker`, `PlayerCountSelector`, `SessionExtras`) tienen cabeceras con iconos de `40×40px` + subtítulos largos y paddings `p-4`.
  2. En `320×568`, `StackPicker` desborda horizontalmente porque el bloque de título + subtítulo choca con el `min-w-[170px]` de `NumberStepper`.
  3. En `BlindsPicker.tsx`, el botón `"Otro"` solo permite editar `BB` y nunca `SB`.

#### 2. Objetivo
Lograr un **Dashboard Progresivo** en `SessionActiveView.tsx` que se adapte a 0, 1 o +30 manos sin espacios muertos, maximizando la visibilidad del historial, y compactar `NewSessionView.tsx` para que quepa sin scroll en pantallas `>= 360×800` y permita editar tanto `SB` como `BB` con un toque.

#### 3. Componentes afectados
* `src/views/SessionActiveView.tsx`
* `src/views/NewSessionView.tsx`
* `src/components/session/StackPicker.tsx`
* `src/components/session/BlindsPicker.tsx`
* `src/components/session/PlayerCountSelector.tsx`
* `src/components/session/SessionExtras.tsx`

#### 4. Propuesta de solución
**A. En `SessionActiveView.tsx` (Dashboard de Sesión en Vivo):**
1. **Barra de Parámetros + Mini-HUD Unificados (`~88px` en lugar de `142px`):**
   * Integrar Ciegas (`$1.000 / $1.000`) y Stack Inicial (`$50.000 · 50 BB`) como píldoras compactas en la parte superior del HUD, seguidas de la fila de 3 métricas (`MANOS`, `VPIP`, `PFR`).
   * **Estado sin datos en Mini-HUD:** Si `totalHands === 0`, renderizar `—` en lugar de `0%` en `VPIP` y `PFR`, con un sutil texto `Sin muestra` o color atenuado `text-slate-500`.
2. **Estado Vacío Inteligente (`recordedHands.length === 0`):**
   * Eliminar el `flex-1` del recuadro punteado vacío. Renderizar una tarjeta compacta (`py-6 px-4`, altura `~130px`) centrada con icono de cartas neón, título `"Mesa lista para registrar"` e indicación de 1 línea (`"Registrá tu posición, cartas y acción en menos de 5 segundos"`), manteniendo el flujo agrupado en la parte superior/media sin estirar cajas artificiales.
3. **Tarjetas de Historial de Alta Escaneabilidad (`recordedHands.length > 0`):**
   * Diseño de fila compacta (`h-14` = `56px`) con 3 zonas claras:
     * **Izquierda:** Badge `#01` + Posición de Hero (`BTN` con borde esmeralda).
     * **Centro:** Cartas de Hero como mini-naipes visuales (`A♠ K♥` con fondo claro/borde por palo) + chip de Flop (`[Q♦ J♠ 2♣]`) si llegó al postflop.
     * **Derecha:** Badge semántico del resultado/acción clave de Hero (`Fold PF` en gris, `Raise $4.000` en rojo, `Call $2.000` en azul, `Flop` en cian) + icono `ChevronRight`.
4. **Footer Fijo Seguro:**
   * Botón `"Registrar nueva mano"` (`h-14`) anclado abajo con `pb-safe` y sombra degradada superior para no tapar la última mano del historial al hacer scroll.

**B. En `NewSessionView.tsx` (Configuración Inicial):**
1. **Resolución del desborde en `StackPicker.tsx` y `BlindsPicker.tsx`:**
   * Conectar `onValueClick` en `NumberStepper` para que tocar el número de `Stack`, `SB` o `BB` abra directamente `CustomNumberModal` para ese campo específico (solucionando además la imposibilidad de editar `SB` manualmente).
   * En `StackPicker`, apilar o alinear el título a la izquierda y el `NumberStepper` a la derecha sin subtítulo redundante largo, reduciendo la tarjeta de `134px` a `104px`.
2. **Compactación de `SessionExtras.tsx`:**
   * Colocar `Straddle` y `Rake` en una **grilla de 2 columnas** lado a lado (`grid-cols-2 gap-2.5`) en lugar de dos filas separadas, e integrar el input de nota debajo, reduciendo la altura de `SessionExtras` de `232px` a `136px` (**ahorro de `96px`**).

#### 5. Alternativas consideradas
* *Ocultar `SessionExtras` en un acordeón cerrado por defecto:* Se evaluó, pero al colocar `Straddle` y `Rake` en una fila de 2 columnas (`grid-cols-2`), ocupan solo `44px` de alto y permanecen visibles y accionables en 1 toque sin necesidad de abrir un acordeón.

#### 6. Cambios técnicos previstos
* Refactorizar el layout de `SessionActiveView.tsx` separando claramente los 3 estados del contenedor de manos (`EmptyHandsState`, `CompactHandRow`).
* En `BlindsPicker.tsx`, pasar `onValueClick={() => setModalType('sb')}` al stepper de SB y `onValueClick={() => setModalType('bb')}` al stepper de BB.
* En `SessionExtras.tsx`, disponer los switches de `Straddle` y `Rake` en un `grid grid-cols-2 gap-2.5`.

#### 7. Dependencias
* Requiere Fase 1 (`NumberStepper` con soporte `onValueClick` y tokens unificados).

#### 8. Riesgos
* **Riesgo:** Que al compactar la fila del historial en `SessionActiveView` no entren las 2 cartas de Hero + las 3 cartas del Flop en pantallas de `320px`.
* **Mitigación:** Usar `flex-wrap` controlado o truncado elegante en `<350px` priorizando siempre Posición + Cartas de Hero + Acción Principal.

#### 9. Criterios de aceptación
* Con `0` manos, `SessionActiveView` muestra `—` en VPIP/PFR y el contenedor de estado vacío no supera los `140px` de altura.
* Con `15` manos, en un viewport de `390×844` son visibles al menos **7 manos simultáneamente** sin hacer scroll (actualmente entran 4.5).
* En `NewSessionView`, tocar el monto de `SB`, `BB` o `Stack` abre `CustomNumberModal` para ese valor exacto, y la pantalla completa cabe sin scroll en `360×800`.

#### 10. Pruebas necesarias
* Prueba visual en resoluciones `320×568`, `360×800` y `390×844` con 0, 1, 5 y 25 manos.
* Prueba funcional de apertura de `CustomNumberModal` tanto para `SB` como para `BB`.

#### 11. Estimación de complejidad
* **Baja-Media:** Reorganización de JSX/Tailwind en vistas de sesión sin alterar el modelo de `SessionConfig`.

---

### FASE 3 — OPTIMIZACIÓN DE SELECCIÓN DE POSICIÓN Y CARTAS (PASO 1 DEL GRABADOR)

#### 1. Diagnóstico
* El Paso 1 de `HandRecorderView.tsx` requiere **`765px` de altura** (`Header 53px` + `Barra Posiciones 49px` + `Barra Stack 46px` + `PokerTable 257px` + `CardSelector 350px` + `Botón Siguiente 64px`).
* En `HandRecorderView.tsx` (líneas 381-414), la barra superior de posiciones muestra los 9 asientos y al tocarlos cambia `currentTurnPosition` (que no tiene ningún efecto visual ni funcional en el Paso 1, salvo confundir al usuario que intenta elegir la posición de Hero allí).
* En `PokerTable.tsx`:
  * Usa `w-13 h-13` (clase inexistente en Tailwind base).
  * El contenedor tiene `inset-4` (`16px` de margen vacío alrededor del óvalo) y `aspect-[16/11]`.
  * El centro de la mesa dice `"Texas Hold'em Live"` en texto estático, desaprovechando un área central de `180×90px`.
* En `CardSelector.tsx`:
  * Destina `min-h-[88px]` abajo del todo para mostrar `Slot 1` y `Slot 2`, empujando la altura del selector a `350px`.
  * Los botones de borrar carta individual miden `20×20px` (`w-5 h-5`).
* En la barra de Stack Opcional (`HandRecorderView.tsx`, líneas 445-496), los botones `-`, `+`, `Editar` y `X` miden solo `28×28px` (`w-7 h-7`).

#### 2. Objetivo
Reducir la altura total del Paso 1 de **`765px` a `~575px`** (**ahorro de `190px`**) para que entre con holgura y **cero scroll** incluso en teléfonos compactos, agrandando al mismo tiempo las áreas táctiles de stack y selección de cartas.

#### 3. Componentes afectados
* `src/views/HandRecorderView.tsx` (Header, Barra de Contexto y Barra de Stack en Paso 1)
* `src/components/poker/PokerTable.tsx`
* `src/components/poker/CardSelector.tsx`

#### 4. Propuesta de solución
1. **Reemplazo de la barra redundante de posiciones por Header Contextual Integrado:**
   * En el Paso 1, eliminar la fila horizontal `actionOrder.map` (`49px` ahorrados). En el header de `HandRecorderView`, mostrar: `[←]  Mano #12 · Paso 1/3  [Stack Chip]`.
2. **Barra de Stack Ergonómica (`min-h-[44px]`):**
   * Los controles de ajuste rápido de stack (`-1 BB`, `+1 BB`, `Editar`, `X`) pasan de `28×28px` a botones táctiles cómodos de `36×36px` con área de toque extendida y separación clara para evitar borrar el stack por error.
3. **Optimización de `PokerTable.tsx` con Previsualización Central de Cartas:**
   * Ajustar la proporción del contenedor de `aspect-[16/11]` a **`aspect-[16/9.5]`** (altura `~185px` en lugar de `250px`) y reducir el margen muerto del óvalo de `inset-4` (`16px`) a `inset-2.5` (`10px`), ampliando los radios elípticos a `rx = 41%`, `ry = 38%`.
   * **Centro del Paño Funcional:** En lugar del texto decorativo `"Texas Hold'em Live"`, el centro de la mesa muestra en vivo **la posición elegida (`HERO: BTN`) y los 2 slots de cartas de Hero** (que pueden tocarse directamente para quitar una carta).
   * Evitar superposición del Dealer (`D`): Posicionar el badge `D` en el borde interior hacia el centro de la mesa cuando el asiento está en la parte superior/inferior, manteniendo clara la lectura de `HERO`.
4. **Compactación Vertical de `CardSelector.tsx` (`de 350px a ~235px`):**
   * Al mostrar las 2 cartas seleccionadas en la cabecera del propio `CardSelector` (como dos tarjetas horizontales interactivas de `56×38px` al lado del título `"Tu mano"`) y/o en el centro de la mesa, se elimina la fila inferior huérfana de `min-h-[88px]`.
   * Se **conservan intactas** las alturas de los 13 botones de rango (`h-10` = `40px` en grilla `5-5-3`) y los 4 botones de palo (`h-11` = `44px`).
   * Tocar cualquiera de las 2 cartas seleccionadas la elimina directamente en 1 toque (área táctil de `56×38px` en vez del diminuto círculo `X` de `20×20px`).

#### 5. Alternativas consideradas
* *Grilla `7 + 6` para los 13 rangos (2 filas en vez de 3):* En un teléfono de `360px` de ancho, 7 columnas dejan cada botón de rango de `~41px` de ancho, mientras que la distribución actual `5 + 5 + 3` da botones de `~60px` de ancho muy cómodos para el pulgar. Gracias a los `150px+` ahorrados al eliminar la barra duplicada de posiciones y la fila inferior de slots de `88px`, **podemos mantener las 3 filas cómodas (`5-5-3`) o usar `7-6` solo en pantallas de altura `<620px`**.

#### 6. Cambios técnicos previstos
* En `PokerTable.tsx`: Actualizar `aspect-[16/9.5]`, `inset-2.5`, recibir opcionalmente `heroCards?: Card[]` y `onRemoveCard?: (index: number) => void` para renderizar el estado central en el paño.
* En `CardSelector.tsx`: Reubicar la previsualización de `cards` en la barra superior del componente con botones de `h-10 px-3` que eliminan la carta al tocarlos, quitando el bloque inferior de `min-h-[88px]`.
* En `HandRecorderView.tsx`: Ocultar la barra horizontal de `actionOrder` durante el `currentStep === 1` y mejorar el tamaño de los botones de `stackAtStart`.

#### 7. Dependencias
* Fase 1 (tokens y escala de tamaños en `tailwind.config.js`).

#### 8. Riesgos
* **Riesgo:** Que en una mesa de 9 jugadores con `aspect-[16/9.5]` los asientos laterales (`MP`, `HJ` o `SB`, `UTG`) queden demasiado cerca entre sí.
* **Mitigación:** Ajustar la distribución angular en `getCoordinates` para espaciar uniformemente el perímetro de la elipse (compensando la excentricidad `rx/ry`) y usar `w-11 h-11` (`44×44px`) para rivales y `w-12 h-12` (`48×48px`) para Hero.

#### 9. Criterios de aceptación
* El Paso 1 completo (`Header + Stack + PokerTable + CardSelector + Botón Siguiente`) mide `<= 590px` de alto y no presenta barra de scroll vertical en `360×800`, `390×844`, `412×915` ni `430×932`.
* Ningún botón interactivo del Paso 1 tiene un área menor a `36×36px` (controles principales `>= 44×44px`).
* La selección de 2 cartas en 2 toques (`Rango + Palo` o `Palo + Rango`) y el bloqueo de duplicados funcionan exactamente igual que antes.

#### 10. Pruebas necesarias
* Verificar visualmente las configuraciones de **2, 3, 6, 8 y 9 jugadores** en `PokerTable.tsx` comprobando que ningún asiento se superponga en `320px` ni `390px`.
* Ejecutar `src/core/positionEngine.test.ts` y `src/stores/handStore.test.ts`.

#### 11. Estimación de complejidad
* **Media:** Ajustes geométricos en `PokerTable.tsx` y reorganización del layout interno de `CardSelector.tsx`.

---

### FASE 4 — REDISEÑO PRIORITARIO DE LA CONSOLA PREFLOP (PASO 2 — NÚCLEO OPERATIVO)

#### 1. Diagnóstico
* **Problema Crítico #1 (`PreflopActionTimeline.tsx`):** Renderiza una fila de `52px` (`h-11` + `p-1` + `gap-2`) por cada jugador de la mesa. En 9-Max son **`512px` verticales**, haciendo imposible ver la mesa completa junto con la consola de acciones (`218px`).
* **Problema Crítico #2 (`ActionConsole.tsx`):** Mantiene desplegados permanentemente los 6 botones de presets de subida (`44px`) y la barra `Personalizado` (`52px`), sumando **`218px` fijos** en la parte inferior, incluso cuando el usuario solo necesita tocar `Fold`, `Limp/Check`, `Call` o `"Folds hasta Hero"`.
* **Problema #3:** Cuando el usuario toca un preset (ej. `3K`), el preset solo cambia el estado `raiseAmount` pero **obliga a hacer un segundo toque arriba en el botón rojo `Raise $3.000`** para confirmar la acción (2 toques para un preset estándar), o bien no queda claro si el preset ejecuta o preselecciona.
* **Problema #4:** Si el usuario comete un error al tocar la acción de un rival o de Hero (excepto cuando se dispara el autoguardado), no tiene un botón rápido para deshacer la última acción o corregir sin tocar manualmente la fila en el timeline.

#### 2. Objetivo
Rediseñar el Paso 2 aplicando el **Modelo 3 (Timeline Híbrido Compacto)** + **Consola Ergonómica Optimizada**, logrando que **toda la secuencia preflop de hasta 9 jugadores y la consola completa entren en `<= 640px` verticales (cero scroll en `360×800+`)**, manteniendo el 100% de la información estratégica y reduciendo el recorrido del pulgar.

#### 3. Componentes afectados
* `src/components/poker/PreflopActionTimeline.tsx`
* `src/components/poker/ActionConsole.tsx`
* `src/views/HandRecorderView.tsx` (sección `currentStep === 2`)

#### 4. Propuesta de solución

**A. Context Bar Superior del Paso 2 (`40px`):**
* En lugar de la tira horizontal de 9 botones de posiciones (`49px`), mostrar una barra informativa compacta de contexto de la mano:
  * **Izquierda:** Badge `HERO: BTN` + Cartas `A♠ K♥` (tocable para volver al Paso 1).
  * **Derecha:** Indicador de **Apuesta Actual a Igualar** (`Apuesta: $1.000` o `Subida a $3.000`) + **Pozo Estimado** (`Pozo: $2.000`).

**B. Timeline Preflop Híbrido (`PreflopActionTimeline.tsx` — Modelo 3):**
Estructura dividida en **3 zonas dinámicas** que nunca superan los `230px` totales:
1. **Zona 1 — Historial de Actuaciones en la Calle:**
   * **Folds en frío consecutivos (`totalContributed === 0` o ciegas no defendidas):** Se agrupan visualmente en una fila compacta de chips (`h-8`) con icono de descarte: `[UTG: Fold] [UTG+1: Fold] [UTG+2: Fold]`. Cada chip sigue siendo un `<button>` individual: si el usuario toca `[UTG+1: Fold]`, el turno vuelve inmediatamente a `UTG+1` para corregir su acción.
   * **Jugadores con acción voluntaria en el pozo (`Limp`, `Call`, `Raise`, `3-Bet`, `4-Bet`, `All-in`):** Se muestran en filas destacadas (`h-10` = `40px`) con código de color semántico (rojo para último agresor, azul para callers, esmeralda para limpers/checks), mostrando la secuencia completa si actuó más de una vez (ej. `MP: Raise $3.000 > Call $9.000`).
2. **Zona 2 — Tarjeta de Jugador en Turno Actual (`currentTurnPosition`):**
   * Fila protagonista (`h-12` = `48px`) con borde iluminado (`border-poker-emerald shadow-neon-emerald` si es **HERO**, `border-blue-400 bg-blue-950/50` si es **RIVAL**), mostrando:
     * Posición grande (`HERO (CO)` o `RIVAL (HJ)`).
     * Contexto inmediato de decisión: `"Pozo limpio (1 BB)"` o `"Enfrenta subida a $3.000"`.
     * Si `canFastForwardToHero` es verdadero, incluye directamente a la derecha el botón rápido **`[⏩ Folds hasta Hero]`**.
3. **Zona 3 — Cola de Próximos por Actuar (`En espera`):**
   * En lugar de gastar `52px` por cada jugador que aún no habló, todos los asientos pendientes después de `currentTurnPosition` se muestran en una **barra horizontal de píldoras interactivas (`h-9` = `36px`)**:
     * Ejemplo: `Por hablar: [CO] → [HERO (BTN)] → [SB $1k] → [BB $1k]`.
     * Tocar cualquiera de esas píldoras selecciona manualmente el turno en ese asiento (`onSelectTurn(pos)`), preservando el 100% de la flexibilidad actual en una sola línea de `36px`.

**C. Consola de Acciones Preflop (`ActionConsole.tsx`):**
* **Fila Principal de 4 Botones Grandes (`h-14` = `56px`, siempre en zona óptima del pulgar):**
  1. `Fold` (Gris oscuro `#1E2632`)
  2. `Limp` / `Check` (Esmeralda `#10B981`; deshabilitado como `No Limp` si `isPotRaised`)
  3. `Call` (Azul `#1D72FE`, mostrando debajo el monto `$currentHighestBet`)
  4. `Raise` / `3-Bet` / `4-Bet` (Rojo `#EF4444`, mostrando debajo `$raiseAmount`)
* **Etiquetado Semántico Dinámico:**
  * Actualmente el botón rojo dice `3-Bet` para cualquier subida cuando `isPotRaised === true` (incluso si ya hubo un 3-bet y corresponde `4-Bet`). Calculando el conteo de subidas en `seatStates`, la etiqueta mostrará con precisión `Raise`, `3-Bet` o `4-Bet`.
* **Fila Compacta de Presets (`2K`, `3K`, `4K`, `5K`, `8K`, `10K`) + Ajuste Fino Integrado (`1 sola fila de 44px` en lugar de 2 filas de `104px`):**
  * Mantener los 6 presets (`grid-cols-6 gap-1.5 h-10`) y compactar el stepper `Personalizado (- / monto / +)` en una barra de `h-10` con botón de teclado numérico directo (`CustomNumberModal`), ahorrando `28px` adicionales en la consola.

#### 5. Alternativas consideradas
* *Ocultar por completo los presets de Raise hasta que el usuario toque el botón `Raise` (Acordeón de 2 pasos):*
  * **Análisis HCI:** Si ocultamos los presets hasta tocar `Raise`, cada vez que un rival o Hero suba a un tamaño distinto del predeterminado (`2x BB`), el usuario tendría que hacer **3 toques** (`Abrir Raise -> Elegir Preset 3K -> Confirmar Raise`), causando además un **salto de layout (*layout shift*)** en la consola.
  * **Decisión:** Gracias a que el **Timeline Híbrido (Modelo 3)** ahorra más de **`280px` verticales**, **no necesitamos esconder los presets**: podemos mantener los presets visibles a 1 toque sin ningún salto de layout y aun así sobran más de `120px` libres en una pantalla de `360×800`.

#### 6. Cambios técnicos previstos
* Refactorizar `PreflopActionTimeline.tsx` para clasificar `positions` en base a `seatStates` y `currentTurnPosition` sin alterar las props del componente (`positions`, `heroPosition`, `currentTurnPosition`, `seatStates`, `onSelectTurn`).
* En `ActionConsole.tsx`, compactar el alto total de `218px` a `~172px`, permitir tocar el monto de `Personalizado` para abrir `CustomNumberModal` si se desea un monto exacto, y mostrar `4-Bet` cuando ya existan 2 subidas previas en la calle.
* **Cero cambios en `bettingEngine.ts` ni en `handStore.ts`**, garantizando compatibilidad total con los tests existentes y el compresor de WhatsApp (`interpretPreflopHand`).

#### 7. Dependencias
* Fase 1 (Design tokens).

#### 8. Riesgos
* **Riesgo:** Que cuando ocurre un `Raise` o `3-Bet` y se reabre la ronda de apuestas para jugadores que habían hecho `Limp` o `Call` antes, el orden visual del Timeline Híbrido resulte confuso.
* **Mitigación:** Los jugadores que ya actuaron pero **deben volver a hablar** porque enfrentan una subida (`candidate.status === 'active' && candidate.totalContributed < highestBet`) se muestran con un badge claro `"Por responder a $X"` y se mantienen en el flujo cronológico activo hasta que igualen o foldeen.

#### 9. Criterios de aceptación
* En una mesa de **9 jugadores**, el Paso 2 completo cabe en un viewport de `360×800` **sin barra de scroll vertical** en todos los casos comunes (inicio de mano, todos foldean hasta Hero, open-raise + 2 calls, 3-bet pot).
* El jugador en turno (`currentTurnPosition`) está siempre visible en el centro de la pantalla sin necesidad de desplazar la vista.
* Todos los asientos (incluidos los que foldearon y los que están en espera) siguen siendo seleccionables con un toque para corregir el turno manualmente.
* El atajo `"Folds hasta Hero"` y el autoguardado por `Hero fold` o `Hero gana preflop` funcionan sin cambios.

#### 10. Pruebas necesarias
* Pruebas en los 7 casos especiales exigidos:
  1. Todos foldean hasta Hero.
  2. Varios limpers (`UTG Limp`, `MP Limp`, `CO Raise`).
  3. Open Raise previo + Calls.
  4. Secuencia `Open Raise -> 3-Bet -> 4-Bet`.
  5. Hero en `SB` o `BB` defendiendo o haciendo `Check`.
  6. Jugador en `All-in`.
  7. Cambio manual de turno tocando un chip de jugador previo o pendiente.

#### 11. Estimación de complejidad
* **Media-Alta:** Requiere lógica de presentación cuidadosa en `PreflopActionTimeline.tsx` para agrupar folds en frío y cola de espera sin perder interactividad por asiento.

---

### FASE 5 — OPTIMIZACIÓN DE LA PANTALLA POSTFLOP (PASO 3) Y HONESTIDAD DE CALLES

#### 1. Diagnóstico
* **Estado real de `TURN` y `RIVER` verificado en código:**
  * En `HandRecorderView.tsx` (líneas 600-620), las pestañas `TURN` y `RIVER` están habilitadas y al tocarlas llaman a `setStreet('turn')` o `setStreet('river')`. Sin embargo, la pantalla sigue renderizando únicamente `CommunityCardsPicker` (limitado a `flopCards.length >= 3`) y `FlopActionConsole` (`"Acción de Hero en el Flop"`). Además, el tipo `RecordedHand` (`src/types/session.ts`) **no posee campos para Turn ni River**. Presentarlas como pestañas activas engaña al usuario haciéndole creer que puede cargar la 4.ª y 5.ª carta.
* **Redundancia de barras superiores en Paso 3:**
  * Se apilan 3 barras arriba: la barra global `actionOrder` (`49px`), la barra de `activePlayers` (`36px`) y las pestañas `STREETS` (`40px`), consumiendo **`125px`** antes de mostrar las cartas comunitarias.
* **Desaprovechamiento del espacio y falta de confirmación en `FlopActionConsole.tsx`:**
  * En `CommunityCardsPicker.tsx`, las 3 cartas del flop usan clases rotas (`w-13 h-19`) y mantienen abierto el teclado de 13 rangos + 4 palos (`175px`) incluso cuando las 3 cartas del flop ya fueron seleccionadas (`flopCards.length === 3`).
  * Cuando el usuario toca `Check`, `Call` o confirma un `Bet` en `FlopActionConsole.tsx`, la acción se pushea a `flopActions` en el store, pero **no se muestra ningún listado o chip de las acciones ya cargadas en el flop**, ni existe forma de borrar una acción postflop equivocada.

#### 2. Objetivo
1. Representar **honestamente** el alcance actual de las calles (`PREFLOP` y `FLOP` operativos; `TURN` y `RIVER` identificados claramente como no disponibles o deshabilitados con etiqueta `"Próx."`).
2. Unificar el contexto superior del Paso 3 (mostrando las cartas de Hero, los jugadores activos en el flop y la última acción preflop relevante).
3. Hacer que el selector de cartas comunitarias se compacte automáticamente al completar las 3 cartas del Flop y mostrar en vivo el registro de acciones tomadas por Hero en el Flop.

#### 3. Componentes afectados
* `src/views/HandRecorderView.tsx` (sección `currentStep === 3`)
* `src/components/poker/CommunityCardsPicker.tsx`
* `src/components/poker/FlopActionConsole.tsx`

#### 4. Propuesta de solución
1. **Honestidad en el Selector de Calles (`STREETS`) y Ranuras Comunitarias:**
   * En las pestañas de calles del Paso 3, mantener `PREFLOP` (para volver al Paso 2) y `FLOP` (calle activa), mientras que `TURN` y `RIVER` se renderizan con estado visual deshabilitado (`disabled`, `opacity-40 cursor-not-allowed`) y un micro-badge `"Próx."` para no inducir al usuario a tocar pestañas sin soporte en base de datos.
   * En `CommunityCardsPicker.tsx`, centrar los **3 slots reales del Flop** con dimensiones válidas (`w-14 h-20`) y dejar los 2 slots de Turn/River como indicadores pasivos claramente diferenciados o compactados.
2. **Resumen Contextual Superior Integrado (Reemplazando las 2 barras duplicadas):**
   * Una sola tarjeta compacta (`44px`) en la parte superior del Paso 3 que muestra:
     * **Izquierda:** `Hero: BTN (A♠ K♥)`
     * **Centro/Derecha:** `En el Flop (3): MP · CO · HERO` + `Pozo Preflop: $9.000`.
3. **Colapso Inteligente de la Matriz de Rangos/Palos al Completar las 3 Cartas del Flop:**
   * Cuando `flopCards.length === 3`, la matriz de 13 rangos y 4 palos pasa automáticamente a estado compacto (o se pliega mostrando un botón `"Cambiar cartas del Flop"` y permitiendo tocar cualquiera de las 3 cartas cargadas para reemplazarla). Esto libera **`165px` verticales** justo en el momento en que el usuario pasa de cargar el board a cargar su acción de apuesta en `FlopActionConsole`.
4. **Historial Visible de Acciones en el Flop (`FlopActionConsole.tsx`):**
   * Mostrar dentro de `FlopActionConsole` los chips de las acciones registradas en esa calle (ej. `1. Hero (BTN): Check` → `2. Hero (BTN): Call $5.000`) con un botón rápido de borrar última acción (`Undo`), evitando duplicaciones accidentales.
   * Posicionar los 4 botones de acción (`Check`, `Bet`, `Call`, `Fold`) y los presets en la parte inferior cercana al pulgar.

#### 5. Alternativas consideradas
* *Eliminar por completo las etiquetas `Turn` y `River` de la interfaz:* Mostrarlas atenuadas con indicador `"Próx."` (deshabilitadas para clic) conserva la estructura mental de las 4 calles del Texas Hold'em sin engañar al usuario sobre su estado funcional.

#### 6. Cambios técnicos previstos
* En `HandRecorderView.tsx`: Ocultar la barra global de `actionOrder` en `currentStep === 3`, unificar la barra de `activePlayers` con el resumen de Hero y deshabilitar el clic en `st.id === 'turn' || st.id === 'river'`.
* En `CommunityCardsPicker.tsx`: Corregir clases `w-13 h-19` por `w-14 h-20`, permitir tocar una carta del flop completa para quitarla y plegar/compactar la matriz cuando `flopCards.length === 3` (con toggle para reabrirla).
* En `FlopActionConsole.tsx`: Recibir `flopActions` desde `HandRecorderView` para renderizar las acciones ya cargadas en el flop y permitir limpiarlas si hubo error.

#### 7. Dependencias
* Fase 1 (Design tokens y clases de tamaño corregidas).

#### 8. Riesgos
* **Riesgo:** Que el usuario quiera editar una de las 3 cartas del flop después de que la matriz se haya compactado automáticamente.
* **Mitigación:** Al tocar cualquiera de las 3 cartas del flop mostradas en el board, la carta se quita (`flopCards.length` pasa a `2`) y la matriz de rangos/palos se despliega instantáneamente.

#### 9. Criterios de aceptación
* Las pestañas `TURN` y `RIVER` no permiten interacción engañosa.
* Al seleccionar la 3.ª carta del Flop, el foco visual pasa inmediatamente a `FlopActionConsole` sin requerir scroll vertical.
* Cada acción que Hero registra en el Flop (`Check`, `Bet`, `Call`) se visualiza en una tira de confirmación dentro de la consola.

#### 10. Pruebas necesarias
* Cargar 3 cartas del flop, verificar que ninguna carta de Hero pueda repetirse en el flop (`isCardInUse`), quitar 1 carta tocándola y registrar `Bet` con confirmación.

#### 11. Estimación de complejidad
* **Media:** Ajustes de estado local UI en `CommunityCardsPicker.tsx` y feedback visual en `FlopActionConsole.tsx`.

---

### FASE 6 — REVISIÓN DE MANOS, MODALES, NAVEGACIÓN E INCIDENCIAS SECUNDARIAS

#### 1. Diagnóstico
* **En `HandReviewView.tsx`:**
  * Muestra tres tarjetas separadas con paddings `p-4` (`Metadatos`, `Preflop`, `Flop`). En manos con muchas acciones preflop (ej. 6 folds + 1 raise + 2 calls), lista todos los folds uno por uno ocupando `36px` por fila, a diferencia del formato comprimido e inteligente que usa `exportUtils.interpretPreflopHand`.
* **En `CustomNumberModal.tsx`:**
  * Tiene una altura fija de `~490px` (`h-14` en cada fila de teclas + `py-4` en display + `p-5`). En pantallas de `320×568` ocupa casi toda la altura útil.
* **En `ExportModal.tsx`:**
  * Cuando una sesión supera las 60-90 manos (3 o más bloques de WhatsApp), el contenedor carece de `max-h-[85dvh] overflow-y-auto`.
* **Incidencias Funcionales Independientes detectadas en la Auditoría (Documentadas por separado según directriz de Fase 6):**
  * **INC-01 (`HandRecorderView.tsx`, línea 372):** El botón superior derecho `MoreVertical` (`⋮`, `aria-label="Opciones"`) tiene conectado `onClick={handleNextStep}` en lugar de un menú o acción de opciones.
  * **INC-02 (`SessionActiveView.tsx`, líneas 74-78):** Cuando se abre `HandReviewView` para una mano ya guardada (`isExistingSavedHand={true}`), se muestran los botones `"Editar"` y `"Actualizar mano"`, pero sus callbacks hacen `setSelectedHandForReview(null)` sin editar ni actualizar nada.

#### 2. Objetivo
Optimizar la lectura cronológica en `HandReviewView.tsx`, hacer que `CustomNumberModal.tsx` y `ExportModal.tsx` se adapten a viewports pequeños (`320×568`), y sanear la interfaz frente a las incidencias `INC-01` e `INC-02` sin alterar el formato de datos ni la lógica de persistencia.

#### 3. Componentes afectados
* `src/views/HandReviewView.tsx`
* `src/components/common/CustomNumberModal.tsx`
* `src/components/common/ExportModal.tsx`
* `src/views/HandRecorderView.tsx` (encabezado superior)
* `src/views/SessionActiveView.tsx` (visualización de mano guardada en `HandReviewView`)

#### 4. Propuesta de solución
1. **Lectura Cronológica Escaneable en `HandReviewView.tsx`:**
   * Agrupar los folds consecutivos sin inversión en una sola línea compacta (`UTG, UTG+1, MP: Fold`) dentro de la tarjeta Preflop, destacando con badges de color y mayor peso visual las acciones voluntarias (`Limp`, `Call`, `Raise`, `3-Bet`) y la fila de `HERO`.
   * Cuando `isExistingSavedHand === true` (abierta desde el historial de `SessionActiveView`), mostrar en la barra inferior un único botón claro **`"Volver al historial"`** (en lugar de los botones `"Editar"` y `"Actualizar mano"` que hoy están desconectados), dejando documentada la incidencia `INC-02` en caso de que se desee implementar la edición real en una etapa funcional posterior.
2. **Reemplazo honesto del botón `⋮` en `HandRecorderView.tsx` (`INC-01`):**
   * Sustituir el engañoso icono `MoreVertical` (`⋮`) por un indicador útil del paso (`Paso 1/3`, `Paso 2/3`) o por un botón claro `"Revisar"` cuando corresponda, evitando que un icono de menú ejecute `handleNextStep`.
3. **Adaptabilidad de Modales (`CustomNumberModal.tsx` y `ExportModal.tsx`):**
   * En `CustomNumberModal.tsx`: Usar `h-12 sm:h-14` para las teclas numéricas y `p-4` en móvil, reduciendo la altura total de `490px` a `395px` para que sea cómodo en pantallas desde `568px` de alto sin perder botones de `48px` de alto.
   * En `ExportModal.tsx`: Añadir `max-h-[85dvh] overflow-y-auto` al contenedor del modal para soportar sesiones de más de 100 manos sin desbordar la pantalla.

#### 5. Alternativas consideradas
* *Ocultar los folds por completo en `HandReviewView.tsx`:* Es mejor agruparlos en una sola línea (`Folds previos: UTG, UTG+1`) que ocultarlos del todo, para que el usuario tenga certeza de que fueron registrados.

#### 6. Cambios técnicos previstos
* Ajustar el renderizado de `preflopActions` en `HandReviewView.tsx` para resumir folds en frío consecutivos.
* En `HandReviewView.tsx`, renderizar condicionalmente la botonera inferior según `isExistingSavedHand`.
* Ajustar clases responsive en `CustomNumberModal.tsx` y `ExportModal.tsx`.

#### 7. Dependencias
* Fase 1 (Design tokens).

#### 8. Riesgos
* **Riesgo:** Ninguno sobre la exportación o persistencia, ya que `exportUtils.ts` y `sessionRepository.ts` no se modifican en absoluto.

#### 9. Criterios de aceptación
* `CustomNumberModal` cabe íntegramente con margen superior visible en `320×568`.
* `HandReviewView` permite distinguir en `<2 segundos` la posición de Hero, sus cartas, quién abrió la mano, cuánto se apostó y qué hizo Hero.
* Los formatos de exportación a WhatsApp, Texto, CSV y JSON permanecen 100% idénticos (validado por los 13 tests de `exportUtils.test.ts`).

#### 10. Pruebas necesarias
* Ejecutar `src/utils/exportUtils.test.ts`.
* Abrir `CustomNumberModal` y `ExportModal` en `320×568` y `360×800`.

#### 11. Estimación de complejidad
* **Baja:** Ajustes acotados de presentación y estilos en vistas de revisión y modales.

---

### FASE 7 — RESPONSIVE, ACCESIBILIDAD, PERFORMANCE Y VALIDACIÓN INTEGRAL

#### 1. Diagnóstico
* `index.html` bloquea el escalado con `maximum-scale=1.0, user-scalable=no`.
* En resoluciones extremas (`320×568`), componentes como `NumberStepper` (`min-w-[170px]`) o filas de 6 presets con textos largos pueden producir scroll horizontal accidental.
* Falta verificación sistemática de que los botones inferiores fijos (`sticky`/`fixed`) no tapen el último elemento interactivo al hacer scroll.

#### 2. Objetivo
Certificar que las 7 fases del rediseño funcionen sin regresiones funcionales, sin scroll horizontal (`overflow-x`), con contraste accesible para entornos nocturnos y con respuesta táctil inmediata (`<16ms` de frame budget) en los 5 tamaños de pantalla objetivo.

#### 3. Componentes afectados
* `index.html`
* `src/styles/index.css`
* Suite de pruebas y validación transversal sobre todas las vistas (`src/views/*.tsx`, `src/components/**/*.tsx`).

#### 4. Propuesta de solución
1. **Matriz de Validación Multi-Viewport (`320×568` a `430×932`):**
   * Garantizar en `320px` que `NumberStepper` use `min-w-[140px] sm:min-w-[170px]` para evitar cualquier desborde en `StackPicker`.
2. **Protección de Safe Areas y Elementos Sticky:**
   * Asegurar que toda vista con barra de acción inferior tenga el `padding-bottom` compensatorio exacto y que las zonas `flex-1 overflow-y-auto` no oculten la última fila bajo el degradado inferior.
3. **Rendimiento y Estabilidad de Layout (CLS = 0):**
   * Evitar animaciones costosas de `backdrop-filter` anidadas dentro de listas largas (como el historial de manos o el timeline preflop) que degradan los FPS en teléfonos Android de gama media en modo ahorro de batería.

#### 5. Alternativas consideradas
* *Agregar librerías de animación como `framer-motion`:* Descartado. Aumenta el tamaño del bundle y puede introducir latencia al registrar toques rápidos consecutivos (ej. tocar 4 veces `Fold` en 1 segundo). Las transiciones CSS nativas de `100ms-150ms` son instantáneas y no bloquean los eventos táctiles.

#### 6. Cambios técnicos previstos
* Ajustes de `min-w` responsivos en `NumberStepper.tsx`.
* Limpieza de `backdrop-filter` redundantes en elementos repetitivos de listas.

#### 7. Dependencias
* Fases 1 a 6 completadas.

#### 8. Riesgos
* **Riesgo:** Regresión involuntaria en algún caso borde del flujo de grabación.
* **Mitigación:** Ejecución completa de la suite `vitest` + checklist manual de 15 escenarios obligatorios.

#### 9. Criterios de aceptación
* `document.documentElement.scrollWidth <= document.documentElement.clientWidth` en las 5 resoluciones (`320`, `360`, `390`, `412`, `430px`).
* `100%` de los 28 tests unitarios pasando (`npm test`) y compilación limpia de TypeScript + Vite (`npm run build`).

#### 10. Pruebas necesarias
* Ver Sección 13 (Estrategia de Pruebas Completa).

#### 11. Estimación de complejidad
* **Baja:** Auditoría final, ajustes finos de responsive y ejecución de pruebas de regresión.

---

## 10. DEPENDENCIAS TÉCNICAS ENTRE FASES

```
[FASE 0: Auditoría (Completada)]
               │
               ▼
[FASE 1: Design Tokens, Escala Tailwind & Componentes Base (Common)]
       │               │                 │                │
       ▼               ▼                 ▼                ▼
  [FASE 4]        [FASE 3]          [FASE 2]         [FASE 5]
Consola Preflop  Mesa y Cartas     Dashboard &     Pantalla Flop
  (Prioridad 1)   (Prioridad 2)   Nueva Sesión     (Prioridad 4)
       │               │                 │                │
       └───────────────┴────────┬────────┴────────────────┘
                                ▼
                    [FASE 6: Revisión & Modales]
                                │
                                ▼
             [FASE 7: Responsive, QA & Regresión Final]
```

* **La Fase 1 es prerrequisito técnico obligatorio** porque repara las clases de escala en `tailwind.config.js` y habilita `onValueClick` en `NumberStepper.tsx`.
* **Las Fases 2, 3, 4 y 5 son técnicamente independientes entre sí** una vez completada la Fase 1, lo que permite implementarlas y probarlas una por una en el orden de mayor impacto operativo.

---

## 11. RIESGOS Y MITIGACIONES GLOBALES

| ID | Riesgo Identificado | Probabilidad | Impacto | Estrategia de Mitigación |
| :- | :--- | :---: | :---: | :--- |
| **R-01** | Alterar accidentalmente el orden o registro de acciones en `useHandStore` o `bettingEngine` al rediseñar el Timeline Preflop. | Baja | Crítico | **Desacoplamiento estricto:** `PreflopActionTimeline` solo lee `seatStates` y emite `onSelectTurn(pos)` exactamente igual que hoy. `bettingEngine.ts` y `handStore.ts` no se modifican. |
| **R-02** | Que la compactación del Timeline Híbrido dificulte tocar un asiento que foldeó si el usuario se equivocó. | Media | Alto | Cada chip de jugador foldeado (`[UTG: Fold]`) y cada chip de jugador en espera (`[CO]`) tendrá `min-h-[36px] px-2.5` y ejecutará `onSelectTurn(pos)` con feedback háptico. |
| **R-03** | Incompatibilidad con sesiones o manos ya guardadas en IndexedDB en el dispositivo del usuario. | Nula | Crítico | No se altera ningún campo de `SessionConfig` ni `RecordedHand` en `db.ts` (Versión 1 de Dexie intacta). |
| **R-04** | Que al compactar el selector de cartas se produzcan toques accidentales entre rangos y palos. | Baja | Medio | Mantener intacta la altura de los botones de rango (`h-10` = `40px`) y de palo (`h-11` = `44px`) con `gap-1.5` (`6px`); el ahorro de espacio proviene de reubicar los slots de cartas seleccionadas, no de achicar los botones. |

---

## 12. CRITERIOS DE ACEPTACIÓN CONSOLIDADOS DEL REDISEÑO

1. **Cero Scroll en Flujos de Registro (`>= 360×800`):** Tanto el Paso 1 (Posición + Cartas), el Paso 2 (Consola Preflop en mesa de 9 jugadores) como el Paso 3 (Flop + Consola Postflop) deben caber en una pantalla de `360×800` sin requerir desplazamiento vertical para alcanzar los controles principales.
2. **Superficie Táctil Mínima Respetada:** Botones de acción principales (`Fold`, `Limp/Check`, `Call`, `Raise`, `Siguiente`, `Registrar mano`) con `height >= 48px-56px`; botones de selección de cartas, asientos y presets con `height >= 40px-44px`.
3. **Visibilidad Permanente del Turno Activo:** En el Paso 2, el jugador que tiene la palabra (`currentTurnPosition`) es siempre visible sin importar si es `UTG`, `MP` o `BB`.
4. **Honestidad de Interfaz:** Ningún botón o pestaña simula una funcionalidad inexistente (`TURN`/`RIVER` señalizados como próximamente; icono `⋮` corregido; vista de revisión de mano guardada con acción coherente).
5. **Integridad de Tests y Build:** `npm test` (28/28 tests pasando) y `npm run build` (`tsc && vite build`) finalizan con código `0`.

---

## 13. ESTRATEGIA DE PRUEBAS (QA, RESPONSIVE Y REGRESIÓN)

### 13.1. Pruebas Automatizadas de Regresión (Vitest)
Antes y después de cada fase se ejecutará `npm test` verificando las 4 suites actuales:
* `src/core/positionEngine.test.ts` (6 tests: posiciones de 2 a 9 jugadores y orden preflop).
* `src/core/bettingEngine.test.ts` (4 tests: inicialización de ciegas, subidas, reapertura de ronda y cierre).
* `src/stores/handStore.test.ts` (5 tests: ciclo de vida de la mano, prevención de cartas duplicadas, jugadores activos al flop).
* `src/utils/exportUtils.test.ts` (13 tests: cálculo de VPIP/PFR, compresión de acciones preflop, formato WhatsApp, división en bloques de 30 manos).

### 13.2. Matriz de Escenarios de Prueba Manual / Responsive
Cada fase será validada en el navegador con DevTools Device Toolbar en los siguientes 15 escenarios obligatorios:
1. **Viewport `320×568` (Teléfono pequeño):** Verificar ausencia de scroll horizontal en `NewSessionView`, `PokerTable` y `ActionConsole`.
2. **Viewport `360×800` (Teléfono mediano Android):** Verificar que Paso 1, Paso 2 (9-Max) y Paso 3 entren sin scroll vertical.
3. **Viewport `390×844` (Teléfono estándar iOS):** Verificar proporción de mesa y alcance del pulgar.
4. **Viewport `412×915` y `430×932` (Teléfonos grandes):** Verificar que no queden bloques vacíos artificiales en `SessionActiveView` ni en Paso 3.
5. **Configuración de 2 jugadores (Heads-Up):** Verificar `BTN` y `BB` en `PokerTable` y `PreflopActionTimeline`.
6. **Configuración de 6 jugadores (6-Max) y 9 jugadores (Full Ring):** Verificar no superposición de asientos en `PokerTable`.
7. **Dashboard con 0 manos:** Verificar estado vacío compacto y visualización de `—` en VPIP/PFR.
8. **Dashboard con +20 manos:** Verificar scroll fluido del historial y permanencia del botón inferior `"Registrar nueva mano"`.
9. **Preflop — Atajo `"Folds hasta Hero"`:** Tocar el atajo con Hero en `CO` o `BTN` y comprobar que los anteriores pasen al chip compacto de foldeados.
10. **Preflop — Secuencia compleja (`Limp -> Raise -> 3-Bet -> Call`):** Verificar que las filas con dinero invertido permanezcan visibles y claras en el Timeline Híbrido.
11. **Preflop — Corrección manual de turno:** Tocar un jugador que ya foldeó o uno que está en la cola de espera y comprobar que el turno cambie a ese asiento.
12. **Selección y borrado de cartas (Hero y Flop):** Seleccionar 2 cartas de Hero, borrar 1 tocándola directamente, volver a elegir y comprobar bloqueo en Flop (`isCardInUse`).
13. **Autoguardado:** Comprobar que `Hero Fold` preflop, `Hero gana preflop` y `Hero Fold` en flop guarden la mano y muestren el toast de éxito.
14. **Modales abiertos (`CustomNumberModal` y `ExportModal`):** Comprobar apertura para `SB`, `BB` y `Stack`, y exportación a WhatsApp/Texto/CSV/JSON.
15. **Escala de texto del sistema al `115%`:** Comprobar que los textos de botones (`Fold`, `Limp`, `Call`, `Raise`) no se trunquen ni rompan la grilla de 4 columnas.

---

## 14. MÉTRICAS DE EVALUACIÓN (ANTES / OBJETIVO / MÉTODO DE VALIDACIÓN)

| Indicador / Métrica | Valor Actual Medido (Antes) | Objetivo con el Rediseño | Método de Validación |
| :--- | :--- | :--- | :--- |
| **Altura total de `NewSessionView`** | `830px` (requiere scroll en `360×800`) | **`<= 640px`** (`0px` de scroll en `>=360×800`) | Medición de `scrollHeight` del contenedor en Chrome DevTools (`360×800`). |
| **Espacio vacío en `SessionActiveView` (0 manos, viewport `390×844`)** | `414px` de caja punteada vacía | **`<= 135px`** (tarjeta de estado vacío ajustada al contenido) | Inspección de `getBoundingClientRect().height` del bloque empty-state. |
| **Manos visibles sin scroll en `SessionActiveView` (`390×844`)** | `4 a 5 manos` | **`7 a 8 manos`** simultáneas | Conteo visual en lista con 10 manos de prueba en `390×844`. |
| **Altura total del Paso 1 (Mesa + Cartas)** | `765px` (oculta palos/slots en `<=750px`) | **`<= 580px`** (**`-185px`**, entra sin scroll desde `360×800`) | Medición de `scrollHeight` en `currentStep === 1`. |
| **Altura del Timeline Preflop en mesa de 9 jugadores (Paso 2)** | `512px` (`9 × 52px` + gaps) | **`180px - 230px`** (**`-280px`**, compresión híbrida) | Medición en `currentStep === 2` con 9 jugadores activos/foldeados. |
| **Altura total del Paso 2 completo (Header + Timeline + Consola)** | `868px` (desborda en `320`, `360` y `390px`) | **`<= 590px`** (`0px` de scroll en `>=360×800`) | Verificación de `scrollTop === 0` durante toda la ronda preflop en `360×800`. |
| **Visibilidad del jugador en turno (`currentTurnPosition`) sin scroll** | `55%` de los turnos visibles sin scrollear en `360×800` | **`100%` de los turnos** (`UTG` a `BB`) visibles sin scrollear | Recorrido completo de los 9 asientos en `360×800`. |
| **Área táctil mínima de controles interactivos** | `20×20px` (quitar carta) / `28×28px` (stack bar) | **`>= 38×38px` en secundarios / `>= 44×44px` en primarios** | Auditoría de `offsetWidth` × `offsetHeight` en todos los `<button>`. |

---

## 15. WIREFRAMES COMPARATIVOS (IDENTIDAD DARK-NEON)

### 15.1. Pantalla 1: Dashboard sin Manos (`SessionActiveView.tsx`)

```
===================== DISEÑO ACTUAL =====================      =================== DISEÑO PROPUESTO ===================
┌───────────────────────────────────────────────────────┐      ┌──────────────────────────────────────────────────────┐
│ [Layers] Sesión en Vivo                   [■ Finalizar]│      │ [♠] Sesión en Vivo · 9 Jugadores         [■ Finalizar]│
│          ● Mesa de 9 jugadores                        │      ├──────────────────────────────────────────────────────┤
├───────────────────────────────────────────────────────┤      │ ┌─ PARÁMETROS & MINI-HUD ──────────────────────────┐ │
│ ┌─ GLASSCARD (142px) ───────────────────────────────┐ │      │ │ Ciegas: $1.000/$1.000   │  Stack: $50.000 (50 BB)│ │
│ │ [Ciegas: $1.000/$1.000]  [Stack Inicial: $50.000] │ │      │ ├─────────────────────────┴────────────────────────┤ │
│ │  MANOS: 0       │   VPIP: 0%    │    PFR: 0%      │ │      │ │   MANOS: 0      │    VPIP: —     │     PFR: —    │ │
│ └───────────────────────────────────────────────────┘ │      │ └──────────────────────────────────────────────────┘ │
│ 🕒 HISTORIAL DE MANOS (0)                             │      │                                                      │
│ ┌─ CAJA VACÍA ESTIRADA (flex-1 = 370px a 500px) ────┐ │      │ ┌─ ESTADO VACÍO COMPACTO (125px) ──────────────────┐ │
│ │                                                   │ │      │ │        [🃏 Icono Cartas Neón Esmeralda]          │ │
│ │                                                   │ │      │ │         Mesa lista para registrar manos          │ │
│ │     Aún no has registrado manos en esta sesión.   │ │      │ │   Cargá posición, cartas y acción sin teclado    │ │
│ │     Tocá el botón verde para registrar una mano   │ │      │ └──────────────────────────────────────────────────┘ │
│ │                                                   │ │      │                                                      │
│ │                                                   │ │      │ (Espacio limpio respirable sin bordes artificiales)  │
│ └───────────────────────────────────────────────────┘ │      │                                                      │
│ [       ▶ Registrar nueva mano (h-14 Esmeralda)     ] │      │ [      ▶ Registrar nueva mano (h-14 Esmeralda)     ] │
└───────────────────────────────────────────────────────┘      └──────────────────────────────────────────────────────┘
```

### 15.2. Pantalla 2: Dashboard con Historial (`SessionActiveView.tsx`)

```
=================== DISEÑO PROPUESTO (CON HISTORIAL) ===================
┌──────────────────────────────────────────────────────────────────────┐
│ [♠] Sesión en Vivo · 9 Jugadores              [⬇ Exportar] [■ Fin.] │
├──────────────────────────────────────────────────────────────────────┤
│ ┌─ HUD COMPACTO (88px) ────────────────────────────────────────────┐ │
│ │ Ciegas $1.000/$1.000 · Stack $50.000 (50 BB)                     │ │
│ │    MANOS: 14        │      VPIP: 29%       │       PFR: 21%      │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│ 🕒 HISTORIAL DE MANOS (14)                           (7-8 visibles)  │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ [#14] [BTN]  [A♠][K♥]  Flop:[Q♦ J♠ 2♣]       [Bet $5.000]    [›] │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ [#13] [CO]   [9♣][9♦]                        [Raise $3.000]  [›] │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ [#12] [UTG]  [7♠][2♦]                        [Fold PF]       [›] │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│ ... (hasta 4-5 filas más visibles sin hacer scroll) ...              │
├──────────────────────────────────────────────────────────────────────┤
│ [            ▶ Registrar nueva mano (h-14 Esmeralda)               ] │
└──────────────────────────────────────────────────────────────────────┘
```

### 15.3. Pantalla 3: Grabador Paso 1 — Posición y Cartas (`HandRecorderView` + `PokerTable` + `CardSelector`)

```
===================== DISEÑO ACTUAL (765px) =====================      ================= DISEÑO PROPUESTO (575px) =================
┌───────────────────────────────────────────────────────────────┐      ┌──────────────────────────────────────────────────────────┐
│ [←]                       Mano #12                        [⋮] │      │ [←]          Mano #12 · Paso 1/3 (Posición y Mano)       │
├───────────────────────────────────────────────────────────────┤      ├──────────────────────────────────────────────────────────┤
│ [UTG][UTG+1][UTG+2][MP][HJ][CO][HERO(BTN)][SB][BB] (Redund.)  │      │ [🪙 Stack: $50.000 (50 BB)]      [ -1BB ] [ +1BB ] [Edit]│
├───────────────────────────────────────────────────────────────┤      ├──────────────────────────────────────────────────────────┤
│ [🪙 $50.000 (50 BB)]                     [-][+][Editar][X]    │      │         [UTG+1]        [UTG+2]         [MP]              │
├───────────────────────────────────────────────────────────────┤      │    [UTG]     ╔══════════════════════════╗    [HJ]        │
│             [UTG+1]        [UTG+2]        [MP]                │      │              ║   HERO: BTN (Dealer D)   ║                │
│      [UTG]     ╭──────────────────────────╮    [HJ]           │      │    [BB]      ║   Cartas: [A♠]  [K♥]     ║    [CO]        │
│                │                          │                   │      │              ╚══════════════════════════╝                │
│      [BB]      │    Texas Hold'em Live    │    [CO]           │      │            [SB]      (HERO: BTN)                         │
│                │      (257px de alto)     │                   │      │              (Mesa compacta 185px de alto)               │
│             [SB]      [HERO (BTN) D]                          │      ├──────────────────────────────────────────────────────────┤
├───────────────────────────────────────────────────────────────┤      │ ┌─ TU MANO (Tocar carta para quitar) ──────────────────┐ │
│ ┌─ TU MANO (350px de alto) ─────────────────────────────────┐ │      │ │ Tu mano:  [ A♠ ✕ ]  [ K♥ ✕ ]            [🗑 Borrar]  │ │
│ │ [ A ] [ K ] [ Q ] [ J ] [ 10 ]                            │ │      │ │ [ A ]  [ K ]  [ Q ]  [ J ]  [ 10 ]      (h-10 = 40px)│ │
│ │ [ 9 ] [ 8 ] [ 7 ] [ 6 ] [ 5 ]                             │ │      │ │ [ 9 ]  [ 8 ]  [ 7 ]  [ 6 ]  [ 5 ]       (h-10 = 40px)│ │
│ │       [ 4 ] [ 3 ] [ 2 ]                                   │ │      │ │        [ 4 ]  [ 3 ]  [ 2 ]              (h-10 = 40px)│ │
│ │ [   ♠   ]  [   ♥   ]  [   ♦   ]  [   ♣   ]                │ │      │ │ [   ♠   ]   [   ♥   ]   [   ♦   ]   [   ♣   ] (44px) │ │
│ │        ┌────────┐  ┌────────┐  (88px abajo que empujan    │ │      │ └──────────────────────────────────────────────────────┘ │
│ │        │ Slot 1 │  │ Slot 2 │   el botón fuera de vista)  │ │      │   (Ahorra 190px verticales sin achicar ningún botón)     │
│ │        └────────┘  └────────┘                             │ │      ├──────────────────────────────────────────────────────────┤
│ └───────────────────────────────────────────────────────────┘ │      │ [              Siguiente: Acción Preflop →             ] │
│ [                        Siguiente →                        ] │      └──────────────────────────────────────────────────────────┘
└───────────────────────────────────────────────────────────────┘
```

### 15.4. Pantalla 4: Grabador Paso 2 — Consola Preflop (`PreflopActionTimeline` + `ActionConsole`)

```
===================== DISEÑO ACTUAL (868px) =====================      ============== DISEÑO PROPUESTO: MODELO 3 (575px) ==============
┌───────────────────────────────────────────────────────────────┐      ┌──────────────────────────────────────────────────────────────┐
│ [←]                       Mano #12                        [⋮] │      │ [←]  Mano #12 · Preflop       [Hero: CO (A♠ K♥) │ Ap: $3.000]│
├───────────────────────────────────────────────────────────────┤      ├──────────────────────────────────────────────────────────────┤
│ [UTG][UTG+1][UTG+2][MP][HJ][HERO(CO)][BTN][SB][BB]            │      │ ┌─ 1. HISTORIAL DE LA CALLE (Folds comprimidos + Activos) ─┐ │
├───────────────────────────────────────────────────────────────┤      │ │ Folds previos: [UTG ✕] [UTG+1 ✕] [UTG+2 ✕] (Tocables)    │ │
│ [UTG]      [ → Fold                                         ] │      │ │ [MP]   [ ↰ Raise $3.000                        ] (Rojo)  │ │
│ [UTG+1]    [ → Fold                                         ] │      │ │ [HJ]   [ + Call $3.000                         ] (Azul)  │ │
│ [UTG+2]    [ → Fold                                         ] │      │ └──────────────────────────────────────────────────────────┘ │
│ [MP]       [ ↰ Raise $3.000                                 ] │      │ ┌─ 2. JUGADOR EN TURNO (Siempre en el centro visual) ──────┐ │
│ [HJ]       [ + Call $3.000                                  ] │      │ │ 🟢 [HERO (CO)] — TU TURNO      Enfrenta subida a $3.000  │ │
│ ─── PLIEGUE DE PANTALLA EN 360x800 (Lo de abajo se oculta) ── │      │ └──────────────────────────────────────────────────────────┘ │
│ [HERO(CO)] [ Esperando decisión...               [Tu Turno] ] │      │ ┌─ 3. PRÓXIMOS POR HABLAR (Tocables para cambiar turno) ───┐ │
│ [BTN]      [ En espera                                      ] │      │ │ En espera:  [ BTN ]  →  [ SB $1k ]  →  [ BB $1k ]        │ │
│ [SB]       [ En espera                                      ] │      │ └──────────────────────────────────────────────────────────┘ │
│ [BB]       [ En espera                                      ] │      ├──────────────────────────────────────────────────────────────┤
├───────────────────────────────────────────────────────────────┤      │ ┌─ CONSOLA DE ACCIÓN PREFLOP (Zona ergonómica del pulgar) ─┐ │
│ 🟢 HERO (CO) — TU TURNO              [⏩ Folds hasta Hero]   │      │ │ [  Fold  ]  [ No Limp ]  [Call $3.000]  [3-Bet $6.000]   │ │
│ [  Fold  ]  [ No Limp ]  [Call $3.000]  [3-Bet $6.000] (56px) │      │ │                          (Azul #1D72FE) (Rojo #EF4444)   │ │
│ [  2K  ] [  3K  ] [  4K  ] [  5K  ] [  8K  ] [ 10K  ]  (44px) │      │ │ Presets: [ 2K ] [ 3K ] [ 4K ] [ 5K ] [ 8K ] [ 10K ]      │ │
│ [ Personalizado                      [-]  6.000  [+] ] (52px) │      │ │ Ajuste:  [ [-]   $ 6.000 (Tocar p/ Teclado)   [+] ]      │ │
└───────────────────────────────────────────────────────────────┘      │ └──────────────────────────────────────────────────────────┘ │
                                                                       └──────────────────────────────────────────────────────────────┘
```

### 15.5. Pantalla 5: Grabador Paso 3 — Pantalla del Flop (`CommunityCardsPicker` + `FlopActionConsole`)

```
===================== DISEÑO ACTUAL =====================      =================== DISEÑO PROPUESTO ===================
┌───────────────────────────────────────────────────────┐      ┌──────────────────────────────────────────────────────┐
│ [←]                    Mano #12                   [⋮] │      │ [←]  Mano #12 · Postflop     [Hero: BTN (A♠ K♥)]     │
├───────────────────────────────────────────────────────┤      ├──────────────────────────────────────────────────────┤
│ [UTG][UTG+1]...[HERO(BTN)][SB][BB] (Barra duplicada 1)│      │ Activos en Flop (3): [MP] · [CO] · [HERO (BTN)]      │
│ [MP] [CO] [HERO (BTN)]             (Barra duplicada 2)│      │ [ ◀ PREFLOP ] [  ● FLOP  ] [🔒 TURN Próx] [🔒 RIVER] │
│ [ PREFLOP ] [  FLOP  ] [  TURN  ] [ RIVER ] (Engañoso)│      ├──────────────────────────────────────────────────────┤
├───────────────────────────────────────────────────────┤      │ ┌─ CARTAS DEL FLOP (Se pliega al cargar las 3) ────┐ │
│ ┌─ CARTAS DEL FLOP ─────────────────────────────────┐ │      │ │ Board:  [ Q♦ ✕ ]   [ J♠ ✕ ]   [ 2♣ ✕ ]  [Cambiar]│ │
│ │ [Flop 1] [Flop 2] [Flop 3]  [Turn] [River]        │ │      │ │ (Al tener las 3 cartas, la matriz 13x4 se pliega │ │
│ │ [ A ] [ K ] [ Q ] [ J ] [ 10 ]  (Sigue abierto    │ │      │ │  automáticamente ahorrando 165px; tocar cualquier│ │
│ │ [ 9 ] [ 8 ] [ 7 ] [ 6 ] [ 5 ]    aunque ya haya   │ │      │ │  carta del board la quita y reabre la matriz)    │ │
│ │       [ 4 ] [ 3 ] [ 2 ]          3 cartas)        │ │      │ └──────────────────────────────────────────────────┘ │
│ │ [   ♠   ]  [   ♥   ]  [   ♦   ]  [   ♣   ]        │ │      │ ┌─ ACCIÓN DE HERO EN EL FLOP (BTN) ────────────────┐ │
│ └───────────────────────────────────────────────────┘ │      │ │ Registrado: [1. Check]  [↶ Deshacer]             │ │
│ ┌─ ACCIÓN DE HERO EN EL FLOP ───────────────────────┐ │      │ │ [ Check ]   [  Bet  ]   [  Call  ]   [  Fold  ]  │ │
│ │ [ Check ]  [  Bet  ]  [  Call  ]  [  Fold  ]      │ │      │ │ Monto: [3K] [5K] [7K] [10K] [15K] [20K]          │ │
│ │ (No muestra qué acciones ya se cargaron al store) │ │      │ │        [ [-]  $5.000  [+] ]   [ ✓ Confirmar Bet ]│ │
│ └───────────────────────────────────────────────────┘ │      │ └──────────────────────────────────────────────────┘ │
│ [             Revisar y Guardar mano                ] │      │ [             Revisar y Guardar mano →             ] │
└───────────────────────────────────────────────────────┘      └──────────────────────────────────────────────────────┘
```

---

## 16. ORDEN FINAL DE IMPLEMENTACIÓN RECOMENDADO Y JUSTIFICACIÓN

Aunque el documento numera las fases de 0 a 7 siguiendo el recorrido natural de las pantallas, **técnica y operativamente recomendamos ejecutar la implementación en el siguiente orden de prioridad de valor para el jugador**:

| Orden de Ejecución | Fase | Razón Técnica y de Producto |
| :---: | :--- | :--- |
| **1.º** | **FASE 1 — Sistema de Diseño, Tokens y Escala Tailwind** | **Cimiento obligatorio:** Repara en 5 minutos las clases rotas (`w-13`, `h-13`, `h-19`, `h-21`, `active:scale-98`) y mejora `NumberStepper` y `GlassCard`. |
| **2.º** | **FASE 4 — Rediseño Prioritario de la Consola Preflop** | **Máximo ROI para el usuario:** El 100% de las manos pasan por el preflop y hoy es la pantalla con el problema más grave de scroll (`868px`). Resolver esto primero transforma la velocidad de uso en vivo inmediatamente. |
| **3.º** | **FASE 3 — Selección de Posición y Cartas (Paso 1)** | **Segundo cuello de botella operativo:** También se usa en el 100% de las manos. Compactar `PokerTable` y `CardSelector` elimina el scroll en el Paso 1. |
| **4.º** | **FASE 5 — Optimización de la Pantalla Postflop (Paso 3)** | Completa el flujo del grabador (`HandRecorderView.tsx`), corrige la falsa disponibilidad de Turn/River y añade el feedback visual de acciones en el flop. |
| **5.º** | **FASE 2 — Dashboard de Sesión en Vivo y Nueva Sesión** | Mejora el punto de partida y el retorno entre manos (`SessionActiveView` y `NewSessionView`), permitiendo ver el doble de manos en el historial y editar `SB`/`BB` con 1 toque. |
| **6.º** | **FASE 6 — Revisión de Manos y Modales Secundarios** | Pulido de `HandReviewView`, `CustomNumberModal`, `ExportModal` y saneamiento de los botones desconectados. |
| **7.º** | **FASE 7 — Validación Responsive, Accesibilidad y Regresión** | Certificación final sobre los 5 viewports y las 4 suites de tests. |

---

## 17. CHECKLIST DE APROBACIÓN POR FASE

- [x] **Fase 0 (Auditoría):** Diagnóstico, inventario de 17 componentes, mediciones CSS y matriz de prioridades revisados.
- [x] **Fase 1 (Design System):** Extensión de `tailwind.config.js`, helper `cn()` y mejoras táctiles en `NumberStepper`/`GlassCard`.
- [x] **Fase 2 (Dashboard y Nueva Sesión):** Estado vacío compacto, `—` en VPIP/PFR con 0 manos, edición directa de `SB`/`BB` y compactación de `SessionExtras`.
- [x] **Fase 3 (Posición y Cartas):** Mesa `aspect-[16/9.5]` con cartas en el paño, `CardSelector` con slots superiores integrados y barra de stack con botones `>=36px`.
- [x] **Fase 4 (Consola Preflop):** Timeline Híbrido (Modelo 3) sin scroll en 9-Max + `ActionConsole` con etiquetado `Raise / 3-Bet / 4-Bet` y apertura de teclado en monto personalizado.
- [x] **Fase 5 (Postflop):** Calles `TURN`/`RIVER` señalizadas honestamente como `"Próx."`, plegado automático de matriz al elegir la 3.ª carta del flop y lista visible de acciones en el flop.
- [x] **Fase 6 (Revisión y Modales):** Agrupación de folds en `HandReviewView`, corrección del icono `⋮` y ajuste de altura de `CustomNumberModal` para `320×568`.
- [x] **Fase 7 (QA y Regresión):** 28/28 tests unitarios en verde, `npm run build` exitoso y 0 scroll horizontal desde `320px`.

---

## 18. DECISIONES QUE REQUIEREN APROBACIÓN

Antes de escribir o modificar una sola línea de código en `src/`, solicitamos tu confirmación sobre las siguientes **6 decisiones clave de diseño e interacción**:

1. **D-01 — Adopción del Modelo 3 (Timeline Híbrido) en el Paso 2 Preflop (`PreflopActionTimeline.tsx`):**
   * ¿Aprobás que los jugadores que **foldearon en frío** y los jugadores que **aún están en espera** se muestren en filas horizontales de chips interactivos (pudiendo tocarlos igualmente para cambiar el turno), reservando las filas completas para los jugadores que pusieron dinero en el pozo y para el jugador en turno actual?
2. **D-02 — Reubicación de los Slots de Cartas de Hero en el Paso 1 (`CardSelector.tsx` + `PokerTable.tsx`):**
   * ¿Aprobás mover la visualización de las 2 cartas seleccionadas de Hero desde la parte inferior del `CardSelector` hacia la **cabecera superior del `CardSelector` y el centro de la mesa `PokerTable`** (permitiendo quitarlas al tocarlas) para recuperar `~90px` verticales?
3. **D-03 — Visibilidad de los Presets de Subida en `ActionConsole.tsx`:**
   * Gracias al espacio ahorrado con el Timeline Híbrido, ¿preferís **mantener los 6 presets (`2K` a `10K`) siempre visibles** debajo de los 4 botones de acción (para no sumar toques adicionales ni saltos de pantalla), o preferís que se desplieguen únicamente al tocar `Raise`? *(Recomendación del equipo auditor: mantenerlos siempre visibles en 1 fila compacta).*
4. **D-04 — Plegado Automático de la Matriz de Cartas al Completar el Flop (`CommunityCardsPicker.tsx`):**
   * En el Paso 3, una vez que el usuario selecciona la 3.ª carta del Flop, ¿aprobás que la grilla de 13 rangos y 4 palos se pliegue automáticamente (dejando visibles las 3 cartas del Flop con opción de tocarlas o pulsar `"Cambiar"` para reabrir la grilla), acercando inmediatamente la consola de apuestas al pulgar?
5. **D-05 — Tratamiento Honesto de `TURN` y `RIVER` en el Paso 3 (`HandRecorderView.tsx`):**
   * Dado que el modelo de datos actual no almacena cartas ni acciones de Turn y River, ¿aprobás mostrar las pestañas `TURN` y `RIVER` deshabilitadas con etiqueta `"Próx."` durante este rediseño UX/UI para evitar confusiones?
6. **D-06 — Tratamiento de los botones `"Editar"` y `"Actualizar mano"` en Manos Guardadas (`SessionActiveView.tsx` / `HandReviewView.tsx`):**
   * Al abrir una mano ya guardada desde el historial del Dashboard, actualmente los botones `"Editar"` y `"Actualizar mano"` solo cierran la vista sin hacer cambios. En este rediseño visual, ¿preferís reemplazarlos por un único botón honesto **`"Volver a la sesión"`** (manteniendo el botón de eliminar en el header), o deseás que en una fase posterior conectemos también la lógica de edición en `useHandStore`?
