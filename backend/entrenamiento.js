// 🎯 Campo de Entrenamiento: práctica adaptativa sin nota y sin consumir el intento del jefe.
import db from './db.js';
import { calcularResumenRacha, normalizarFecha, diasEntreFechas } from './racha.js';

const parsearDetalle = (texto) => {
  try {
    const detalle = JSON.parse(texto || '[]');
    return Array.isArray(detalle) ? detalle : [];
  } catch {
    return [];
  }
};

const redondear = (valor) => Math.round(Number(valor) || 0);

const promedio = (valores = []) => {
  if (valores.length === 0) return null;
  return valores.reduce((total, valor) => total + Number(valor || 0), 0) / valores.length;
};

/** Reúne todas las fechas con actividad académica o de entrenamiento. */
const obtenerFechasActividad = (estudianteId) => db.prepare(`
  SELECT fecha FROM calificaciones WHERE estudiante_id = ?
  UNION ALL
  SELECT fecha FROM entregas WHERE estudiante_id = ?
  UNION ALL
  SELECT fecha FROM practicas WHERE estudiante_id = ?
`).all(estudianteId, estudianteId, estudianteId).map((fila) => fila.fecha);

const obtenerResumenPracticas = (estudianteId) => {
  const resumen = db.prepare(`
    SELECT COUNT(*) as total,
           COALESCE(SUM(CASE WHEN es_correcta = 1 THEN 1 ELSE 0 END), 0) as correctas
    FROM practicas
    WHERE estudiante_id = ?
  `).get(estudianteId);

  const total = Number(resumen?.total) || 0;
  const correctas = Number(resumen?.correctas) || 0;

  return {
    total,
    correctas,
    precision: total > 0 ? Math.round((correctas / total) * 100) : 0
  };
};

/** Resumen ligero para el HUD: racha diaria y precisión de entrenamiento. */
export const obtenerResumenEntrenamiento = (estudianteId) => {
  const fechas = obtenerFechasActividad(estudianteId);
  return {
    racha: calcularResumenRacha(fechas),
    practicas: obtenerResumenPracticas(estudianteId)
  };
};

const consultarPreguntas = () => db.prepare(`
  SELECT p.id, p.enunciado,
         p.opcion_a, p.opcion_b, p.opcion_c, p.opcion_d,
         p.explicacion,
         ev.id as evaluacion_id, ev.titulo as evaluacion_titulo,
         t.id as tema_id, t.titulo as tema_titulo
  FROM preguntas p
  JOIN evaluaciones ev ON ev.id = p.evaluacion_id
  JOIN temas t ON t.id = ev.tema_id
  ORDER BY t.id, p.id
`).all();

const consultarActividadJefes = (estudianteId) => db.prepare(`
  SELECT c.puntaje, c.detalle_respuestas, ev.tema_id
  FROM calificaciones c
  JOIN evaluaciones ev ON ev.id = c.evaluacion_id
  WHERE c.estudiante_id = ?
`).all(estudianteId);

const consultarPracticas = (estudianteId) => db.prepare(`
  SELECT pregunta_id,
         COUNT(*) as total,
         COALESCE(SUM(CASE WHEN es_correcta = 1 THEN 1 ELSE 0 END), 0) as correctas,
         MAX(fecha) as ultima
  FROM practicas
  WHERE estudiante_id = ?
  GROUP BY pregunta_id
`).all(estudianteId);

const estadoDominio = (dominio, tieneDatos) => {
  if (!tieneDatos) return 'sin_datos';
  if (dominio >= 80) return 'dominado';
  if (dominio >= 60) return 'en_progreso';
  return 'en_riesgo';
};

/**
 * Devuelve preguntas recomendadas y el dominio por tema.
 * Prioriza preguntas falladas en jefes, temas con bajo dominio y repaso espaciado.
 */
