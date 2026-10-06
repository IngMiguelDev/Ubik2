# UBiK2 · Observatorio territorial CVP

Dashboard estático en español con Vue 3, Nuxt 4, TypeScript, Tailwind CSS, ECharts y Leaflet. Incluye seis secciones, navegación plegable, filtros combinados, búsqueda, paginación, comparación de ponderaciones, fichas y descargas. Sin autenticación ni backend.

## Ejecutar

Requiere **Node 24.11 o posterior** y npm 10 o posterior. Se incluye `package-lock.json` para instalaciones reproducibles. En este equipo ya está instalado Node 24.18.0; si usas fnm, ejecuta `fnm use 24.18.0` antes de npm (la sesión inicial usaba Node 20).

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

La generación estática produce `.output/public`. Sirve ese directorio con cualquier servidor estático. Las secciones usan fragmentos de URL (`#mapa`, `#ficha`, etc.), por lo que no requieren reglas de reescritura del servidor.

## Datos pendientes

En esta entrega solo estuvo disponible el texto de la solicitud. **No estaban adjuntos el PDF Data Jam CVP 2026, `ubik2_indicadores_preliminares.csv` ni la imagen de referencia.** El repositorio original solo contenía README y LICENSE. El archivo público inicial es un conjunto vacío explícito, sin cifras simuladas. No fue posible analizar la estructura real del CSV, comprobar sus conteos ni contrastar la metodología con el PDF.

Puedes cargar un CSV en la aplicación y asignar sus columnas mediante el formulario. La carga es local a la sesión y no se envía a un servidor ni modifica el repositorio. El archivo debe contener **una fila por dominio**, con código único; no se aceptan códigos vacíos o duplicados. Los códigos permanecen como texto. El tipo territorial proviene del archivo; no se deduce por el nombre del dominio.

Solo asigna dimensiones numéricas con significado verificado. Un código de estado o riesgo no es un indicador continuo. Documenta las unidades y el sentido de mayor necesidad con el diccionario. Los campos sin asignación se mantienen sin dato. Pobreza y jefatura femenina se muestran como contexto, fuera del índice.

## Actualización reproducible

1. Carga el archivo real, verifica su diccionario, asigna las columnas y registra fuente, fecha y licencia en la aplicación.
2. En Metodología, descarga el esquema JSON; este contiene los nombres **reales** de las columnas y la lista explícita de columnas numéricas.
3. Ejecuta:

```sh
npm run convert -- ruta/ubik2_indicadores_preliminares.csv ruta/ubik2_esquema.json
npm run generate
```

El conversor detecta el delimitador, interpreta campos entre comillas, preserva códigos con ceros iniciales, convierte únicamente columnas numéricas declaradas y conserva celdas vacías como `null`. Admite punto o coma decimal sin separador de miles; rechaza números ambiguos o textos en columnas numéricas. Escribe `public/data/dataset.json` y una copia del CSV original en `public/data/original.csv`. Con salida personalizada, ambos archivos se escriben en el directorio de salida.

Las columnas no asignadas se conservan como texto, para no inferir tipos ni reinterpretar códigos. El original se descarga completo; los resultados filtrados incluyen las filas convertidas, los tres índices exploratorios y la integralidad, preservando nulos y protegiendo frente a fórmulas de hojas de cálculo. Las columnas calculadas llevan prefijo `ubik2_` (con prefijos adicionales si hay colisiones). Ninguna transformación desagrega dominios agrupados ni deduplica beneficiarios entre líneas.

## Cálculos y limitaciones

- Índice exploratorio: normalización min–max de cada dimensión sobre todo el archivo, con dirección explícitamente verificada. Si mayor valor significa menor necesidad, se invierte el rango. Los filtros no cambian la normalización. Es una decisión provisional de implementación, pendiente de contraste con el PDF.
- Pesos: iguales (25% por dimensión), vivienda doble (40% vivienda y 20% otras) y riesgo doble (40% riesgo y 20% otras). Resultado de 0 a 100. Una dimensión faltante, sin dirección o constante produce «Sin dato»; no se imputan valores.
- Integralidad: número de las cinco líneas con conteo mayor a cero. Solo se calcula cuando las cinco tienen dato. Un cero explícito es diferente de un nulo.
- Los totales por línea suman únicamente valores disponibles. Son sumas parciales cuando hay nulos; la sección Presencia indica cuántos dominios tienen dato. Las tasas e identificadores distintos del CSV se muestran por dominio sin agregarlos ni inventar denominadores.
- Brecha, ranking y actuaciones ejecutadas vacíos: «Pendiente de validación». No se calcula brecha entre el índice y los conteos. Un orden por necesidad es exploración, no priorización institucional.
- Encuesta EM 2021 frente a publicaciones misionales de períodos heterogéneos. Presencia publicada no equivale a cobertura efectiva, ni su ausencia a ausencia del Estado. Registros de distintas líneas no se suman como beneficiarios únicos.
- El servicio oficial de Mejoramiento de Vivienda describe Plan Terrazas. Falta comprobar si ese mismo alcance aplica al CSV.

## Fuentes oficiales

