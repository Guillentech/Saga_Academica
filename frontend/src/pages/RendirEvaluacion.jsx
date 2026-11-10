import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { API_URL } from '../config';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Swords,
  Clock,
  ArrowLeft,
  Sparkles,
  Volume2,
  VolumeX,
  Flame,
  Shield,
  Skull,
  ChevronRight,
  Trophy,
  Target,
  Zap,
  RotateCcw
} from 'lucide-react';
import ToastLogros from '../components/rpg/ToastLogros';
import { PageBackdrop } from '../components/rpg';
import { marcarLogrosVistos } from '../utils/logros';
import { AvatarEstudiante } from '../components/perfil/Avatares';
import { sfx, isSfxMuted, saveSfxMuted } from '../utils/sfx';
import useMediaQuery from '../hooks/useMediaQuery';

const TIEMPO_COMBATE = 300;
const HP_HEROE_MAX = 100;
const DANIO_HEROE = 20;
const DANIO_HEROE_FASE3 = 25;
const UMBRAL_APROBACION = 60;

// Reconstruye HP, combo y mejor combo a partir de las respuestas ya bloqueadas
// en el servidor. Sirve para retomar el combate o abrir una crónica guardada.
const calcularStatsCombate = (respuestasIntento = [], totalPreguntas = 0) => {
  let hpHeroe = HP_HEROE_MAX;
  let combo = 0;
  let mejorCombo = 0;

  respuestasIntento.forEach((respuesta, indice) => {
    if (respuesta.correcta) {
      combo += 1;
      mejorCombo = Math.max(mejorCombo, combo);
      return;
    }

    combo = 0;
    const fase = totalPreguntas > 0
      ? Math.min(3, Math.floor((indice / totalPreguntas) * 3) + 1)
      : 1;
    hpHeroe = Math.max(0, hpHeroe - (fase === 3 ? DANIO_HEROE_FASE3 : DANIO_HEROE));
  });

  return { hpHeroe, combo, mejorCombo };
};

function BossSprite({ width = 110, height = 100 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 18 16" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="3" y="1" width="2" height="3" fill="#fca5a5" />
      <rect x="13" y="1" width="2" height="3" fill="#fca5a5" />
      <rect x="4" y="3" width="10" height="9" fill="#dc2626" />
      <rect x="3" y="5" width="12" height="6" fill="#ef4444" />
      <rect x="5" y="6" width="3" height="2" fill="#fef08a" />
      <rect x="10" y="6" width="3" height="2" fill="#fef08a" />
      <rect x="6" y="10" width="6" height="2" fill="#450a0a" />
    </svg>
  );
}

