# UBiK2 · Observatorio territorial CVP

Dashboard en español con Vue 3, Nuxt 4, TypeScript, Tailwind CSS, ECharts y Leaflet. Incluye siete secciones, asistente de IA con backend opcional, consultas básicas locales, dispersión, filtros, fichas, sensibilidad de ponderaciones, descargas y cartografía. La visualización sigue siendo exportable como sitio estático; las preguntas libres de IA requieren un servidor.

## Instalación y ejecución

Requiere Node 24.11 o posterior y npm 10 o posterior. En este equipo: `fnm use 24.18.0`. Se incluyen `.node-version` y `package-lock.json`.

```sh
npm ci
npm run dev
```

```sh
npm run test
npm run typecheck
npm run build
npm run generate
```

La generación produce `.output/public`, listo para un servidor estático. Las secciones usan fragmentos de URL (`#mapa`, `#ficha`), sin reglas de reescritura.

## Información integrada

Se analizaron los cuatro archivos aportados por el usuario:

- `ubik2_indicadores_preliminares.csv`: 95 dominios, 106 columnas, 80 UPZ individuales y 15 agrupaciones en 19 localidades. Sus dominios contienen 112 UPZ integrantes. Una fila representa un dominio completo.
- `UBiK2 · Propuesta Data Jam CVP 2026.pdf`: seis páginas; disponible en Metodología. Describe el alcance propuesto, que se diferencia del resultado preliminar entregado.
- `intervencion_de_mejoramiento_de_barrios.geojson`: 557 elementos geométricos y 233 IDs de intervención distintos; se muestra como capa separada y se puede descargar. No contiene límites de dominios EM.
- `ubik2.png`: logo original incorporado sin alteración en la navegación.

La aplicación carga automáticamente el CSV convertido. El CSV original se conserva y descarga completo. La fecha `2026-10-06` es la fecha de validación preliminar declarada en las filas, **no un corte temporal común de actuaciones**. Los adjuntos no declaran una licencia del CSV o GeoJSON de intervenciones; se indica como pendiente, sin asumir la licencia del repositorio de software.

### Conteos verificados del CSV

| Línea | Registros publicados |
|---|---:|
| Mejoramiento de Barrios | 494 |
| Mejoramiento de Vivienda | 864 |
| Curaduría Pública Social | 1.185 |
| Titulación Predial | 5.899 |
| Reasentamientos | 18.347 |

No se suman líneas como beneficiarios únicos. Los campos de IDs distintos se presentan por dominio; su suma no prueba que sean IDs únicos globales. El GeoJSON de Barrios tiene un universo distinto al del CSV (557 elementos frente a 494 registros; 233 IDs globales frente a 206 IDs distintos sumados por dominio). No se sustituyen los conteos ni se establece una explicación no verificada para esa diferencia.

## Reproducir y actualizar los datos

El esquema revisado está en `data/preliminary-schema.json`. Declara las columnas numéricas explícitamente; conserva como texto los códigos territoriales, nombres, fechas y estados. El conversor preserva los nulos y rechaza códigos de dominio vacíos o duplicados.

```sh
npm run convert -- ruta/ubik2_indicadores_preliminares.csv data/preliminary-schema.json
node scripts/build-domains.mjs
npm run test
npm run generate
```

`scripts/configure-preliminary.mjs` reproduce el esquema de las 106 columnas conocidas. Solo usarlo para esta estructura; si cambia el CSV, revisar antes las columnas y el diccionario. Desde la aplicación se pueden cargar otros CSV y asignar sus campos; la carga es local a la sesión, sin envío a un servidor. El esquema se puede descargar desde Metodología.

El conversor escribe `public/data/dataset.json` y copia el archivo de entrada a `public/data/original.csv`. Con una salida personalizada escribe ambos archivos en ese directorio. Detecta delimitadores, maneja comillas y admite punto o coma decimal sin separadores de miles. Celdas vacías son `null`, nunca cero. Columnas no declaradas numéricas permanecen como texto.

La exportación filtrada incluye las columnas originales convertidas, los tres índices exploratorios y la integralidad. Las columnas añadidas llevan prefijo `ubik2_` y evitan colisiones. Se protegen textos que podrían interpretarse como fórmulas al abrir una hoja de cálculo.

