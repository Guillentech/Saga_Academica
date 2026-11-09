import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  RefreshCw,
  Target,
  XCircle
} from 'lucide-react';
import { API_URL } from '../../config';
import ToastLogros from '../rpg/ToastLogros';

const ESTADOS_DOMINIO = {
  sin_datos: { texto: 'Sin datos', clase: 'is-muted' },
  en_riesgo: { texto: 'En riesgo', clase: 'is-risk' },
  en_progreso: { texto: 'En progreso', clase: 'is-progress' },
  dominado: { texto: 'Dominado', clase: 'is-mastered' }
};

function TarjetaRacha({ racha, practicas }) {
  if (!racha) return null;

  return (
    <div className="entreno-racha">
      <div className="entreno-racha__cabecera">
        <div className="entreno-racha__titulo">
          <Flame size={18} aria-hidden="true" />
          <div>
            <strong>Racha de {racha.actual} {racha.actual === 1 ? 'día' : 'días'}</strong>
            <span>
              Mejor racha: {racha.mejor} · Práctica: {practicas?.precision ?? 0}% de precisión
            </span>
          </div>
        </div>
        <span className={`entreno-meta ${racha.meta_diaria?.cumplida ? 'is-done' : ''}`}>
          {racha.meta_diaria?.cumplida ? 'META CUMPLIDA' : 'META: 1 ACTIVIDAD'}
        </span>
      </div>

      <div className="entreno-racha__dias" role="list" aria-label="Calendario de racha semanal">
        {racha.dias_semana?.map((dia) => (
          <div
            key={dia.fecha}
            role="listitem"
            className={`entreno-dia ${dia.activo ? 'is-activo' : ''} ${dia.es_hoy ? 'is-hoy' : ''}`}
            title={`${dia.fecha}${dia.activo ? ' · actividad registrada' : ' · sin actividad'}`}
            aria-label={`${dia.fecha}${dia.activo ? ', actividad registrada' : ', sin actividad'}`}
          >
            <span>{dia.etiqueta}</span>
            <i aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DominioTemas({ temas = [] }) {
  const visibles = useMemo(() => temas
    .filter((tema) => tema.jefes > 0 || tema.practicas > 0)
    .sort((a, b) => a.dominio - b.dominio)
    .slice(0, 6), [temas]);

  return (
    <div className="entreno-dominios">
      <div className="entreno-dominios__head">
        <h4 className="zone-column__title">📊 DOMINIO POR TEMA</h4>
        <span className="section-sub">Los temas con menor dominio aparecen primero.</span>
      </div>

      {visibles.length === 0 ? (
        <p className="rpg-empty">
          Aún no hay datos de dominio. Rinde un jefe o practica para que el Oráculo calibre tus recomendaciones.
        </p>
      ) : (
        <div className="entreno-dominios__grid">
          {visibles.map((tema) => {
            const estado = ESTADOS_DOMINIO[tema.estado] || ESTADOS_DOMINIO.sin_datos;
            return (
              <div key={tema.tema_id} className={`entreno-dominio ${estado.clase}`}>
                <div className="entreno-dominio__titulo">
                  <strong>{tema.tema_titulo}</strong>
                  <span>{tema.dominio}%</span>
                </div>
                <div
                  className="entreno-dominio__barra"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={tema.dominio}
                  aria-label={`Dominio de ${tema.tema_titulo}`}
                >
                  <div style={{ width: `${tema.dominio}%` }} />
                </div>
                <div className="entreno-dominio__meta">
                  <span>{estado.texto}</span>
                  <span>{tema.practicas} prácticas · {tema.jefes} jefes</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CampoEntrenamiento({ estudianteId, onActividadRegistrada }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [indice, setIndice] = useState(0);
  const [respuesta, setRespuesta] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [sesion, setSesion] = useState({ correctas: 0, incorrectas: 0 });
  const [logrosNuevos, setLogrosNuevos] = useState([]);

  const cargar = useCallback(async () => {
    if (!estudianteId) return;
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/estudiantes/${estudianteId}/entrenamiento`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo abrir el Campo de Entrenamiento.');
      setDatos(data);
      setIndice(0);
      setRespuesta(null);
      setFeedback(null);
      setSesion({ correctas: 0, incorrectas: 0 });
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el Campo de Entrenamiento.');
    } finally {
      setCargando(false);
    }
  }, [estudianteId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const preguntas = datos?.preguntas || [];
  const total = preguntas.length;
  const terminada = total > 0 && indice >= total;
  const preguntaActual = preguntas[indice];

  const responder = async (opcion) => {
    if (!preguntaActual || feedback || enviando) return;

    setEnviando(true);
    setRespuesta(opcion);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/estudiantes/${estudianteId}/entrenamiento/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta_id: preguntaActual.id, opcion })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar tu conjuro.');

      setFeedback(data);
      setSesion((prev) => ({
        correctas: prev.correctas + (data.correcta ? 1 : 0),
        incorrectas: prev.incorrectas + (data.correcta ? 0 : 1)
      }));

      setDatos((prev) => (prev ? { ...prev, racha: data.racha, practicas: data.practicas } : prev));

      if (data.logros_desbloqueados?.length > 0) {
        setLogrosNuevos((prev) => {
          const existentes = new Set(prev.map((logro) => logro.id));
          return [...prev, ...data.logros_desbloqueados.filter((logro) => !existentes.has(logro.id))];
        });
      }

      onActividadRegistrada?.();
    } catch (err) {
      setRespuesta(null);
      setError(err.message || 'No se pudo registrar tu respuesta.');
    } finally {
      setEnviando(false);
    }
  };

  const siguiente = () => {
    if (indice + 1 >= total) {
      setIndice(total);
      return;
    }
    setIndice((prev) => prev + 1);
    setRespuesta(null);
    setFeedback(null);
  };

  const precisionSesion = sesion.correctas + sesion.incorrectas > 0
    ? Math.round((sesion.correctas / (sesion.correctas + sesion.incorrectas)) * 100)
    : 0;

  if (cargando && !datos) {
    return (
      <div className="card-pro">
        <h3 className="pixel-font section-title section-title--xp">🎯 CAMPO DE ENTRENAMIENTO</h3>
        <p className="rpg-empty">Invocando simulacros del Oráculo...</p>
      </div>
    );
  }

  if (error && !datos) {
    return (
      <div className="card-pro">
        <h3 className="pixel-font section-title section-title--danger">🎯 CAMPO DE ENTRENAMIENTO</h3>
        <p className="perfil-mensaje is-error" role="alert">{error}</p>
        <button type="button" className="btn-pro btn-pro-primary" onClick={cargar}>
          <RefreshCw size={15} /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      <ToastLogros logros={logrosNuevos} onClose={() => setLogrosNuevos([])} />

      <div className="card-pro">
        <div className="entreno-head">
          <div>
            <h3 className="pixel-font section-title section-title--xp">🎯 CAMPO DE ENTRENAMIENTO</h3>
            <p className="section-sub">
              Practica sin nota y sin gastar tu intento del jefe. El Oráculo prioriza lo que más necesitas.
            </p>
          </div>
          <button
            type="button"
            className="btn-pro btn-pro--gold btn-sm"
            onClick={cargar}
            disabled={cargando}
          >
            <RefreshCw size={14} /> {cargando ? 'Calibrando...' : 'Nueva ronda'}
          </button>
        </div>

        <TarjetaRacha racha={datos?.racha} practicas={datos?.practicas} />
        <DominioTemas temas={datos?.dominio_temas} />
      </div>

      {error && datos && (
        <p className="perfil-mensaje is-error" role="alert">{error}</p>
      )}

      {terminada ? (
        <div className="card-pro entreno-resumen">
          <h3 className="pixel-font section-title section-title--gold">🏁 RONDA COMPLETADA</h3>
          <p className="section-sub">
            Cada intento cuenta para tu racha. Las preguntas que falles volverán a aparecer en la siguiente ronda.
          </p>

          <div className="entreno-resumen__scores">
            <div>
              <strong>{sesion.correctas}</strong>
              <span>aciertos</span>
            </div>
            <div>
              <strong>{sesion.incorrectas}</strong>
              <span>fallos</span>
            </div>
            <div>
              <strong>{precisionSesion}%</strong>
              <span>precisión</span>
            </div>
          </div>

          <div className="entreno-resumen__acciones">
            <button type="button" className="btn-pro btn-pro-primary" onClick={cargar}>
              <RefreshCw size={15} /> Entrenar otra ronda
            </button>
          </div>
        </div>
      ) : preguntaActual ? (
        <div className="card-pro entreno-question">
          <div className="quest-card__head">
            <span className="badge badge--teacher">{preguntaActual.tema_titulo}</span>
            <span className="badge badge--gold">
              Pregunta {indice + 1} de {total}
            </span>
          </div>

          <p className="entreno-motivo">
            <Target size={14} aria-hidden="true" /> {preguntaActual.motivo}
          </p>

          <h4 className="rpg-question__text">⚔️ {preguntaActual.enunciado}</h4>

          <div className="rpg-options entreno-opciones">
            {['A', 'B', 'C', 'D'].map((opcion) => {
              const seleccionada = respuesta === opcion;
              const esCorrecta = feedback?.opcion_correcta === opcion;
              const esIncorrecta = Boolean(feedback) && seleccionada && !feedback.correcta;

              return (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => responder(opcion)}
                  disabled={Boolean(feedback) || enviando}
                  className={`rpg-option ${seleccionada ? 'is-selected' : ''} ${
                    feedback && esCorrecta ? 'is-correct' : ''
                  } ${esIncorrecta ? 'is-wrong' : ''}`}
                >
                  <strong className="rpg-option__key">[{opcion}]</strong>
                  <span>{preguntaActual[`opcion_${opcion.toLowerCase()}`]}</span>
                </button>
              );
            })}
          </div>

          {enviando && <p className="section-sub">Resolviendo conjuro...</p>}

          {feedback && (
            <div
              className={`entreno-feedback ${feedback.correcta ? 'is-correct' : 'is-wrong'}`}
              role="status"
              aria-live="polite"
            >
              <div className="entreno-feedback__head">
                {feedback.correcta ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                <strong>{feedback.correcta ? '¡Conjuro certero!' : 'El conjuro falló'}</strong>
              </div>
              <p>{feedback.explicacion}</p>
              <button type="button" className="btn-pro btn-pro-primary" onClick={siguiente}>
                {indice + 1 >= total ? 'Ver resumen' : 'Siguiente conjuro'} <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card-pro">
          <h3 className="pixel-font section-title section-title--gold">🎯 CAMPO DE ENTRENAMIENTO</h3>
          <p className="rpg-empty">
            Aún no hay preguntas disponibles. Pide al Game Master que publique un jefe con conjuros.
          </p>
        </div>
      )}
    </>
  );
}