export default function RendirEvaluacion() {
  const { id } = useParams();
  const { user, refrescarEstudiante } = useAuth();
  const navigate = useNavigate();
  const esMovil = useMediaQuery('(max-width: 640px)');

  useEffect(() => {
    document.body.classList.add('combat-active');
    return () => document.body.classList.remove('combat-active');
  }, []);

  const [preguntas, setPreguntas] = useState([]);
  const [evaluacion, setEvaluacion] = useState(null);
  const [turnoActual, setTurnoActual] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [feedback, setFeedback] = useState({});
  const [resultado, setResultado] = useState(null);
  const [logrosNuevos, setLogrosNuevos] = useState([]);
  const [tiempoRestante, setTiempoRestante] = useState(TIEMPO_COMBATE);
  const [enviando, setEnviando] = useState(false);
  const [respondiendo, setRespondiendo] = useState(false);
  const [hpHeroe, setHpHeroe] = useState(HP_HEROE_MAX);
  const [combo, setCombo] = useState(0);
  const [mejorCombo, setMejorCombo] = useState(0);
  const [flotantes, setFlotantes] = useState([]);
  const [animacionAtaque, setAnimacionAtaque] = useState(false);
  const [impactoHeroe, setImpactoHeroe] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [confirmarFinal, setConfirmarFinal] = useState(false);
  const [ataqueFinal, setAtaqueFinal] = useState(false);
  const [sfxSilenciado, setSfxSilenciado] = useState(() => isSfxMuted());
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const respuestasRef = useRef(respuestas);
  const userRef = useRef(user);
  const enviandoRef = useRef(false);
  const respondiendoRef = useRef(false);
  const autoEnviadoRef = useRef(false);
  const flotanteIdRef = useRef(0);
  const montadoRef = useRef(true);
  const timeoutFinalRef = useRef(null);

  useEffect(() => {
    respuestasRef.current = respuestas;
  }, [respuestas]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      if (timeoutFinalRef.current) clearTimeout(timeoutFinalRef.current);
    };
  }, []);

  const claveTimer = user?.id ? `lms_combate_timer_${user.id}_${id}` : null;

  const leerTimerGuardado = useCallback(() => {
    if (!claveTimer) return null;
    try {
      const crudo = localStorage.getItem(claveTimer);
      if (!crudo) return null;
      const datos = JSON.parse(crudo);
      const restante = Number(datos?.restante);
      if (!Number.isFinite(restante)) return null;
      return Math.max(0, Math.min(TIEMPO_COMBATE, Math.round(restante)));
    } catch {
      return null;
    }
  }, [claveTimer]);

  const lanzarFlotante = useCallback((tipo, texto, critico = false) => {
    const idFlotante = flotanteIdRef.current + 1;
    flotanteIdRef.current = idFlotante;
    setFlotantes((prev) => [...prev, { id: idFlotante, tipo, texto, critico }]);
    setTimeout(() => {
      setFlotantes((prev) => prev.filter((flotante) => flotante.id !== idFlotante));
    }, 950);
  }, []);

  // --- HIDRATACIÓN: preguntas, datos del jefe e intento ya iniciado ---
  useEffect(() => {
    let cancelado = false;

    const cargarCombate = async () => {
      if (!user?.id) {
        setErrorCarga('Debes iniciar sesión como héroe para entrar a la mazmorra.');
        setCargando(false);
        return;
      }

      setCargando(true);
      setErrorCarga('');

      try {
        const resPreguntas = await fetch(`${API_URL}/api/evaluaciones/${id}/preguntas`);
        if (!resPreguntas.ok) throw new Error('No se pudo invocar al Jefe Final.');
        const dataPreguntas = await resPreguntas.json();
        if (cancelado) return;
        if (!Array.isArray(dataPreguntas) || dataPreguntas.length === 0) {
          throw new Error('Esta mazmorra aún no tiene conjuros configurados.');
        }
        setPreguntas(dataPreguntas);

        const [resEvaluaciones, resIntento] = await Promise.all([
          fetch(`${API_URL}/api/evaluaciones`).catch(() => null),
          fetch(`${API_URL}/api/evaluaciones/${id}/intento/${user.id}`).catch(() => null)
        ]);

        if (cancelado) return;

        if (resEvaluaciones?.ok) {
          const lista = await resEvaluaciones.json();
          if (!cancelado) {
            setEvaluacion(lista.find((ev) => String(ev.id) === String(id)) || null);
          }
        }

        if (resIntento?.ok) {
          const intento = await resIntento.json();
          if (cancelado) return;

          if (intento.finalizada && intento.calificacion) {
            const stats = calcularStatsCombate(intento.respuestas || [], dataPreguntas.length);
            setHpHeroe(stats.hpHeroe);
            setCombo(0);
            setMejorCombo(stats.mejorCombo);
            const restanteGuardado = leerTimerGuardado();
            setTiempoRestante(restanteGuardado ?? Math.max(
              0,
              Math.min(TIEMPO_COMBATE, TIEMPO_COMBATE - (Number(intento.transcurrido_segundos) || 0))
            ));
            setResultado({
              ...intento.calificacion,
              desglose: intento.calificacion.desglose || [],
              nota_materia: userRef.current?.nota_materia,
              logros_desbloqueados: []
            });
            setIntroVisible(false);
            return;
          }

          const respuestasIntento = Array.isArray(intento.respuestas) ? intento.respuestas : [];
          const stats = calcularStatsCombate(respuestasIntento, dataPreguntas.length);
          setHpHeroe(stats.hpHeroe);
          setCombo(stats.combo);
          setMejorCombo(stats.mejorCombo);

          if (respuestasIntento.length > 0) {
            const mapaRespuestas = {};
            const mapaFeedback = {};
            respuestasIntento.forEach((respuesta) => {
              mapaRespuestas[respuesta.pregunta_id] = respuesta.opcion;
              mapaFeedback[respuesta.pregunta_id] = {
                correcta: Boolean(respuesta.correcta),
                opcion_correcta: respuesta.opcion_correcta,
                explicacion: respuesta.explicacion
              };
            });
            setRespuestas(mapaRespuestas);
            setFeedback(mapaFeedback);
            const indicePendiente = dataPreguntas.findIndex((pregunta) => !mapaRespuestas[pregunta.id]);
            setTurnoActual(indicePendiente >= 0 ? indicePendiente : dataPreguntas.length - 1);
            setIntroVisible(false);

            const restanteServidor = Math.max(
              0,
              Math.min(TIEMPO_COMBATE, TIEMPO_COMBATE - (Number(intento.transcurrido_segundos) || 0))
            );
            setTiempoRestante(leerTimerGuardado() ?? restanteServidor);
          } else {
            setTurnoActual(0);
            setIntroVisible(true);
            setTiempoRestante(TIEMPO_COMBATE);
          }
        } else {
          setTiempoRestante(leerTimerGuardado() ?? TIEMPO_COMBATE);
        }
      } catch (error) {
        if (!cancelado) setErrorCarga(error.message || 'Error al invocar al Jefe Final.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarCombate();
    return () => {
      cancelado = true;
    };
  }, [id, user?.id, leerTimerGuardado]);

  // --- ENVÍO FINAL: el servidor fusiona las respuestas bloqueadas ---
  const enviarExamenServidor = useCallback(async (respuestasAEnviar) => {
    if (!user?.id || enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);

    try {
      const res = await fetch(`${API_URL}/api/evaluaciones/${id}/calificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estudiante_id: user.id,
          respuestas: respuestasAEnviar
        })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Si otra pestaña ya cerró el intento, recuperamos su crónica.
        if (String(data.error || '').includes('Ya te enfrentaste')) {
          const resIntento = await fetch(`${API_URL}/api/evaluaciones/${id}/intento/${user.id}`).catch(() => null);
          if (resIntento?.ok) {
            const intento = await resIntento.json();
            if (intento.finalizada && intento.calificacion) {
              setResultado({
                ...intento.calificacion,
                desglose: intento.calificacion.desglose || [],
                nota_materia: userRef.current?.nota_materia,
                logros_desbloqueados: []
              });
              setAtaqueFinal(false);
              setConfirmarFinal(false);
              return;
            }
          }
        }
        setAtaqueFinal(false);
        setConfirmarFinal(false);
        alert(data.error || 'Error al calificar el combate.');
        return;
      }

      setResultado(data);
      setAtaqueFinal(false);
      setConfirmarFinal(false);

      const nuevos = data.logros_desbloqueados || [];
      if (nuevos.length > 0) {
        setLogrosNuevos(nuevos);
        marcarLogrosVistos(user.id, nuevos);
      }

      if (Number(data.puntaje) >= UMBRAL_APROBACION) sfx.victory();
      else sfx.defeat();

      await refrescarEstudiante();
    } catch {
      setAtaqueFinal(false);
      setConfirmarFinal(false);
      alert('Error de conexión con el servidor.');
    } finally {
      enviandoRef.current = false;
      if (montadoRef.current) setEnviando(false);
    }
  }, [id, user, refrescarEstudiante]);

  // --- RESPUESTA INMEDIATA: primera opción bloqueada en servidor ---
  const responderConjuro = useCallback(async (preguntaId, opcion) => {
    if (!user?.id || respondiendoRef.current || enviandoRef.current) return;
    if (feedback[preguntaId] || resultado || introVisible || cargando) return;

    respondiendoRef.current = true;
    setRespondiendo(true);
    sfx.select();

    try {
      const res = await fetch(`${API_URL}/api/evaluaciones/${id}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estudiante_id: user.id,
          pregunta_id: preguntaId,
          opcion
        })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || 'El conjuro no pudo lanzarse.');
        return;
      }
      if (!montadoRef.current) return;

      const yaRespondida = Boolean(data.ya_respondida) || Boolean(feedback[preguntaId]);
      const esCorrecta = Boolean(data.correcta);
      const comboPrevio = combo;
      const multiplicador = 1 + Math.min(comboPrevio, 4) * 0.5;
      const metaAciertos = Math.max(1, Math.ceil(preguntas.length * UMBRAL_APROBACION / 100));
      const danioBase = Math.max(1, Math.round(100 / metaAciertos));
      const danio = Math.round(danioBase * multiplicador);

      setRespuestas((prev) => ({ ...prev, [preguntaId]: data.opcion || opcion }));
      setFeedback((prev) => ({
        ...prev,
        [preguntaId]: {
          correcta: esCorrecta,
          opcion_correcta: data.opcion_correcta,
          explicacion: data.explicacion
        }
      }));

      if (yaRespondida) return;

      if (esCorrecta) {
        const nuevoCombo = comboPrevio + 1;
        setCombo(nuevoCombo);
        setMejorCombo((prev) => Math.max(prev, nuevoCombo));
        setAnimacionAtaque(true);
        setTimeout(() => setAnimacionAtaque(false), 420);
        lanzarFlotante('boss', `-${danio}`, multiplicador >= 2);
        if (multiplicador >= 2) sfx.crit();
        else sfx.hit();
        if (nuevoCombo >= 2) setTimeout(() => sfx.combo(), 180);
      } else {
        const fase = Math.min(
          3,
          Math.floor((Object.keys(respuestas).length / Math.max(1, preguntas.length)) * 3) + 1
        );
        const danioHeroe = fase === 3 ? DANIO_HEROE_FASE3 : DANIO_HEROE;
        setCombo(0);
        setHpHeroe((prev) => Math.max(0, prev - danioHeroe));
        setImpactoHeroe(true);
        setTimeout(() => setImpactoHeroe(false), 420);
        lanzarFlotante('hero', `-${danioHeroe}`, fase === 3);
        sfx.miss();
      }
    } catch {
      alert('Error de conexión al lanzar el conjuro.');
    } finally {
      respondiendoRef.current = false;
      if (montadoRef.current) setRespondiendo(false);
    }
  }, [
    id,
    user,
    feedback,
    resultado,
    introVisible,
    cargando,
    combo,
    preguntas.length,
    respuestas,
    lanzarFlotante
  ]);

  // --- TIMER: se pausa al leer feedback o abrir un modal ---
  const totalPreguntas = preguntas.length;
  const respondidasCount = Object.keys(respuestas).length;
  const aciertos = Object.values(feedback).filter((item) => item?.correcta).length;
  const metaAciertos = Math.max(1, Math.ceil(totalPreguntas * UMBRAL_APROBACION / 100));
  const hpJefe = totalPreguntas === 0
    ? 100
    : Math.max(1, Math.round(100 - (Math.min(aciertos, metaAciertos) / metaAciertos) * 100));
  const multiplicadorCombo = 1 + Math.min(combo, 4) * 0.5;
  const faseActual = totalPreguntas === 0
    ? 1
    : Math.min(3, Math.floor((respondidasCount / totalPreguntas) * 3) + 1);
  const pendientes = Math.max(0, totalPreguntas - respondidasCount);
  const preguntaActual = preguntas[turnoActual];
  const feedbackActual = preguntaActual ? feedback[preguntaActual.id] : null;
  const pausado = Boolean(
    resultado ||
    cargando ||
    introVisible ||
    confirmarFinal ||
    ataqueFinal ||
    feedbackActual ||
    respondiendo ||
    enviando
  );

  useEffect(() => {
    if (pausado || resultado || cargando || preguntas.length === 0) return undefined;
    const intervalo = setInterval(() => {
      setTiempoRestante((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [pausado, resultado, cargando, preguntas.length]);

  // Autoguardado del reloj para que recargar la página no regale tiempo.
  useEffect(() => {
    if (!claveTimer || cargando || resultado) return;
    try {
      localStorage.setItem(claveTimer, JSON.stringify({
        restante: tiempoRestante,
        guardadoEn: Date.now()
      }));
    } catch {
      // Sin almacenamiento disponible: el servidor seguirá marcando el pulso.
    }
  }, [claveTimer, cargando, resultado, tiempoRestante]);

  // Al llegar a cero se cierra el intento una sola vez.
  useEffect(() => {
    if (tiempoRestante > 0 || cargando || resultado || preguntas.length === 0) return;
    if (respondiendo || enviando || autoEnviadoRef.current) return;
    autoEnviadoRef.current = true;
    enviarExamenServidor(respuestasRef.current);
  }, [tiempoRestante, cargando, resultado, preguntas.length, respondiendo, enviando, enviarExamenServidor]);

  useEffect(() => {
    if (!confirmarFinal) return undefined;
    const alPresionarTecla = (evento) => {
      if (evento.key === 'Escape') setConfirmarFinal(false);
    };
    window.addEventListener('keydown', alPresionarTecla);
    return () => window.removeEventListener('keydown', alPresionarTecla);
  }, [confirmarFinal]);

  const minutos = Math.floor(tiempoRestante / 60);
  const segundos = tiempoRestante % 60;
  const nombreJefe = evaluacion?.nombre_jefe || 'JEFE FINAL';

  const comenzarCombate = () => {
    if (preguntas.length === 0) return;
    sfx.final();
    setIntroVisible(false);
  };

  const alternarSfx = () => {
    const nuevoEstado = !sfxSilenciado;
    setSfxSilenciado(nuevoEstado);
    saveSfxMuted(nuevoEstado);
    if (!nuevoEstado) sfx.select();
  };

  const irAConjuro = (indice) => {
    if (indice < 0 || indice >= preguntas.length || respondiendo || enviando) return;
    setTurnoActual(indice);
  };

  const irAlSiguientePendiente = () => {
    if (preguntas.length === 0) return;
    for (let paso = 1; paso <= preguntas.length; paso += 1) {
      const indice = (turnoActual + paso) % preguntas.length;
      if (!feedback[preguntas[indice].id]) {
        setTurnoActual(indice);
        return;
      }
    }
    if (turnoActual < preguntas.length - 1) setTurnoActual(turnoActual + 1);
  };

  const abrirConfirmacionFinal = () => {
    if (enviando || respondiendo) return;
    sfx.select();
    setConfirmarFinal(true);
  };

  const ejecutarAtaqueFinal = () => {
    setConfirmarFinal(false);
    setAtaqueFinal(true);
    sfx.final();
    timeoutFinalRef.current = setTimeout(() => {
      enviarExamenServidor(respuestasRef.current);
    }, 1200);
  };

  // --- PANTALLA DE CARGA ---
  if (cargando) {
    return (
      <div className="panel-page panel-page--combat">
        <PageBackdrop variant="combat" />
        <div className="container" style={{ maxWidth: '720px', marginTop: '2rem' }}>
          <div className="rpg-combat-shell">
            <div className="rpg-combat-panel">
              <p className="rpg-empty">Invocando al Jefe Final...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ERROR DE CARGA ---
  if (errorCarga) {
    return (
      <div className="panel-page panel-page--combat">
        <PageBackdrop variant="combat" />
        <div className="container" style={{ maxWidth: '620px', marginTop: '2rem' }}>
          <div className="card-pro result-card result-card--lose">
            <h2 className="pixel-font result-title is-fail">La mazmorra no responde</h2>
            <p className="result-copy">{errorCarga}</p>
            <div className="combat-modal__actions" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-pro btn-pro--outline"
                onClick={() => window.location.reload()}
              >
                <RotateCcw size={16} /> Reintentar
              </button>
              <button
                type="button"
                className="btn-pro btn-pro-primary"
                onClick={() => navigate('/panel-estudiante')}
              >
                <ArrowLeft size={16} /> Volver al mapa
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RESULTADO / CRÓNICA ---
  if (resultado) {
    const desglose = Array.isArray(resultado.desglose) ? resultado.desglose : [];
    const totalResultado = Number(resultado.total_preguntas) || desglose.length || totalPreguntas;
    const aciertosResultado = Number.isFinite(Number(resultado.aciertos))
      ? Number(resultado.aciertos)
      : desglose.filter((detalle) => detalle.es_correcta).length;
    const aprobado = Number(resultado.puntaje) >= UMBRAL_APROBACION;
    const puntosMax = Number(resultado.puntos_max ?? evaluacion?.puntos_max ?? 0);
    const puntosGanados = Number(
      resultado.puntos_ganados ?? Math.round((Number(resultado.puntaje) / 100) * puntosMax)
    );
    const notaMateria = resultado.nota_materia ?? user?.nota_materia;
    const tiempoUsado = Math.max(0, TIEMPO_COMBATE - tiempoRestante);
    const minutosUsados = Math.floor(tiempoUsado / 60);
    const segundosUsados = tiempoUsado % 60;
    const logros = resultado.logros_desbloqueados || [];

    return (
      <div className="panel-page panel-page--combat">
        <PageBackdrop variant="combat" />
        <div className="container" style={{ maxWidth: '720px', marginTop: '1.5rem' }}>
          <ToastLogros logros={logrosNuevos} onClose={() => setLogrosNuevos([])} />
          <div className={`card-pro result-card ${aprobado ? 'result-card--win' : 'result-card--lose'}`}>
            <h2 className={`pixel-font result-title ${aprobado ? 'is-pass' : 'is-fail'}`}>
              {aprobado ? `🏆 ¡${nombreJefe} DERROTADO!` : `💀 ${nombreJefe} RESISTIÓ EL ATAQUE`}
            </h2>
            <p className="result-copy">{resultado.retroalimentacion}</p>

            <div className="result-score-box">
              <span className={`result-score ${aprobado ? 'is-pass' : 'is-fail'}`}>
                {resultado.puntaje}%
              </span>
              <span className="badge badge--gold result-xp">
                <Sparkles size={13} /> +{resultado.xp_ganada ?? 0} XP Ganados
              </span>
            </div>

            <div className="result-score-box">
              <span className="result-score is-pass">
                {puntosMax > 0 ? `${puntosGanados} / ${puntosMax} pts` : 'Sin puntos configurados'}
              </span>
              <span className="badge badge--gold result-xp">
                📚 Nota de la materia: {notaMateria ?? '—'} / 100
              </span>
            </div>

            <div className="combat-chronicle">
              <h3 className="combat-chronicle__title">📜 CRÓNICA DEL COMBATE</h3>
              <div className="combat-chronicle__grid">
                <div className="combat-chronicle__stat">
                  <Target size={16} />
                  <span>Aciertos</span>
                  <strong>{aciertosResultado}/{totalResultado}</strong>
                </div>
                <div className="combat-chronicle__stat">
                  <Flame size={16} />
                  <span>Mejor combo</span>
                  <strong>x{mejorCombo}</strong>
                </div>
                <div className="combat-chronicle__stat">
                  <Shield size={16} />
                  <span>HP restante</span>
                  <strong>{hpHeroe}/{HP_HEROE_MAX}</strong>
                </div>
                <div className="combat-chronicle__stat">
                  <Clock size={16} />
                  <span>Tiempo</span>
                  <strong>{minutosUsados}:{segundosUsados < 10 ? `0${segundosUsados}` : segundosUsados}</strong>
                </div>
              </div>
            </div>

            {logros.length > 0 && (
              <div className="result-logros">
                <h4 className="result-logros__titulo">🏆 ¡MEDALLAS DESBLOQUEADAS!</h4>
                {logros.map((logro) => (
                  <div key={logro.id ?? logro.codigo} className="result-logro">
                    <span className="result-logro__icono" aria-hidden="true">{logro.icono}</span>
                    <div>
                      <strong>{logro.nombre}</strong>
                      <span>{logro.descripcion}</span>
                    </div>
                    {Number(logro.xp_bonus) > 0 && (
                      <em className="result-logro__xp">+{logro.xp_bonus} XP</em>
                    )}
                  </div>
                ))}
              </div>
            )}

            {desglose.length > 0 && (
              <div className="result-breakdown rpg-scroll">
                {desglose.map((detalle, indice) => (
                  <div key={detalle.pregunta_id ?? indice} className="result-detail">
                    <strong className="result-detail__q">{indice + 1}. {detalle.enunciado}</strong>
                    <span className={`result-detail__a ${detalle.es_correcta ? 'is-pass' : 'is-fail'}`}>
                      Tu conjuro: {detalle.respuesta_estudiante} | Correcta: {detalle.opcion_correcta}
                    </span>
                    {detalle.explicacion && (
                      <span className="result-detail__explain">{detalle.explicacion}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate('/panel-estudiante?vista=entrenamiento')}
              className="btn-pro btn-pro-ai btn-block"
              style={{ marginBottom: '0.5rem' }}
            >
              <Sparkles size={18} /> {aprobado ? 'Reforzar lo aprendido' : 'Entrenar mis puntos débiles'}
            </button>

            <button onClick={() => navigate('/panel-estudiante')} className="btn-pro btn-pro-primary btn-block">
              <ArrowLeft size={18} /> Volver al Mapa 2D
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- COMBATE ---
  return (
    <div className="panel-page panel-page--combat">
      <PageBackdrop variant="combat" />
      <div className="container" style={{ maxWidth: '880px' }}>
        <div className="rpg-combat-shell">
          <div className="rpg-combat-stage">
            <div className="rpg-combat-top">
              <span className="rpg-combat-turn">
                TURNO {turnoActual + 1} DE {totalPreguntas || 1} · FASE {faseActual}/3
              </span>
              <span className="rpg-combat-turn rpg-combat-turn--gold">
                📚 {evaluacion?.puntos_max ?? '—'} DE 100 PTS EN JUEGO
              </span>
              <div className="combat-top-actions">
                <div
                  className={`rpg-combat-timer ${tiempoRestante <= 30 ? 'is-urgent' : ''}`}
                  aria-label={`Tiempo restante ${minutos} minutos ${segundos} segundos`}
                >
                  <Clock size={15} />
                  {minutos}:{segundos < 10 ? `0${segundos}` : segundos}
                </div>
                <button
                  type="button"
                  className="btn-icon btn-icon--ghost combat-sfx-toggle"
                  onClick={alternarSfx}
                  aria-pressed={!sfxSilenciado}
                  aria-label={sfxSilenciado ? 'Activar sonidos de combate' : 'Silenciar sonidos de combate'}
                  title={sfxSilenciado ? 'Activar sonidos' : 'Silenciar sonidos'}
                >
                  {sfxSilenciado ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
              </div>
            </div>

            <div className={`rpg-fighter rpg-fighter--hero ${impactoHeroe ? 'is-hit' : ''}`}>
              <div className="rpg-fighter__plate combat-plate">
                <strong title={user?.nombre || 'Héroe'}>
                  {user?.nombre || 'Héroe'} · Nvl {user?.nivel || 1}
                </strong>
                <div className="combat-plate__meta">
                  <span>HP</span>
                  <span>{hpHeroe}/{HP_HEROE_MAX}</span>
                </div>
                <div
                  className="rpg-stat-bar rpg-fighter__bar combat-hpbar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={HP_HEROE_MAX}
                  aria-valuenow={hpHeroe}
                  aria-label="HP del héroe"
                >
                  <div
                    className="combat-hpbar__fill combat-hpbar__fill--hero"
                    style={{ width: `${(hpHeroe / HP_HEROE_MAX) * 100}%` }}
                  />
                </div>
              </div>
              <div className="rpg-fighter__sprite">
                <AvatarEstudiante
                  avatar={user?.avatar}
                  size={esMovil ? 58 : 78}
                  className="combat-avatar"
                />
              </div>
            </div>

            {animacionAtaque && <div className="rpg-attack-fx" aria-hidden="true">⚡💥</div>}

            <div className={`rpg-fighter rpg-fighter--boss ${animacionAtaque ? 'is-hit' : ''}`}>
              <div className="rpg-fighter__plate combat-plate combat-plate--boss">
                <strong className="text-danger" title={nombreJefe}>{nombreJefe}</strong>
                <div className="combat-plate__meta">
                  <span>HP</span>
                  <span>{hpJefe}%</span>
                </div>
                <div
                  className="rpg-stat-bar rpg-fighter__bar combat-hpbar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={hpJefe}
                  aria-label="HP del Jefe Final"
                >
                  <div
                    className="combat-hpbar__fill combat-hpbar__fill--boss"
                    style={{ width: `${hpJefe}%` }}
                  />
                </div>
              </div>
              <div className="rpg-fighter__sprite">
                <BossSprite />
              </div>
            </div>

            {flotantes.map((flotante) => (
              <span
                key={flotante.id}
                className={`combat-float combat-float--${flotante.tipo} ${flotante.critico ? 'is-crit' : ''}`}
                aria-hidden="true"
              >
                {flotante.texto}
              </span>
            ))}

            {combo > 0 && (
              <div className="combat-combo" aria-live="polite">
                <Flame size={14} /> COMBO x{combo} <span>PRÓXIMO DAÑO x{multiplicadorCombo.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="rpg-combat-panel">
            {!preguntaActual ? (
              <p className="rpg-empty">Preparando los conjuros de la mazmorra...</p>
            ) : (
              <>
                <div className="rpg-turn-list">
                  {preguntas.map((pregunta, indice) => {
                    const estadoPregunta = feedback[pregunta.id];
                    const estado = estadoPregunta
                      ? (estadoPregunta.correcta ? 'is-correct' : 'is-wrong')
                      : (respuestas[pregunta.id] ? 'is-answered' : '');
                    return (
                      <button
                        key={pregunta.id}
                        type="button"
                        onClick={() => irAConjuro(indice)}
                        className={`rpg-turn-btn ${turnoActual === indice ? 'is-active' : ''} ${estado}`}
                        disabled={respondiendo || enviando}
                        aria-label={`Conjuro ${indice + 1}${estadoPregunta ? (estadoPregunta.correcta ? ', acertado' : ', fallado') : ''}`}
                      >
                        {indice + 1}{estadoPregunta ? (estadoPregunta.correcta ? ' ✓' : ' ✗') : ''}
                      </button>
                    );
                  })}
                </div>

                <div className="rpg-question">
                  <h4 className="rpg-question__text">⚔️ {preguntaActual.enunciado}</h4>
                </div>

                <div className="rpg-options">
                  {['A', 'B', 'C', 'D'].map((opcion) => {
                    const estadoPregunta = feedback[preguntaActual.id];
                    const seleccionada = respuestas[preguntaActual.id] === opcion;
                    const esCorrecta = Boolean(estadoPregunta && estadoPregunta.opcion_correcta === opcion);
                    const esIncorrecta = Boolean(estadoPregunta && seleccionada && !estadoPregunta.correcta);
                    const bloqueada = Boolean(estadoPregunta) || respondiendo || enviando;

                    return (
                      <button
                        key={opcion}
                        type="button"
                        onClick={() => responderConjuro(preguntaActual.id, opcion)}
                        disabled={bloqueada}
                        className={`rpg-option ${seleccionada ? 'is-selected' : ''} ${esCorrecta ? 'is-correct' : ''} ${esIncorrecta ? 'is-wrong' : ''} ${estadoPregunta ? 'is-locked' : ''}`}
                      >
                        <strong className="rpg-option__key">[{opcion}]</strong>
                        <span>{preguntaActual[`opcion_${opcion.toLowerCase()}`]}</span>
                        {esCorrecta && <span className="rpg-option__mark" aria-hidden="true">✓</span>}
                        {esIncorrecta && <span className="rpg-option__mark" aria-hidden="true">✗</span>}
                      </button>
                    );
                  })}
                </div>

                {feedbackActual && (
                  <div
                    className={`combat-feedback ${feedbackActual.correcta ? 'is-correct' : 'is-wrong'}`}
                    role="status"
                    aria-live="polite"
                  >
                    <div className="combat-feedback__head">
                      {feedbackActual.correcta ? (
                        <><Zap size={16} /> ¡CONJURO ACERTADO!</>
                      ) : (
                        <><Skull size={16} /> CONTRAATAQUE DEL JEFE</>
                      )}
                    </div>
                    <p className="combat-feedback__answer">
                      {feedbackActual.correcta
                        ? 'Impacto directo. El Jefe pierde terreno.'
                        : `La respuesta correcta era [${feedbackActual.opcion_correcta}].`}
                    </p>
                    <p className="combat-feedback__explain">{feedbackActual.explicacion}</p>
                    <div className="combat-feedback__actions">
                      <button
                        type="button"
                        className="btn-pro btn-pro--outline"
                        onClick={irAlSiguientePendiente}
                      >
                        {pendientes > 0 ? 'Siguiente conjuro' : 'Revisar conjuros'}
                        <ChevronRight size={16} />
                      </button>
                      {pendientes === 0 && (
                        <button
                          type="button"
                          className="btn-pro btn-pro--gold"
                          onClick={abrirConfirmacionFinal}
                        >
                          <Trophy size={16} /> Ver crónica del combate
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="rpg-combat-footer">
                  <span className="rpg-combat-count">
                    Conjuros lanzados: <strong>{respondidasCount} de {totalPreguntas}</strong>
                  </span>
                  {respondiendo && (
                    <span className="combat-casting" role="status">Lanzando conjuro...</span>
                  )}
                  <button
                    type="button"
                    disabled={enviando || respondiendo || totalPreguntas === 0}
                    onClick={abrirConfirmacionFinal}
                    className="btn-pro btn-pro-primary"
                  >
                    <Swords size={18} /> {enviando ? 'Resolviendo combate...' : '¡Ejecutar ataque final!'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {introVisible && createPortal(
          <div
            className="combat-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`Presentación de ${nombreJefe}`}
          >
            <div className="combat-intro">
              <span className="combat-intro__kicker">
                ⚔️ MAZMORRA · {evaluacion?.tema_titulo || 'SALA DEL JEFE'}
              </span>
              <div className="combat-intro__sprite">
                <BossSprite width={132} height={120} />
              </div>
              <h2 className="combat-intro__boss">{nombreJefe}</h2>
              <p className="combat-intro__theme">{evaluacion?.titulo || 'El guardián de la mazmorra'}</p>
              <p className="combat-intro__lore">
                El velo se rasga y el Jefe Final despierta. {totalPreguntas} conjuros decidirán tu nota.
                Cada acierto hiere al Jefe; cada error desata su contraataque.
              </p>
              <div className="combat-intro__rules">
                <span><Shield size={14} /> HP {HP_HEROE_MAX}</span>
                <span><Swords size={14} /> {totalPreguntas} conjuros</span>
                <span><Target size={14} /> {UMBRAL_APROBACION}% para vencer</span>
              </div>
              <button
                type="button"
                className="btn-pro btn-pro--gold"
                onClick={comenzarCombate}
                autoFocus
              >
                <Swords size={18} /> ¡Comenzar combate!
              </button>
            </div>
          </div>,
          document.body
        )}

        {confirmarFinal && createPortal(
          <div
            className="combat-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar ataque final"
          >
            <div className="combat-modal">
              <h3 className="combat-modal__title">¿Asestar el ataque final?</h3>
              <p className="combat-modal__copy">
                Has lanzado {respondidasCount} de {totalPreguntas} conjuros.
              </p>
              {pendientes > 0 && (
                <p className="combat-modal__warning">
                  ⚠️ {pendientes} conjuro{pendientes === 1 ? '' : 's'} sin lanzar
                  contará{pendientes === 1 ? '' : 'n'} como fallo.
                </p>
              )}
              <div className="combat-modal__stats">
                <span><Shield size={15} /> HP {hpHeroe}/{HP_HEROE_MAX}</span>
                <span><Flame size={15} /> Mejor combo {mejorCombo}</span>
                <span><Target size={15} /> {aciertos} aciertos</span>
              </div>
              <div className="combat-modal__actions">
                <button
                  type="button"
                  className="btn-pro btn-pro--outline"
                  onClick={() => setConfirmarFinal(false)}
                >
                  Seguir luchando
                </button>
                <button type="button" className="btn-danger" onClick={ejecutarAtaqueFinal}>
                  <Swords size={16} /> ¡Golpe final!
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {ataqueFinal && createPortal(
          <div className="combat-overlay combat-overlay--final" role="status" aria-live="assertive">
            <div className="combat-final-fx">
              <div className="combat-final-fx__fighters">
                <div className="combat-final-fx__fighter combat-final-fx__fighter--hero">
                  <AvatarEstudiante avatar={user?.avatar} size={esMovil ? 64 : 92} />
                </div>
                <div className="combat-final-fx__bolt" aria-hidden="true">⚡</div>
                <div className="combat-final-fx__fighter combat-final-fx__fighter--boss">
                  <BossSprite width={132} height={120} />
                </div>
              </div>
              <h3 className="combat-final-fx__title">¡ATAQUE FINAL!</h3>
              <p className="combat-final-fx__copy">El destino de la mazmorra se sella...</p>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