## Metodología aplicada

El panorama sigue la organización del dashboard de referencia aportado el 7 de octubre de 2026: cifras generales, resultados del territorio, mapa con barras y ficha, dispersión necesidad/presencia, comparación territorial y metodología. El explorador general de otras variables permanece disponible en un desplegable.

El escenario V1 de esa entrega se reproduce en `app/utils/scenario.ts`: necesidad física 80 % y pobreza monetaria normalizada 20 %; presencia como promedio de los cinco índices min–max de log(1 + tasa publicada); brecha relativa como diferencia. Las pruebas comparan los cuatro resultados principales de los 95 dominios con `tests/fixtures/scenario-reference.json`, extraído de `datos.json` del paquete de referencia. Los filtros conservan los rangos originales. Se preservan los 106 campos originales y los campos validados vacíos; el escenario se calcula aparte y se añade al exportar la selección del panorama. Jefatura femenina y pobreza multidimensional siguen como contexto. Fórmulas y límites de la entrega: `public/documents/escenario-exploratorio-v1.md`. Las reglas descritas a continuación corresponden al CSV preliminar original.

El modelo definido por el equipo tiene tres medidas, en orden: **necesidad → presencia → brecha**, con `brecha = necesidad − presencia`. Necesidad utiliza la Encuesta Multipropósito y cinco dimensiones: tenencia (Urbanizaciones y Titulación), vivienda (Mejoramiento de Vivienda y Curaduría Pública Social), entorno (Mejoramiento de Barrios), riesgo (Reasentamientos) y vulnerabilidad transversal. Esta última pondera la necesidad total y ayuda a priorizar zonas con brechas similares; no corresponde a una dirección exclusiva. Su regla e indicadores aún deben definirse. El índice de presencia lo desarrollará el equipo a partir de las cinco direcciones; se requiere una escala y alcance comparables para restarlo de necesidad.

La aplicación distingue ese modelo del **CSV preliminar de cuatro dimensiones**. No cambia los índices originales ni introduce un peso supuesto para vulnerabilidad.

- Se utilizan **los índices del CSV**, sin renormalizarlos: `indice_tenencia_relativo`, `indice_vivienda_relativo`, `indice_entorno_relativo`, `indice_riesgo_reportado_relativo`, y las tres columnas de necesidad. Las cuatro dimensiones van de 0 a 100. La reproducción de los promedios ponderados coincide con los índices publicados con error inferior a 0,000001 puntos.
- Se reprodujo `100 × (x − mínimo) / (máximo − mínimo)` sobre `pct_tenencia_proxy`, `pct_deficit_cualitativo`, `entorno_proxy_pct_medio` y `pct_riesgo_reportado_alguno`; el error es inferior a 0,000004 puntos por los valores redondeados del CSV. El proxy medio de entorno coincide con la media de vía mala, iluminación insuficiente y basuras inadecuadas. Esta comprobación numérica no valida los microdatos, el diseño muestral ni la selección de preguntas.
- Pesos iguales: 25% por dimensión. Doble vivienda: 40% vivienda y 20% cada otra dimensión. Doble riesgo: 40% riesgo y 20% cada otra dimensión. Los filtros no recalculan rangos ni índices.
- Para un CSV personalizado sin índices publicados: min–max sobre todos los dominios, con dirección de mayor necesidad explícitamente verificada. Se invierte si es decreciente. Una dimensión constante, sin dirección o faltante impide calcular el índice; no se imputa.
- Las fichas muestran porcentajes originales de tenencia, vivienda, entorno, riesgo reportado y contexto, junto a sus denominadores cuando existen. Propietarios sin escritura usa el subconjunto de propietarios. No se promedian porcentajes entre dominios.
- Pobreza monetaria, pobreza multidimensional y jefatura femenina son contexto diferencial, **fuera del índice preliminar**. El PDF propone una vulnerabilidad transversal, pero no se incorpora arbitrariamente.
- Integralidad: cantidad de las cinco líneas con registros positivos; coincide con `lineas_con_registro_publicado` en las 95 filas. Se requiere dato en las cinco líneas.
- Tasas: las columnas publicadas usan 1.000 hogares expandidos EM 2021; Barrios usa km². Se muestran por dominio sin agregar tasas o cambiar denominadores.
- Vivienda está limitada a `SOLO_PLAN_TERRAZAS`. El archivo reporta 462 programados, 167 en ejecución, 235 asistencias técnicas ejecutadas y 0 no ejecutables. Asistencia técnica ejecutada no equivale a obra terminada ni a cobertura efectiva.
- `indice_presencia_ejecutada_2021_mas`, `brecha_total_validada`, `ranking_priorizacion_validado` e `indice_riesgo_integrado_validado` están vacíos en las 95 filas: «Pendiente de validación». No se calcula brecha restando conteos a necesidad.
- Los códigos de estado misional y riesgo POT se conservan sin asignarles etiquetas no verificadas. Riesgo reportado no equivale a clasificación técnica de amenaza. El PDF plantea riesgo integrado y presencia ejecutada desde 2021; esas etapas todavía no están validadas en el CSV.
- Encuesta 2021 frente a registros de períodos heterogéneos (`TODOS_LOS_REGISTROS_PUBLICADOS_NO_PERIODO_COMUN`). Un orden por necesidad es exploración, no priorización institucional; ausencia de registros CVP no prueba ausencia del Estado. Las descripciones no formulan conclusiones causales.

