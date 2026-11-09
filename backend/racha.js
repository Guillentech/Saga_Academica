// 🔥 Motor de racha diaria y meta de constancia.
// Funciones puras para poder probarlas sin depender de Express ni de SQLite.

const MS_DIA = 86400000;

/** Normaliza una fecha de SQLite/ISO a `YYYY-MM-DD`. */
export const normalizarFecha = (valor) => {
  if (!valor) return null;
  const texto = String(valor).trim();
  if (!texto) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10);
  const fecha = new Date(texto);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toISOString().slice(0, 10);
};

/** Diferencia en días entre dos fechas `YYYY-MM-DD`. */
export const diasEntreFechas = (fechaA, fechaB) => {
  if (!fechaA || !fechaB) return null;
  return Math.round((Date.parse(`${fechaA}T00:00:00Z`) - Date.parse(`${fechaB}T00:00:00Z`)) / MS_DIA);
};

const diasDeLaSemana = (hoy) => {
  const fechaHoy = new Date(`${hoy}T00:00:00Z`);
  const dia = fechaHoy.getUTCDay(); // 0 = domingo
  const desplazamientoLunes = dia === 0 ? 6 : dia - 1;
  const lunes = new Date(fechaHoy);
  lunes.setUTCDate(fechaHoy.getUTCDate() - desplazamientoLunes);

  return Array.from({ length: 7 }, (_, indice) => {
    const fecha = new Date(lunes);
    fecha.setUTCDate(lunes.getUTCDate() + indice);
    return {
      fecha: fecha.toISOString().slice(0, 10),
      etiqueta: ['L', 'M', 'X', 'J', 'V', 'S', 'D'][indice]
    };
  });
};

/**
 * Calcula la racha actual, la mejor racha histórica, el calendario semanal
 * y el cumplimiento de la meta diaria (1 actividad por día).
 */
export const calcularResumenRacha = (fechas = [], hoy = new Date().toISOString().slice(0, 10)) => {
  const fechasValidas = [...new Set(fechas.map(normalizarFecha).filter(Boolean))].sort();
  const conjunto = new Set(fechasValidas);

  let actual = 0;
  if (fechasValidas.length > 0) {
    const ultima = fechasValidas[fechasValidas.length - 1];
    if (diasEntreFechas(hoy, ultima) <= 1) {
      actual = 1;
      for (let i = fechasValidas.length - 1; i > 0; i -= 1) {
        if (diasEntreFechas(fechasValidas[i], fechasValidas[i - 1]) !== 1) break;
        actual += 1;
      }
    }
  }

  let mejor = 0;
  let racha = 0;
  let anterior = null;
  for (const fecha of fechasValidas) {
    racha = anterior && diasEntreFechas(fecha, anterior) === 1 ? racha + 1 : 1;
    mejor = Math.max(mejor, racha);
    anterior = fecha;
  }

  const semana = diasDeLaSemana(hoy).map((dia) => ({
    ...dia,
    activo: conjunto.has(dia.fecha),
    es_hoy: dia.fecha === hoy
  }));

  const completadasHoy = fechasValidas.filter((fecha) => fecha === hoy).length;

  return {
    actual,
    mejor,
    hoy_activo: conjunto.has(hoy),
    ultima_actividad: fechasValidas.length > 0 ? fechasValidas[fechasValidas.length - 1] : null,
    total_dias_activos: fechasValidas.length,
    dias_semana: semana,
    meta_diaria: {
      objetivo: 1,
      completadas: completadasHoy,
      cumplida: completadasHoy >= 1
    }
  };
};
