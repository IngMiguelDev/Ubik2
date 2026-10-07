# Bitácora de apoyo de IA

Fecha: 6 de octubre de 2026. Herramienta: Codex en el repositorio UBiK2.

La solicitud del usuario fue construir y después completar un dashboard Nuxt/Vue con archivos agregados, logo, propuesta PDF y GeoJSON. El apoyo de IA se usó para implementar componentes, leer la estructura de los adjuntos, producir el esquema de conversión, construir multipartes de dominios con una capa oficial y documentar las limitaciones.

Comprobaciones automatizadas: las 95 filas y 106 columnas del JSON coinciden con el CSV; los totales de las cinco líneas y la integralidad coinciden; los tres índices publicados reproducen los promedios ponderados de las cuatro dimensiones dentro de 0,000001 puntos. Se verificaron 112 códigos UPZ integrantes, sin claves faltantes ni doble asignación entre dominios.

Decisiones analíticas conservadoras: mantener los índices publicados sin renormalizarlos, no imputar nulos, no calcular brecha o ranking, no traducir códigos de estado/riesgo sin diccionario y separar el GeoJSON de intervenciones de los conteos del CSV. La propuesta no se considera prueba de sus hipótesis.

Validación humana pendiente: significado y construcción de proxies de la encuesta, diccionarios, denominadores, equivalencia de límites históricos, licencias de adjuntos, discrepancia cartográfica, estados de ejecución, riesgo integrado y cualquier priorización institucional. No se atribuye a una revisión humana lo que fue una prueba de código.

Se utilizaron cifras agregadas y geometrías entregadas o públicas. No se enviaron comunicaciones externas ni se realizó un despliegue remoto.

Ampliación solicitada: asistente de consultas en lenguaje natural y aclaración del modelo necesidad → presencia → brecha con cinco dimensiones. Se implementó un motor local de reglas, con selección por territorio, comparación, orden de indicadores, totales de una línea, contexto de continuidad y evidencia por respuesta. No se integró una IA generativa ni se enviaron los archivos a un proveedor externo. Se mantuvieron las cuatro dimensiones publicadas, sin suponer indicadores o pesos de vulnerabilidad ni construir el índice de presencia que trabajará el usuario.

Se añadieron siete pruebas del asistente sobre datos reales: orden y trazabilidad, sumas y localidades, códigos/agrupaciones, alcance y continuación, índices pendientes, consultas incompatibles y faltantes. Las 17 pruebas totales y la revisión TypeScript pasaron. La generación estática pasó; permanecen avisos de tamaño de un paquete de gráficos y resolución de una dependencia de caché de Nitro, sin impedir la generación. La verificación de Edge pasó con preguntas, comparación, continuación, filtros, apertura de fichas fuera del filtro y descarga JSON en escritorio/móvil, sin errores JavaScript.

Reorganización visual solicitada: se inspeccionó en Edge el observatorio de referencia facilitado por el usuario, incluyendo su disposición móvil. Se adaptó la portada local a cabecera horizontal, tarjetas de contexto, filtros/mapa/ficha, comparación y transparencia, conservando fuentes, agrupaciones y pendientes analíticos. Se añadieron nueve indicadores originales y el filtro por cantidad de líneas con registros, sincronizados con tabla y exportación. Dos pruebas adicionales verificaron valores originales frente a índices y la separación entre cero y faltantes; las 19 pruebas pasaron. No se modificó ni publicó el sitio remoto de referencia.

La nueva interfaz pasó la verificación en Edge en escritorio y móvil: indicadores originales, filtros de integralidad/localidad, exportación de la selección, agrupaciones, ficha completa, asistente, importación alternativa y paginación, sin errores JavaScript. La búsqueda territorial se limitó a nombres, localidad y códigos de dominio/UPZ, con tolerancia a tildes, para evitar coincidencias accidentales con conteos.
