# Metodología de la entrega final UBiK2

Este documento describe la base final y el comportamiento vigente del visor. Los cuadernos de la especialista son la referencia de construcción; la propuesta PDF, el CSV preliminar y el escenario V1 son antecedentes y no sustituyen esta metodología.

## Unidad de análisis y procedencia

La unidad de análisis es el territorio estadístico de la Encuesta Multipropósito (EM) 2021: 95 territorios, correspondientes a 80 UPZ individuales y 15 agrupaciones, con 112 UPZ integrantes. Una agrupación conserva su resultado conjunto; el visor no reparte sus estimaciones entre las UPZ que la componen.

La cadena documentada es:

1. `insumos/metodologia/01_capas_geograficas.ipynb`: cartografía, asignación territorial, presencia misional y amenaza.
2. `insumos/metodologia/02_necesidad_em2021.ipynb`: indicadores de hogares de la encuesta.
3. `insumos/metodologia/03_indices_brecha.ipynb`: unión de productos, normalización, índices, brecha, posición y categorías.
4. `insumos/datos_procesados/`: productos procesados, incluidos GeoPackage, Excel, CSV y GeoJSON.
5. `scripts/import-final-data.py`: importa los atributos del GeoJSON final, añade `tipo_dominio` y esquema, e incorpora el diccionario. Produce `public/data/final-dataset.json` y el CSV para descarga; no reconstruye los índices desde microdatos.

El visor carga ese JSON y utiliza la cartografía `public/data/upz_brecha_95.geojson`. Los atributos territoriales originales se conservan; las conversiones a porcentaje y los consolidados son cálculos de presentación.

## Indicadores de necesidad

Los indicadores de hogares se calculan sobre todos los hogares del territorio, ponderados por `FEX_C`: el factor de expansión indica cuántos hogares representa cada hogar encuestado.

- **Tenencia:** hogares en otra forma de tenencia (código 6) o propietarios sin escritura registrada, según las reglas del cuaderno 02.
- **Vivienda:** déficit habitacional de las variables adicionales de la SDP, con componentes cuantitativo y cualitativo.
- **Entorno:** vía sin pavimentar, vía en mal estado o ausencia de andén; la iluminación se conserva como detalle y no entra en el indicador principal.
- **Vulnerabilidad:** hogares con jefatura femenina en pobreza monetaria, divididos entre todos los hogares del territorio. No mide toda la jefatura femenina.
- **Amenaza:** porcentaje del área del territorio en amenaza alta por movimientos en masa. Es una medida de área, no de hogares expuestos ni de riesgo integral; no incluye inundación.

Los indicadores de encuesta `ind_*` originales están en proporción 0–1 y se multiplican por 100 para mostrar porcentajes. Los campos normalizados `*_n` no representan porcentajes de hogares. Los porcentajes de amenaza ya están en escala 0–100.

## Normalización, índices y brechas

Las diez variables del modelo (cinco dimensiones de necesidad y cinco tasas de presencia) se normalizan a 0–1 sobre los 95 territorios. Se limita cada variable a su percentil 95 y se aplica min–max entre el mínimo y ese tope. Si el percentil coincide con el mínimo, el cuaderno usa el máximo. Los resultados se redondean a cuatro decimales. Los filtros no recalculan esta normalización.

El cuaderno 03 calcula promedios simples de cinco componentes: suma los cinco valores y divide entre cinco. Cada componente tiene el mismo peso, una quinta parte o **20 %**. Este peso no es un porcentaje de hogares.

- **Necesidad:** promedio de tenencia, vivienda, entorno, amenaza alta y vulnerabilidad normalizados.
- **Presencia:** promedio de las tasas normalizadas de Titulación, Vivienda, Curaduría Pública Social, Barrios y Reasentamientos.
- **Brecha:** necesidad menos presencia; escala −1–1.

Cada dimensión se compara además con la línea de la CVP que la atiende (brecha por línea): tenencia–Titulación, vivienda–Vivienda y Curaduría, entorno–Barrios y amenaza alta–Reasentamientos. En vivienda se normaliza la suma de las tasas de Vivienda y Curaduría Pública Social; no se suman sus índices ya normalizados.