export const listarPreguntasEntrenamiento = (estudianteId, limite = 10) => {
  const cantidad = Math.max(1, Math.min(20, Number(limite) || 10));
  const hoy = new Date().toISOString().slice(0, 10);
  const preguntas = consultarPreguntas();

  if (preguntas.length === 0) {
    return { preguntas: [], dominio_temas: [], total_preguntas: 0 };
  }

  const actividadJefes = consultarActividadJefes(estudianteId);
  const practicas = consultarPracticas(estudianteId);

  const falladas = new Set();
  const acertadas = new Set();
  const puntajesPorTema = new Map();

  for (const calificacion of actividadJefes) {
    const temaId = calificacion.tema_id;
    if (!puntajesPorTema.has(temaId)) puntajesPorTema.set(temaId, []);
    puntajesPorTema.get(temaId).push(Number(calificacion.puntaje) || 0);

    for (const detalle of parsearDetalle(calificacion.detalle_respuestas)) {
      const preguntaId = Number(detalle.pregunta_id);
      if (!preguntaId) continue;
      if (detalle.es_correcta) acertadas.add(preguntaId);
      else falladas.add(preguntaId);
    }
  }

  const temaPorPregunta = new Map(preguntas.map((pregunta) => [pregunta.id, pregunta.tema_id]));
  const practicasPorPregunta = new Map(
    practicas.map((practica) => [Number(practica.pregunta_id), practica])
  );
  const practicasPorTema = new Map();

  for (const practica of practicas) {
    const temaId = temaPorPregunta.get(Number(practica.pregunta_id));
    if (!temaId) continue;
    if (!practicasPorTema.has(temaId)) practicasPorTema.set(temaId, { total: 0, correctas: 0 });
    const acumulado = practicasPorTema.get(temaId);
    acumulado.total += Number(practica.total) || 0;
    acumulado.correctas += Number(practica.correctas) || 0;
  }

  const temas = new Map();
  for (const pregunta of preguntas) {
    if (!temas.has(pregunta.tema_id)) {
      temas.set(pregunta.tema_id, {
        tema_id: pregunta.tema_id,
        tema_titulo: pregunta.tema_titulo
      });
    }
  }

  const dominioPorTema = new Map();
  const dominioTemas = [...temas.values()].map((tema) => {
    const puntajes = puntajesPorTema.get(tema.tema_id) || [];
    const practica = practicasPorTema.get(tema.tema_id) || { total: 0, correctas: 0 };
    const promedioJefes = promedio(puntajes);
    const precisionPractica = practica.total > 0
      ? Math.round((practica.correctas / practica.total) * 100)
      : null;

    let dominio = 0;
    if (promedioJefes !== null && precisionPractica !== null) {
      dominio = Math.round(promedioJefes * 0.6 + precisionPractica * 0.4);
    } else if (promedioJefes !== null) {
      dominio = Math.round(promedioJefes);
    } else if (precisionPractica !== null) {
      dominio = precisionPractica;
    }

    const tieneDatos = promedioJefes !== null || precisionPractica !== null;
    dominioPorTema.set(tema.tema_id, {
      dominio,
      estado: estadoDominio(dominio, tieneDatos)
    });

    return {
      tema_id: tema.tema_id,
      tema_titulo: tema.tema_titulo,
      dominio,
      estado: estadoDominio(dominio, tieneDatos),
      promedio_jefes: promedioJefes === null ? null : Math.round(promedioJefes),
      practicas: practica.total,
      precision_practica: precisionPractica,
      jefes: puntajes.length
    };
  }).sort((a, b) => a.dominio - b.dominio || a.tema_titulo.localeCompare(b.tema_titulo));

  const candidatas = preguntas.map((pregunta) => {
    const dominio = dominioPorTema.get(pregunta.tema_id)?.dominio ?? 0;
    const practica = practicasPorPregunta.get(Number(pregunta.id));
    let puntuacion = 100 - dominio;

    if (falladas.has(Number(pregunta.id))) puntuacion += 50;
    else if (acertadas.has(Number(pregunta.id))) puntuacion -= 20;

    if (!practica) {
      puntuacion += 30;
    } else {
      const precision = practica.total > 0
        ? Math.round((Number(practica.correctas) / Number(practica.total)) * 100)
        : 0;
      if (precision < 50) puntuacion += 25;
      else if (precision < 80) puntuacion += 10;
      else puntuacion -= 25;

      const diasDesdePractica = diasEntreFechas(hoy, normalizarFecha(practica.ultima));
      if (diasDesdePractica === 0) puntuacion -= 35;
      else if (diasDesdePractica === 1) puntuacion -= 15;
    }

    return { pregunta, puntuacion };
  }).sort((a, b) => b.puntuacion - a.puntuacion || a.pregunta.id - b.pregunta.id);

  // Diversifica la ronda: máximo 2 preguntas por tema antes de rellenar.
  const seleccionadas = [];
  const porTema = new Map();
  for (const candidata of candidatas) {
    const temaId = candidata.pregunta.tema_id;
    const usadas = porTema.get(temaId) || 0;
    if (usadas >= 2) continue;
    seleccionadas.push(candidata);
    porTema.set(temaId, usadas + 1);
    if (seleccionadas.length >= cantidad) break;
  }

  if (seleccionadas.length < cantidad) {
    const idsSeleccionados = new Set(seleccionadas.map((c) => c.pregunta.id));
    for (const candidata of candidatas) {
      if (idsSeleccionados.has(candidata.pregunta.id)) continue;
      seleccionadas.push(candidata);
      if (seleccionadas.length >= cantidad) break;
    }
  }

  const recomendadas = seleccionadas.map(({ pregunta }) => {
    const practica = practicasPorPregunta.get(Number(pregunta.id));
    const dominio = dominioPorTema.get(pregunta.tema_id)?.dominio ?? 0;

    let motivo = 'Aún no has practicado esta pregunta.';
    if (falladas.has(Number(pregunta.id))) {
      motivo = 'Fallaste esta pregunta en un jefe. Es prioridad de repaso.';
    } else if (practica && practica.total > 0) {
      const precision = Math.round((Number(practica.correctas) / Number(practica.total)) * 100);
      motivo = precision < 60
        ? 'Tu precisión en esta pregunta todavía es baja.'
        : 'Repaso de refuerzo para mantener el dominio.';
    } else if (dominio < 60) {
      motivo = 'Tu dominio del tema aún es bajo.';
    }

    return {
      id: pregunta.id,
      enunciado: pregunta.enunciado,
      opcion_a: pregunta.opcion_a,
      opcion_b: pregunta.opcion_b,
      opcion_c: pregunta.opcion_c,
      opcion_d: pregunta.opcion_d,
      tema_id: pregunta.tema_id,
      tema_titulo: pregunta.tema_titulo,
      evaluacion_id: pregunta.evaluacion_id,
      evaluacion_titulo: pregunta.evaluacion_titulo,
      dominio_tema: dominio,
      motivo
    };
  });

  return {
    preguntas: recomendadas,
    dominio_temas: dominioTemas,
    total_preguntas: preguntas.length
  };
};

