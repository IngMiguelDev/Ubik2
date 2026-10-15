/** Text for the interface; source field names and published values stay intact. */
const descriptions: Record<string, string> = {
  hogares_muestra: 'Hogares que respondieron la encuesta en este territorio',
  hogares_expandidos: 'Hogares que representa la encuesta en este territorio. Esta estimación es la base de las tasas por 1.000 hogares.',
  indice_necesidad: 'Resume cinco temas con el mismo peso: tenencia, vivienda, entorno, amenaza alta y vulnerabilidad. Va de 0 a 1; un valor más alto indica mayor necesidad relativa entre los territorios.',
  indice_presencia: 'Resume los registros de las cinco líneas de la CVP, ajustados por hogares y llevados a una escala comparable de 0 a 1. Un valor más alto indica más presencia relativa en estos datos; no es el porcentaje de hogares atendidos.',
  brecha: 'Es la necesidad menos la presencia. Un valor positivo indica que el índice de necesidad es mayor; uno negativo, que el de presencia es mayor. Cero no significa que todas las necesidades estén resueltas.',
  brecha_tenencia: 'Compara las dificultades de tenencia con los registros de Titulación Predial. Usa los valores comparables del archivo, de −1 a 1; no cuenta hogares pendientes de titulación.',
  brecha_vivienda: 'Compara las necesidades de vivienda con los registros de Mejoramiento de Vivienda y Curaduría Pública Social. Ambas líneas comparten esta brecha, de −1 a 1.',
  brecha_entorno: 'Compara las condiciones del entorno con los registros de Mejoramiento de Barrios. Va de −1 a 1 y no mide cuántas obras faltan por hacer.',
  brecha_riesgo: 'Compara el área en amenaza alta por movimientos en masa con los registros de Reasentamientos. Va de −1 a 1; no cuenta hogares que deban ser reasentados.',
  ind_tenencia: 'Porcentaje de hogares con las dificultades de tenencia incluidas en la encuesta. Ayuda a conocer su situación, pero no certifica la propiedad de una vivienda.',
  ind_vivienda: 'Porcentaje de hogares con déficit habitacional: su vivienda necesita mejoras o presenta condiciones que requieren una solución de vivienda distinta, según la encuesta.',
  ind_entorno: 'Resume las dificultades de acceso del entorno reportadas por los hogares, como vías, andenes e iluminación.',
  ind_vulnerabilidad: 'Porcentaje de todos los hogares que tienen jefatura femenina y están en pobreza monetaria. No es el porcentaje de pobreza entre los hogares con jefatura femenina.',
  pct_amenaza_alta: 'Porcentaje del área del territorio en amenaza alta por movimientos en masa, según IDIGER 2016. Se refiere a superficie, no a hogares expuestos.',
  pct_amenaza_media: 'Porcentaje del área del territorio en amenaza media por movimientos en masa. Se refiere a superficie, no a hogares expuestos.',
  pct_amenaza_baja: 'Porcentaje del área del territorio en amenaza baja por movimientos en masa.',
  viv_x1000hog: 'Registros de Mejoramiento de Vivienda por cada 1.000 hogares representados. Incluye Plan Terrazas ejecutado o en ejecución; no es un porcentaje de hogares atendidos.',
  cps_x1000hog: 'Registros de Curaduría Pública Social por cada 1.000 hogares representados. Cuenta predios con actos de reconocimiento.',
  tit_x1000hog: 'Registros de Titulación Predial por cada 1.000 hogares representados. Cuenta predios titulados en el histórico disponible.',
  barrios_x1000hog: 'Registros de Mejoramiento de Barrios por cada 1.000 hogares representados. Cuenta tramos registrados, que pueden estar en distintos estados.',
  reas_x1000hog: 'Registros de procesos terminados de Reasentamientos por cada 1.000 hogares representados. El histórico no acredita su fecha de terminación.',
  integralidad: 'De las cinco líneas de la CVP, cuántas tienen al menos un registro en el territorio. Tener registros no significa que todas sus necesidades estén cubiertas.',
  categoria_brecha: 'Grupo al que pertenece la brecha general, de Muy baja a Muy alta. Los 95 territorios se reparten en cinco grupos de 19; los filtros no cambian esos grupos.',
  prioridad: 'Posición del territorio al ordenar la brecha de mayor a menor. Esta posición ayuda a comparar; no es una prioridad oficial de atención.'
}

export function fieldDescription(field: string, original: string) {
  return descriptions[field] ?? original.replace(/\bdominio(s)?\b/gi, word => word[0] === 'D' ? word.endsWith('s') ? 'Territorios' : 'Territorio' : word.endsWith('s') ? 'territorios' : 'territorio')
}
