# UBiK2 · Observatorio territorial CVP

Visor territorial en español para explorar la entrega final de necesidad habitacional, presencia CVP y brecha en Bogotá. Está construido con Nuxt 4, Vue 3, TypeScript, Tailwind CSS, ECharts y Leaflet. La navegación principal contiene Panorama territorial y Metodología y fuentes.

## Instalación y ejecución

Requiere Node >=24.11 y npm >=10. `.node-version` y `package-lock.json` registran el entorno y dependencias del proyecto.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run typecheck
npm run build
npm run generate
```

La generación produce `.output/public` para un servidor estático. La navegación usa fragmentos como `#panorama` y `#metodologia`. Los recursos respetan `NUXT_APP_BASE_URL`.

## Base vigente y metodología

El visor carga `public/data/final-dataset.json`, importado de `upz_brecha_95.geojson`: 95 territorios estadísticos, 80 UPZ individuales y 15 agrupaciones, con 112 UPZ integrantes. Conserva los valores originales de índices, ranking y categorías. La encuesta es EM 2021; las capas misionales tienen períodos distintos.

La [metodología final](docs/metodologia-final.md) documenta fórmulas, normalización con tope en percentil 95, pesos iguales del 20 %, temporalidad, cartografía, consolidados, fuentes, licencia y limitaciones.

Los cuadernos de construcción están en `insumos/metodologia/` y los productos entregados en `insumos/datos_procesados/`. La importación se reproduce así:

```sh
python scripts/import-final-data.py "insumos/datos_procesados/web"
```

Este comando importa el GeoJSON y diccionario; no reconstruye el análisis desde microdatos. Requiere Python. Los conteos finales sumados por territorio son:

| Línea | Valor | Unidad |
|---|---:|---|
| Mejoramiento de Vivienda | 402 | Predios ejecutados o en ejecución de Plan Terrazas |
| Curaduría Pública Social | 1.185 | Predios con acto de reconocimiento |
| Titulación | 5.893 | Predios únicos por territorio |
| Reasentamientos | 9.408 | Procesos terminados |
| Barrios | 233 | Tramos únicos por territorio |

No se suman líneas como hogares beneficiados ni se interpreta la suma de IDs por territorio como unicidad global.

## Exploración y consolidados

- Elegir localidad marca automáticamente sus territorios. El checklist permite marcar varias UPZ o agrupaciones completas.
- La búsqueda filtra la lista por nombre o código sin alterar las casillas. Seleccionar todas incluye todos los territorios disponibles de la localidad.
- Las tarjetas, ficha, gráficos y comparación presentan el consolidado de los territorios visibles. Una sola casilla marcada mantiene el modo consolidado.
- Pulsar un territorio en mapa o tabla muestra sus valores individuales. Limpiar selección territorial devuelve el consolidado.
- Los conteos y áreas se suman; tasas usan los totales; indicadores de hogares e índices se ponderan por hogares; amenaza se pondera por área. El consolidado no recibe ranking, quintil ni cuadrante.
- El mapa ofrece 14 indicadores analíticos. Los quintiles originales permanecen estables; Media usa amarillo `#ffc400`. Amenaza IDIGER puede activarse como superposición.
- Cómo leer los datos abre una guía accesible en un popup con branding UBiK2.

El panorama cuenta una historia visual en tres preguntas: necesidad, presencia y brecha. Un recorrido de tres pasos permite ir a los filtros, los resultados y la comparación con navegación por teclado. Las tarjetas de territorio, muestra, hogares representados y fecha comparten un mismo grupo con los índices de necesidad, presencia y brecha. Las explicaciones de cálculo y términos se consultan en el instructivo. El instructivo contiene una primera consulta paso a paso y un diccionario, y permanece disponible en celular.

«Una exploración trazable» presenta la metodología como una línea de tiempo con ilustraciones, navegación entre etapas y animaciones al recorrerla. Conserva el texto metodológico y usa «Territorio» en toda la interfaz. La animación respeta la preferencia de movimiento reducido.

La descarga CSV del panorama corresponde a los territorios visibles. Las funciones de CSV alternativo se conservan para uso local de sesión; no modifican la entrega final publicada.

## Reporte territorial PDF

Descargar reporte PDF genera un documento de la selección actual o de la ficha individual activa. Incluye alcance, mapa, gráficos, hogares, índices, condiciones de hogares, presencia CVP, fuentes, períodos y conclusión basada en reglas.

Se genera en el navegador sin enviar datos a un proveedor externo. La fecha usa hora de Bogotá. El mapa reproduce el indicador y los territorios, no el zoom ni las capas superpuestas. Una selección vacía deshabilita la descarga. La metodología detalla las reglas y límites.

## Verificaciones

```sh
npm test
npm run typecheck
npm run generate
node scripts/verify-final-ui.mjs
node scripts/verify-report-ui.mjs "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
```

Las pruebas de interfaz usan Playwright y Microsoft Edge. verify-final-ui puede detectar Edge automáticamente; verify-report-ui recibe la ruta de su ejecutable. Ajustar la ruta a la instalación local:

```sh
node scripts/verify-final-ui.mjs "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
node scripts/verify-report-ui.mjs "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
```

Cada script inicia y cierra su servidor temporal. Los PDF y capturas de prueba se guardan en `artifacts/`, excluido de Git. Las pruebas cubren lógica territorial, consistencia de archivos, consolidados, filtros y reportes. Las verificaciones del asistente simulan el proveedor.

La consistencia comprobada no equivale a validación estadística o institucional. Continúan pendientes el contraste completo del Excel de necesidad, la auditoría de microdatos y faltantes, la reproducción de cruces espaciales y confirmaciones documentales específicas.

## Publicación estática

`.gitlab-ci.yml` instala dependencias, ejecuta pruebas y TypeScript y genera el sitio en la rama principal. `scripts/generate-pages.mjs` deriva la ruta de `CI_PAGES_URL` o respeta `NUXT_APP_BASE_URL`. El directorio de publicación es `pages-output`, separado de los insumos públicos.

La generación local no publica el sitio. El repositorio también conserva el backend opcional del asistente; sus instrucciones históricas están enlazadas abajo. Este trabajo no cambió ni activó la IA.

## Documentación y antecedentes

- [Metodología final](docs/metodologia-final.md): referencia vigente del visor.
- [Registro histórico del README](docs/historial-readme.md): documentación anterior del CSV preliminar, escenario V1 y backend; no describe el estado actual del panorama.
- [Bitácora de apoyo de IA](docs/bitacora-ia.md): registro histórico de comprobaciones y decisiones.
- `data/final-sources.json`: procedencia de las fuentes finales basada en archivos y cuadernos.
- `public/data/`: entrega final, diccionario y archivos históricos identificados.

Los productos de UBiK2 se publican bajo licencia CC BY 4.0; cada fuente conserva la licencia de su portal de origen. La declaración de productos no cambia la licencia del código en `LICENSE`.

## Organización

`app/components/` contiene mapas, fichas, gráficos, metodología y controles; `app/composables/` gestiona carga y filtros; `app/types/` define tipos; `app/utils/` contiene cálculos y generación PDF. `scripts/` prepara insumos y verifica interfaz; `tests/` verifica lógica y archivos. `insumos/` conserva cuadernos y productos entregados.