Consulta realizada el **6 de octubre de 2026**. El enlace inicial de búsqueda falló, pero el [catálogo por entidad](https://datosabiertos.bogota.gov.co/dataset/?organization=caja-de-la-vivienda-popular) permitió identificar las cinco publicaciones. Se verificaron fichas, fechas del dato, licencia CC BY 4.0 y enlaces anunciados; los intentos de acceder a servicios y diccionarios dieron errores o tiempos de espera. Por eso sus campos y códigos permanecen sin interpretación. El inventario está en `app/utils/sources.ts` y aparece en la aplicación.

| Conjunto | Fecha del dato | Recursos anunciados |
|---|---|---|
| [Mejoramiento de Barrios](https://datosabiertos.bogota.gov.co/dataset/mejoramiento_barrio) | 2024-12-23 | REST, WMS, WFS, HTML y formatos geográficos |
| [Mejoramiento de Vivienda](https://datosabiertos.bogota.gov.co/dataset/mejoramiento-de-vivienda) | 2024-12-23 | REST, WMS, WFS y formatos geográficos |
| [Curaduría Pública Social](https://datosabiertos.bogota.gov.co/dataset/tramite-curaduria-publica-social) | 2024-12-23 | REST, WMS, WFS y formatos geográficos |
| [Titulación Predial](https://datosabiertos.bogota.gov.co/dataset/titulacion-predial-bogota-d-c) | 2026-03-06 | REST, WMS, WFS, HTML y formatos geográficos |
| [Reasentamiento](https://datosabiertos.bogota.gov.co/dataset/reasentamiento-humano) | 2024-12-23 | REST, WMS, WFS, HTML y formatos geográficos |

Las fechas de modificación de metadatos no se usan como cortes de actuaciones. Los diccionarios enlazados son referencias identificadas, no contenidos verificados.

## Cartografía

El explorador permite cargar GeoJSON oficial de **dominios completos**, en WGS84, asignar la propiedad de código y registrar procedencia/licencia. Exige confirmar que las agrupaciones tienen geometrías unidas. La unión con el CSV es por código exacto; geometrías sin coincidencia o sin indicador se muestran grises. Permite zoom, consulta de valores, selección y ficha; la tabla proporciona la alternativa mediante teclado. No depende de teselas externas.

Se identificó la [fuente IDECA de unidades de planeamiento](https://www.ideca.gov.co/recursos/mapas/unidad-de-planeamiento-bogota-dc), CC BY 4.0. Su enlace REST actual conduce a UPL y la descarga GeoJSON respondió 403. También se verificó una [capa de planeamiento zonal/rural](https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/ordenamientoterritorial/unidadplaneamiento/MapServer/55), pero no la correspondencia histórica con los dominios EM 2021. No se incorporó como geometría de dominios. Sin el CSV y una tabla verificada de pertenencia de UPZ, no se puede construir correctamente la geometría de sus agrupaciones.

## GitLab Pages

El pipeline `.gitlab-ci.yml` instala, prueba, comprueba tipos y genera los archivos estáticos. Publica únicamente en la rama principal cuando el repositorio se suba a GitLab; esta entrega no realiza despliegues.

El pipeline deriva la ruta base de `CI_PAGES_URL` y respeta `NUXT_APP_BASE_URL` si la defines explícitamente. Para forzar un sitio bajo `/Ubik2/`, configura `NUXT_APP_BASE_URL=/Ubik2/` en las variables de CI. Para un dominio dedicado o Pages con dominio único usa `/`. El directorio publicado es `pages-output`, separado de los archivos fuente `public/data`. La configuración usa [`pages.publish`](https://docs.gitlab.com/ci/yaml/#pagespublish) de GitLab 17.9 o posterior.

## Organización

- `app/components`: controles reutilizables, gráficos, cartografía, fichas y fuentes.
- `app/composables/useTerritorialData.ts`: carga, asignación, filtros y descargas.
- `app/types`: modelos y líneas misionales.
- `app/utils`: CSV, indicadores, opciones ECharts y procedencia.
- `scripts/convert-csv.mjs`: conversión reproducible.
- `tests`: pruebas de nulos, tipos, filtros, ponderaciones y conversor con datos artificiales exclusivamente de prueba.
- `scripts/verify-ui.mjs`: comprobación funcional con Playwright y Edge. Ejecutar `node scripts/verify-ui.mjs` después de generar; produce capturas en `artifacts/`. No modifica los datos públicos.

Antes de usar resultados institucionales, el equipo debe aportar los tres adjuntos y validar unidades, columnas, ponderaciones, cortes, licencias, claves de unión y geometrías de las agrupaciones.

## Verificaciones de esta entrega

- Seis pruebas automatizadas aprobadas: tipos, nulos, conteos parciales, filtros combinados, sensibilidad de pesos, exportación y conversión reproducible.
- Comprobación completa con `nuxt typecheck` y compilación/generación estática sin errores.
- Edge headless: escritorio de 1440 px y móvil de 390 px, sin desbordamiento horizontal de la página ni errores JavaScript. Se revisaron las capturas.
- Prueba funcional con un CSV artificial de 12 dominios: paginación, filtrado a 6 dominios por localidad y a 5 con registros de Barrios, búsqueda sin resultados, limpieza, descarga de 12 filas, fichas con campos pendientes y carga/selección de un polígono GeoJSON de prueba.
- La misma prueba pasó bajo `/Ubik2/`, verificando carga de datos y recursos con la ruta base de Pages.

Estas pruebas verifican el comportamiento de la aplicación. **No validan los conteos del CSV solicitado, que no estuvo disponible**, ni la oficialidad de geometrías aportadas por un usuario. GitLab CI no se ejecutó en un servidor remoto.
