# UBÍK2: escenario exploratorio V1 — 7 de octubre de 2026

Este escenario complementa el CSV original de 95 dominios con 16 columnas. La fórmula es una propuesta del análisis, no una decisión aprobada por el equipo ni una medida oficial de cobertura. Los 106 campos originales conservan sus valores. Las columnas validadas continúan vacías.

## Fórmulas

Normalización min–max: 100 × (valor − mínimo)/(máximo − mínimo), entre los 95 dominios originales. Los filtros del dashboard no deben recalcular los límites. Si una variable es constante, su índice se define como cero y debe revisarse su utilidad.

- Vulnerabilidad económica V: normalización del porcentaje ponderado de hogares con pobreza monetaria. Pobreza multidimensional y jefatura femenina permanecen como contexto. La jefatura femenina no se trata como carencia. No representa todas las dimensiones de vulnerabilidad.
- Necesidad física N4: índice existente, promedio de tenencia, vivienda, entorno y riesgo reportado, cada uno normalizado. Se conserva sin cambios.
- Necesidad ajustada N: 0,80 × N4 + 0,20 × V. Equivale a cinco componentes de 20 % cada uno, pero V tiene función transversal. Es una operacionalización provisional; la imagen del equipo no define la fórmula. Cambiar el peso modifica la prioridad.
- Presencia por programa: min–max de log(1 + densidad publicada). Vivienda, titulación, reasentamiento y curaduría usan registros por 1.000 hogares representados EM 2021. Barrios usa elementos por km². La transformación logarítmica reduce la influencia de concentraciones extremas. Los componentes son relativos; no se suman registros de unidades diferentes.
- Presencia P: promedio de los cinco índices por programa, peso 20 % cada uno. No ajusta por elegibilidad, presupuesto, fechas, finalización o número de beneficiarios. Vivienda representa solo Plan Terrazas.
- Brecha B: N − P, entre −100 y 100 puntos de índice. Positiva: necesidad relativa mayor que presencia relativa según esta fórmula. Negativa: presencia relativa mayor que necesidad relativa; no prueba exceso de ayuda. Cero: igualdad de índices, no necesidad resuelta. No es un porcentaje ni una cantidad de hogares sin atención. Escalar ambos índices a 0–100 no garantiza equivalencia sustantiva; la resta es una hipótesis de exploración.
- Prioridad de revisión: posición descendente de B, con empates usando el menor puesto. No es una priorización institucional ni determina subsidios.
- Sensibilidad: B sin vulnerabilidad y con pesos de vulnerabilidad de 10 % y 30 %. El peso de N4 es el complemento.

## Limitaciones para focalizar

Necesidad medida en 2021; registros CVP de períodos heterogéneos. No se presupone ejecución desde 2021. Cero significa ningún registro asignado en el archivo disponible; no demuestra ausencia de atención. Las agrupaciones UPZ mantienen un resultado conjunto. Registros sin asignación territorial quedaron fuera y están auditados en la entrega previa. No se calcularon errores estándar ni intervalos de confianza. La pobreza y el déficit pueden estar correlacionados; no se ha validado la independencia de componentes. Min–max depende de extremos y de la versión de los datos.

Usar el escenario para seleccionar territorios que requieren investigación, junto con sus indicadores originales, tamaños muestrales y registros por programa. Para una focalización operativa se requiere revisión del equipo, comparación por programas y períodos, sensibilidad y validación de hogares elegibles. No interpretar el orden como efecto causal, desempeño, cumplimiento ni brecha real de atención.

## Columnas principales añadidas

- `indice_vulnerabilidad_economica_exploratorio`
- `indice_necesidad_ajustado_vulnerabilidad_exploratorio`
- `indice_presencia_{vivienda,titulacion,barrios,reasentamiento,curaduria}_publicada_exploratorio`
- `indice_presencia_publicada_exploratorio`
- `brecha_relativa_exploratoria`
- `brecha_relativa_sin_vulnerabilidad_exploratoria`
- `prioridad_revision_exploratoria`
- `brecha_sensibilidad_vulnerabilidad_10pct`
- `brecha_sensibilidad_vulnerabilidad_30pct`
- `metodo_indices_exploratorios`, `estado_nuevos_indices`, `fecha_calculo_nuevos_indices`

Fuentes: las mismas de la entrega previa (EM 2021 y archivos CVP espaciales), registradas en `fuentes.json` del paquete de validación. No se añadieron observaciones inventadas ni nuevos microdatos. Reproducción: ejecutar `calcular.py` con `base_original.csv` en la misma carpeta y pandas/numpy disponibles.