La posición ordena la brecha de mayor a menor; los empates comparten la menor posición (`rank(method="min")`). Las categorías son quintiles: cinco grupos de 19 territorios en el archivo final. **Muy baja** describe brecha relativa, no necesidad baja. La paleta del mapa es: Muy baja `#FFF1A6`, Baja `#FFDE09`, Media `#F7B325`, Alta `#E3351F`, Muy alta `#AA1023` y Sin dato `#C4C4C4`. Los colores no cambian los valores ni las categorías.

Los cuadrantes del cuaderno clasifican necesidad alta o baja respecto a la mediana y presencia por encima o no de su mediana. En la base revisada, la mediana de presencia es cero; por eso se interpretan como con o sin registros. El GeoJSON conserva las etiquetas alta/baja presencia exportadas antes del cambio de texto en el cuaderno. La ficha individual utiliza los valores entregados y no asigna clasificaciones institucionales nuevas.

## Temporalidad y unidades

| Componente | Referencia documentada |
|---|---|
| Encuesta y hogares de referencia | EM 2021 |
| Vivienda | Plan Terrazas; fechas de estado 16/12/2021–20/11/2024; ejecutados y en ejecución |
| Curaduría Pública Social | Fechas de acto 28/05/2021–31/10/2024; 18 registros sin fecha en la capa |
| Titulación | Histórico 2015–2025; siete registros sin fecha en la capa |
| Barrios | Contratos 2020–2023; no se filtra por terminación |
| Reasentamientos | Histórico de procesos terminados; año extraído del identificador, no fecha de terminación |
| Amenaza | IDIGER 2016 según el diccionario final |
| Descarga de las ocho fuentes | 10/10/2026 en `fuentes.csv` |

Las tasas se expresan por cada 1.000 hogares expandidos de la EM 2021. Las unidades de líneas distintas no se suman como beneficiarios únicos; la suma Vivienda + Curaduría Pública Social se utiliza en la brecha de vivienda porque ambas se miden en predios. Las sumas de IDs distintos por territorio no acreditan unicidad global.

Fecha de descarga, período de las actuaciones, fecha de generación del reporte y validación son conceptos distintos. No existe un corte común ni una fecha de validación institucional acreditada en los archivos revisados.

## Cartografía

El cuaderno 01 usa la capa DADEP Espacio Público Total por UPZ 2021, agrupada por territorio. Los cálculos espaciales se realizan en EPSG:9377. Las copias web se simplifican y reproyectan a WGS84.

Las actuaciones se asignan mediante un punto interior de su geometría. Se asignaron por cercanía 63 elementos de Barrios fuera de los límites, hasta 200 m; es una decisión metodológica documentada del equipo. El mapa de amenaza superpuesto permite consultar las categorías alta y media.

## Selección y ficha

El checklist incluye UPZ o agrupaciones completas. Al cambiar de localidad se marcan todos sus territorios. **Seleccionar todas** incluye todos los territorios disponibles de la localidad, incluso si la lista tiene una búsqueda activa. La búsqueda filtra las opciones por nombre o código y conserva las casillas marcadas.

El mapa, tarjetas, consolidados, gráficos, comparación y exportación del panorama usan los territorios marcados junto con los otros filtros activos. El filtro de cantidad de líneas conserva territorios con la integralidad solicitada.

Elegir una localidad o cambiar casillas muestra el consolidado. Dejar una sola casilla marcada también mantiene el modo consolidado: la ficha individual se abre al pulsar explícitamente un territorio del mapa o la tabla. Limpiar la selección territorial devuelve el consolidado.

El selector del mapa ofrece 14 medidas: tres índices principales, cinco dimensiones originales de necesidad, cinco tasas misionales e integralidad. Los componentes y conteos permanecen en las fichas, los datos adicionales y las descargas.

## Consolidados

Los consolidados resumen los territorios visibles; no son una nueva tabulación de microdatos ni nuevos índices oficiales de localidad o Bogotá.

| Medida | Regla |
|---|---|
| Conteos de actuaciones, hogares y áreas | Suma de valores territoriales |
| Tasas misionales | Total de registros / total de hogares representados × 1.000 |
| Indicadores de hogares | Promedio de las proporciones ponderado por hogares representados; se muestra × 100 |
| Necesidad, presencia y brechas | Promedio ponderado por hogares representados de los valores finales |
| Porcentaje de amenaza | Promedio ponderado por `area_ha` |
| Integralidad | Cantidad de líneas con registros positivos en la selección |
| Ranking, quintil y cuadrante | No se asignan al consolidado |