## Asistente de datos

Abre **Asistente de datos** (`#asistente`). El modo principal usa IA para interpretar preguntas libres y continuaciones, consultar los archivos compartidos mediante herramientas y explicar los resultados en español sencillo. Por ejemplo:

- «¿Cuáles son los 5 dominios con mayor necesidad?»
- «¿Cuántos registros de Barrios hay en Usaquén?»
- «¿Dónde coinciden pobreza alta y viviendas que necesitan mejoras? Explícamelo con los datos».
- «¿Qué relación hay entre necesidad y los registros de Barrios?».
- «¿Cómo se calcula la brecha?» o «¿Qué significa vulnerabilidad?».

Permite elegir archivo completo o los dominios de los filtros actuales. Cada respuesta de IA incluye evidencia numerada obtenida por el servidor: campos, resultados, fuente y páginas del PDF cuando se consultan. Se conserva el historial de hasta seis intercambios recientes para continuaciones, y se puede descargar la conversación. Las herramientas consultan las columnas originales del CSV, el texto de las seis páginas del PDF y las propiedades originales del GeoJSON; no realizan un cruce espacial no validado.

La integración usa [Responses API y herramientas de función](https://developers.openai.com/api/docs/guides/function-calling), con `store: false`. El modelo interpreta y redacta; los filtros, sumas y correlaciones los ejecuta código sobre los datos reales. Se rechazan campos desconocidos y agregaciones incompatibles. No se calculan índices de presencia o brechas a partir de conteos, ni se imputan nulos. La redacción generativa todavía requiere verificar la evidencia; las pruebas con proveedor simulado comprueban el flujo, no la calidad de un modelo externo.

**Estado de esta entrega:** integración implementada, pero sin clave real configurada y sin una llamada al modelo externo. La interfaz muestra «IA pendiente de conexión» en ese caso. La opción «Consulta básica» conserva el motor de reglas local, con capacidades limitadas, identificado explícitamente. La IA usa los archivos publicados del servidor; para un CSV alternativo cargado solo en el navegador se mantiene el modo local, evitando confundirlo con la fuente del servidor.

### Activar la IA

Configura una clave en el entorno del servidor, siguiendo [la documentación oficial de despliegue](https://developers.openai.com/api/docs/guides/production-best-practices). No se introduce en el navegador ni se añade a Git. `.env.example` documenta las variables:

```env
NUXT_OPENAI_API_KEY=valor_configurado_solo_en_el_servidor
NUXT_OPENAI_MODEL=gpt-4.1-mini
NUXT_PUBLIC_AI_ENABLED=true
```

El [modelo configurable predeterminado](https://developers.openai.com/api/docs/models/gpt-4.1-mini) admite Responses y llamadas a funciones. También se acepta `OPENAI_API_KEY` durante desarrollo/compilación; en un servidor compilado usa `NUXT_OPENAI_API_KEY` para la configuración en ejecución.

```sh
npm run build
node .output/server/index.mjs
```

El servidor proporciona `GET /api/assistant/status` y `POST /api/assistant/chat`. Cada navegador conserva su conversación, sin registro de conversaciones en el servidor. Hay validación de cuerpo, orígenes permitidos, 30 consultas por hora/IP y dos consultas simultáneas por proceso/IP; el agente tiene un límite de operaciones y tiempo. En hosting con varias réplicas, configurar también límites y presupuesto del proveedor/perímetro; el límite en memoria no es global entre réplicas.

Si mantienes **GitLab Pages**, despliega el backend aparte y genera el frontend con `NUXT_PUBLIC_AI_BASE_URL=https://tu-backend.example/api/assistant`. En el backend configura `NUXT_AI_ALLOWED_ORIGINS` con el origen exacto de Pages (sin ruta; varios separados por comas). El sitio estático por sí solo no ejecuta el backend y no debe contener la clave.

`npm run prepare:knowledge` reproduce las propiedades del GeoJSON para el agente, conservando huella SHA-256. El texto extraído del PDF está en `data/proposal-text.json`; si se reemplaza el PDF, regenerar ese texto y revisar las páginas. Para comprobar el flujo completo sin una llamada pagada: `npm run build` y `npm run verify:ai`. Esta comprobación inicia un servidor local con proveedor simulado, datos reales y una clave ficticia de prueba; no acredita una conexión externa.

## Diseño y organización

La portada adopta la organización del [observatorio de referencia indicado por el usuario](https://ubik2-observatorio.avainnova.chatgpt.site/): cabecera con logo y descargas, tarjetas de contexto, filtros a la izquierda, mapa al centro y ficha seleccionada a la derecha. Debajo aparecen los diez mayores valores, una tabla ordenable/paginada y explicaciones desplegables. Se conserva el logo entregado y se usa una paleta roja y amarilla sobre fondo gris claro. La navegación horizontal mantiene el asistente, las fichas completas, presencia, necesidad y metodología; las herramientas de asignación de columnas quedan en Metodología o aparecen cuando el archivo necesita configuración.

El panorama comienza en déficit cualitativo y Lucero, cuando ese dominio está disponible. Permite seleccionar nueve porcentajes originales, necesidad exploratoria o integralidad. Localidad, búsqueda y número de líneas con registros afectan simultáneamente mapa, ficha, barras, tabla, tarjetas y descarga de la selección. Los hogares expandidos se redondean solo para presentación; el archivo y la descarga mantienen la precisión original. En móvil, los filtros, mapa y ficha se apilan y las opciones de navegación se desplazan horizontalmente.

Los **gráficos de dispersión** están nuevamente en la portada, bajo la comparación territorial. Ambos ejes se pueden elegir entre porcentajes, dimensiones, necesidad, conteos y tasas publicadas. Mantienen los filtros, muestran pares disponibles, colores por localidad y Pearson descriptivo (sin ponderación ni causalidad). Se pueden intercambiar ejes, seleccionar un punto para actualizar la ficha, revisar los valores en una tabla accesible y exportarlos con sus unidades. Las agrupaciones se mantienen completas.

## Cartografía oficial y adjunta

Se descargó la [capa oficial de planeamiento zonal/rural SDP–Catastro](https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/ordenamientoterritorial/unidadplaneamiento/MapServer/55) el 6 de octubre de 2026, seleccionando `UPLTIPO=1`, campos verificados `UPLCODIGO`, `UPLNOMBRE`, `UPLTIPO` y salida WGS84. Contiene 114 geometrías y 112 códigos UPZ distintos (UPZ52 y UPZ60 tienen dos partes). Las 112 claves coinciden con los integrantes del CSV; no hay claves faltantes ni UPZ asignadas a dos dominios.

`scripts/build-domains.mjs` agrupa **todas** las partes oficiales según `codigos_upz`. Produce 95 features MultiPolygon, una por dominio; preserva los límites internos y no reparte estimaciones. No es una reconstrucción de los límites históricos de la EM 2021: la equivalencia exacta y el corte de esa capa requieren validación SIG. La [ficha IDECA](https://www.ideca.gov.co/recursos/mapas/unidad-de-planeamiento-bogota-dc) identifica la fuente SDP y licencia CC BY 4.0. La procedencia de esta descarga y su limitación están en `public/data/geometry-provenance.json`.

```sh
# Solo si se quiere actualizar la descarga oficial; requiere red.
node scripts/download-upz.mjs
node scripts/build-domains.mjs
```

El mapa funciona con archivos locales, sin teselas externas. Permite seleccionar necesidad, dimensiones, presencia o integralidad y abrir fichas. La capa azul de intervenciones adjuntas se filtra **solo por localidad**, usando `loccodigo`; no tiene un cruce espacial validado por dominio ni altera el CSV. El selector de línea desactiva la capa de Barrios al consultar otra línea. Los códigos de estado se muestran literalmente. Existe carga alternativa de GeoJSON de dominios completos con validación de formato y procedencia; la tabla proporciona consulta por teclado.

## Catálogo oficial

La consulta inicial de búsqueda falló; el [catálogo por entidad](https://datosabiertos.bogota.gov.co/dataset/?organization=caja-de-la-vivienda-popular) permitió identificar las cinco publicaciones. Las fichas consultadas indican CC BY 4.0, enlaces de recursos y diccionarios; sus cortes son 2024-12-23, excepto [Titulación Predial](https://datosabiertos.bogota.gov.co/dataset/titulacion-predial-bogota-d-c), con fecha del dato 2026-03-06. No se confunde modificación del metadato con fecha del dato. El inventario de enlaces verificados aparece en Metodología y en `app/utils/sources.ts`.

Los intentos iniciales de acceder a servicios misionales y diccionarios fallaron; no se interpretan sus códigos. La integración utiliza los archivos entregados. La descarga posterior de la capa oficial UPZ sí fue accesible y se documenta por separado.

## GitLab Pages

`.gitlab-ci.yml` usa Node 24, instala con `npm ci`, ejecuta pruebas y TypeScript, y genera el sitio en la rama principal. `scripts/generate-pages.mjs` deriva la ruta de `CI_PAGES_URL` o respeta `NUXT_APP_BASE_URL`. Para un sitio bajo `/Ubik2/` puedes establecer esa ruta; para un dominio dedicado, `/`.

El directorio publicado es `pages-output`, separado de `public/data`. Usa [`pages.publish`](https://docs.gitlab.com/ci/yaml/#pagespublish), GitLab 17.9 o posterior. No se realizó despliegue remoto en esta entrega.

## Verificaciones

- Veintisiete pruebas automatizadas: tipos, nulos, filtros, ponderaciones, exportación, conversor, consultas locales, herramientas de IA, indicadores del explorador, dispersión/Pearson y comprobación de **cada celda** de las 95 filas y 106 columnas frente al CSV. Las pruebas de IA simulan el transporte del proveedor; los cálculos y las fuentes son reales.
- Totales de las cinco líneas, integralidad y escenarios comprobados contra valores reales.
- Correspondencia completa de códigos y multipartes cartográficos, conservación de agrupaciones y separación del GeoJSON de actuaciones.
- Compilación/generación estática y comprobación TypeScript. `scripts/verify-ui.mjs` usa Edge headless para probar carga inicial real, mapas, filtros, fichas, importación alternativa, descargas, paginación y diseño de escritorio/móvil. También comprueba preguntas, continuación, alcance, apertura de fichas y exportación del asistente. Las capturas están en `artifacts/`, excluidas de Git.
- La prueba de navegador pasó con los 95 dominios reales, las 557 intervenciones (17 al filtrar Usaquén), una ficha de agrupación y el logo. También pasó bajo `/Ubik2/`, comprobando los recursos en la ruta de GitLab Pages y sin errores JavaScript.

Pendientes del equipo: licencias y cortes de los adjuntos, equivalencia histórica de límites, discrepancia del GeoJSON con el CSV, diccionarios de estados/riesgo, presencia ejecutada, índice de riesgo integrado, brecha y ranking institucional. No se implementan resultados prescriptivos ni se dan por demostradas las hipótesis del PDF.

## Organización

`app/components` contiene gráficos, mapas, fichas, metodología y controles; `app/composables` gestiona datos y filtros; `app/types` define modelos; `app/utils` separa cálculos y procedencia. `scripts` reproduce conversión y cartografía; `tests` verifica lógica y archivos reales. Los activos públicos incluyen CSV, JSON, GeoJSON, PDF y logo.

La [bitácora de apoyo de IA](docs/bitacora-ia.md) distingue comprobaciones automatizadas de la validación humana pendiente.