/** Registra una respuesta de práctica y devuelve retroalimentación inmediata. */
export const registrarRespuestaEntrenamiento = (estudianteId, preguntaId, opcion) => {
  const pregunta = db.prepare(`
    SELECT p.id, p.enunciado, p.opcion_correcta, p.explicacion,
           t.titulo as tema_titulo
    FROM preguntas p
    JOIN evaluaciones ev ON ev.id = p.evaluacion_id
    JOIN temas t ON t.id = ev.tema_id
    WHERE p.id = ?
  `).get(preguntaId);

  if (!pregunta) {
    return { error: 'La pregunta de entrenamiento no existe.' };
  }

  const marcada = String(opcion || '').trim().toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(marcada)) {
    return { error: 'Debes elegir una opción válida (A, B, C o D).' };
  }

  const correcta = String(pregunta.opcion_correcta || '').trim().toUpperCase();
  const esCorrecta = marcada === correcta;

  db.prepare(`
    INSERT INTO practicas (estudiante_id, pregunta_id, respuesta, es_correcta)
    VALUES (?, ?, ?, ?)
  `).run(estudianteId, preguntaId, marcada, esCorrecta ? 1 : 0);

  return {
    ...obtenerResumenEntrenamiento(estudianteId),
    pregunta_id: pregunta.id,
    tema_titulo: pregunta.tema_titulo,
    correcta: esCorrecta,
    opcion_correcta: correcta,
    explicacion: pregunta.explicacion || `La respuesta correcta era la opción ${correcta}.`
  };
};
