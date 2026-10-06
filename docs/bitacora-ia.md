# Bitácora de apoyo de IA

Fecha: 6 de octubre de 2026. Herramienta: Codex en el repositorio UBiK2.

La solicitud del usuario fue construir y después completar un dashboard Nuxt/Vue con archivos agregados, logo, propuesta PDF y GeoJSON. El apoyo de IA se usó para implementar componentes, leer la estructura de los adjuntos, producir el esquema de conversión, construir multipartes de dominios con una capa oficial y documentar las limitaciones.

Comprobaciones automatizadas: las 95 filas y 106 columnas del JSON coinciden con el CSV; los totales de las cinco líneas y la integralidad coinciden; los tres índices publicados reproducen los promedios ponderados de las cuatro dimensiones dentro de 0,000001 puntos. Se verificaron 112 códigos UPZ integrantes, sin claves faltantes ni doble asignación entre dominios.

Decisiones analíticas conservadoras: mantener los índices publicados sin renormalizarlos, no imputar nulos, no calcular brecha o ranking, no traducir códigos de estado/riesgo sin diccionario y separar el GeoJSON de intervenciones de los conteos del CSV. La propuesta no se considera prueba de sus hipótesis.

Validación humana pendiente: significado y construcción de proxies de la encuesta, diccionarios, denominadores, equivalencia de límites históricos, licencias de adjuntos, discrepancia cartográfica, estados de ejecución, riesgo integrado y cualquier priorización institucional. No se atribuye a una revisión humana lo que fue una prueba de código.

Se utilizaron cifras agregadas y geometrías entregadas o públicas. No se enviaron comunicaciones externas ni se realizó un despliegue remoto.