El promedio ponderado es `suma(peso × valor) / suma(peso)`. Para indicadores de hogares e índices el peso es `hogares_expandidos`; para amenaza es el área.

La ficha consolidada presenta amenaza, condiciones de hogares, índices y presencia por línea; el resto permanece en **Otros datos consolidados**. Los gráficos reutilizan esas mismas reglas. Posición y quintil indican **No aplica al consolidado**.

## Ceros, faltantes y precisión

Cero presencia significa sin registros en las capas utilizadas, no ausencia de toda actuación. **Sin dato** indica información faltante; el visor no la sustituye por cero.

Los cálculos consolidados requieren los valores y pesos necesarios. Una selección vacía o un dato requerido faltante produce `null`, presentado como Sin dato. Para los promedios de hogares se exigen pesos positivos; las áreas de amenaza no pueden ser negativas y su total debe ser positivo.

Los porcentajes consolidados son aproximaciones a partir de proporciones publicadas redondeadas. El redondeo de pantalla puede hacer que restar índices mostrados difiera ligeramente de la brecha mostrada. El tamaño de muestra no sustituye una estimación de incertidumbre ni prueba diferencias estadísticamente significativas.

## Fuentes y licencia

`data/final-sources.json` reúne la procedencia registrada en `fuentes.csv` y los cuadernos: cinco líneas CVP, encuesta, cartografía DADEP y amenaza IDIGER. El registro actualizado documenta la descarga de las ocho fuentes el 10/10/2026, sus archivos y notas. Puede descargarse desde la tabla de fuentes del visor como `public/data/fuentes.csv`. Los enlaces consignados no acreditan disponibilidad actual.

El catálogo consultado el 6 de octubre de 2026 se conserva como **antecedente histórico**, independiente de la tabla de fuentes finales. Sus estados pendientes corresponden a esa consulta.

**Los productos de UBiK2 se publican bajo licencia CC BY 4.0; cada fuente conserva la licencia de su portal de origen.** Esta declaración fue indicada por el responsable del proyecto. No modifica la licencia del código en `LICENSE` ni atribuye CC BY 4.0 indiscriminadamente a las fuentes originales.

## Reporte territorial PDF

**Descargar reporte PDF** genera localmente un documento de los territorios visibles, o de la ficha individual activa. Se captura el alcance al pulsar el botón. Incluye indicador, hogares, índices, condiciones de hogares, amenaza, conteos de las cinco líneas, mapa, gráficos, fuentes y lista de territorios.

La conclusión sigue reglas según el signo de la brecha, con precisión completa; no inventa prioridades ni cobertura. Los valores se redondean al presentarlos. La fecha de generación utiliza `America/Bogota`.

El mapa se recompone desde el GeoJSON y no incorpora el zoom ni las capas superpuestas; el reporte lo indica. La generación no agrega dependencias ni envía datos a un servidor. Una selección vacía deshabilita el botón; los errores de carga se muestran en pantalla.

## Verificaciones realizadas y pendientes

Se contrastaron el CSV final, la capa `upz_brecha_95` del GeoPackage, la tabla de presencia y `riesgo_95.csv` con los atributos del JSON del sitio. No se encontraron diferencias. Los GeoJSON final y de amenaza tienen contenido equivalente a las copias entregadas. Se reprodujeron normalización, tasas, índices y ranking contra los valores finales.

Las pruebas automatizadas verifican cálculo, selección, nulos, exportación y reportes. Las pruebas de navegador verifican localidad, checklist, consolidados, ficha individual, popup, metodología y descargas PDF. Se renderizaron y revisaron documentos general e individual.

Estas comprobaciones acreditan consistencia de software y productos revisados; **no sustituyen validación estadística o institucional**.

Siguen pendientes de esta revisión: contraste completo del Excel de necesidad, auditoría desde microdatos del tratamiento de faltantes y diseño muestral, reproducción de los cruces espaciales y confirmación documental de códigos CPS/AR. La existencia de los archivos o el éxito de una prueba del visor no implica que esas auditorías se hayan completado.

Para ejecutar las verificaciones, consultar el README. Las comprobaciones del asistente usan un proveedor simulado y no validan una cuenta real; la IA no forma parte de las correcciones del visor aquí documentadas.

La tarjeta Fecha del análisis conserva 11/10/2026, declarado en el commit remoto 509da94. Esta referencia no es el año de encuesta (2021), la fecha de descarga de capas (10/10/2026), un corte común de actuaciones ni una validación institucional.
