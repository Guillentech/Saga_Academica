import React, { useState, useEffect, useRef } from 'react';
import { API_URL, urlArchivo } from '../config';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Send } from 'lucide-react';
import { StatBar, GameHud, GameHotbar, PageBackdrop, MarkdownLite } from '../components/rpg';
import PerfilEstudiante from '../components/perfil/PerfilEstudiante';
import MapaGeneral from '../components/mapa/MapaGeneral';
import MapaUnidad from '../components/mapa/MapaUnidad';
import ModalEntrega from '../components/mapa/ModalEntrega';
import ModalTema from '../components/mapa/ModalTema';
import CampoEntrenamiento from '../components/entrenamiento/CampoEntrenamiento';
import { AlchemistWizard16Bit } from '../components/mapa/Sprites';
import { TERRENOS, terrenoDeUnidad, ANCHO_LOGICO } from '../game/terreno';
import { esTileTransitable, puntoInicio } from '../game/mapa';
import { calcularProgresoUnidad, crearUnidadCampamento, temasDeUnidad } from '../game/progreso';
import useMediaQuery from '../hooks/useMediaQuery';

// 📚 Constante de la escala académica (la materia vale 100 puntos)
const NOTA_MAX = 100;

export default function PanelEstudiante() {
  const { user, refrescarEstudiante } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const wrapperMapaRef = useRef(null);  // Contenedor para medir la escala entera
  const esMovil = useMediaQuery('(max-width: 640px)');

  // Fondos de página: cielo sólido + escena sutil (evita que el panel se vea transparente)
  useEffect(() => {
    document.body.classList.add('student-panel-active');
    return () => document.body.classList.remove('student-panel-active');
  }, []);

  // 💡 Estados para la navegación de la barra inferior (Hotbar)
  const [vistaHotbar, setVistaHotbar] = useState(() =>
    searchParams.get('vista') === 'entrenamiento' ? 'entrenamiento' : 'mapa'
  );

  // 💡 Escala entera del canvas (1x, 2x, 3x...) para evitar píxeles borrosos
  const [escalaMapa, setEscalaMapa] = useState(2);

  // 🧭 Filtros de vistas largas (MOCHILA, PERGAMINOS, BOLETA, LOGROS)
  const [filtroTareas, setFiltroTareas] = useState('todas');
  const [busquedaPergaminos, setBusquedaPergaminos] = useState('');
  const [filtroBoleta, setFiltroBoleta] = useState('todas');
  const [filtroLogros, setFiltroLogros] = useState('todas');

  // 📂 Tarjetas de misión expandidas (por ID)
  const [questCardExpandida, setQuestCardExpandida] = useState({});

  // 📍 Posición de scroll para mostrar/ocultar botón "subir al inicio"
  const [scrollY, setScrollY] = useState(0);

  // 💡 Estados para almacenar los datos traídos del Backend (SQLite)
  const [temas, setTemas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [calificaciones, setCalificaciones] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [misEntregas, setMisEntregas] = useState([]);
  const [gremio, setGremio] = useState([]);
  const [boleta, setBoleta] = useState(null);
  const [rachaResumen, setRachaResumen] = useState(null); // 📚 Boleta académica (nota 0-100 puntos)

  // 💡 Estados del Motor de Mapa 2D por Tiles y Ciudadelas
  const [heroPos, setHeroPos] = useState({ x: 15, y: 8 });
  const [caminando, setCaminando] = useState(false);
  const [zonaActivaModal, setZonaActivaModal] = useState(null);
  const [unidadActiva, setUnidadActiva] = useState(null);

  // 💡 Estados de Entregas de Misiones (Trabajos Prácticos)
  const [tareaEnEntrega, setTareaEnEntrega] = useState(null);
  const [avisoEntrega, setAvisoEntrega] = useState('');

  // 💡 Estados del Sabio Alquimista (Copiloto IA Estudiantil)
  const [dialogoAlquimistaAbierto, setDialogoAlquimistaAbierto] = useState(false);
  const [preguntaAlquimista, setPreguntaAlquimista] = useState('');
  const [respuestaAlquimista, setRespuestaAlquimista] = useState('');
  const [cargandoAlquimista, setCargandoAlquimista] = useState(false);

  // 🔥 FUNCIÓN: Cargar racha diaria y precisión de entrenamiento para el HUD.
  const cargarRacha = () => {
    if (!user?.id) return;
    fetch(`${API_URL}/api/estudiantes/${user.id}/racha`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data) setRachaResumen(data); })
      .catch(() => setRachaResumen(null));
  };

  // 💡 FUNCIÓN: Cargar toda la data de la base de datos al inicio
  const cargarDatos = () => {
    fetch(`${API_URL}/api/unidades`)
      .then(r => { if (!r.ok) throw new Error('No se pudieron cargar las Ciudadelas'); return r.json(); })
      .then(setUnidades)
      .catch(() => setUnidades([]));
    fetch(`${API_URL}/api/temas`).then(r => r.json()).then(setTemas);
    fetch(`${API_URL}/api/evaluaciones`).then(r => r.json()).then(setEvaluaciones);
    fetch(`${API_URL}/api/tareas`).then(r => r.json()).then(setTareas);
    fetch(`${API_URL}/api/gremio`).then(r => r.json()).then(setGremio);

    if (user?.id) {
      refrescarEstudiante();
      cargarRacha();
      fetch(`${API_URL}/api/calificaciones/estudiante/${user.id}`)
        .then(r => r.json())
        .then(setCalificaciones);

      fetch(`${API_URL}/api/estudiantes/${user.id}/boleta`)
        .then(r => r.json())
        .then(setBoleta)
        .catch(() => setBoleta(null));

      fetch(`${API_URL}/api/entregas/estudiante/${user.id}`)
        .then(r => (r.ok ? r.json() : []))
        .then(setMisEntregas)
        .catch(() => setMisEntregas([]));
    }
  };

  useEffect(() => {
    cargarDatos();
    // cargarDatos se recrea en cada render; solo dependemos del usuario autenticado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ✅ El aviso de entrega exitosa se oculta solo para no dejar ruido en el inventario.
  useEffect(() => {
    if (!avisoEntrega) return undefined;
    const temporizador = setTimeout(() => setAvisoEntrega(''), 6000);
    return () => clearTimeout(temporizador);
  }, [avisoEntrega]);

  // ==========================================================================
  // 💡 CÁLCULO DE ESCALA ENTERA (1x, 2x, 3x...) PARA EVITAR PÍXELES BORROSOS
  // ==========================================================================
  useEffect(() => {
    const actualizarEscala = () => {
      if (!wrapperMapaRef.current) return;
      const anchoDisponible = wrapperMapaRef.current.clientWidth - 8;
      const factorEntero = Math.max(1, Math.floor(anchoDisponible / ANCHO_LOGICO));
      setEscalaMapa(factorEntero);
    };

    actualizarEscala();
    window.addEventListener('resize', actualizarEscala);
    return () => window.removeEventListener('resize', actualizarEscala);
  }, [vistaHotbar]);

  // 📍 Detectar scroll para mostrar el botón "subir al inicio" en vistas largas
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ==========================================================================
  // 💡 DATOS DERIVADOS DEL MAPA CONTINENTAL Y DE LA UNIDAD ACTIVA
  // ==========================================================================
  const temasSinUnidad = temas.filter(tema => tema.unidad_id == null);
  const campamento = crearUnidadCampamento(temasSinUnidad);
  const unidadesVisibles = campamento ? [...unidades, campamento] : unidades;
  const temasUnidadActiva = unidadActiva
    ? (unidadActiva.esCampamento ? temasSinUnidad : temasDeUnidad(temas, unidadActiva.id))
    : [];
  const terrenoActual = unidadActiva ? terrenoDeUnidad(unidadActiva) : TERRENOS.continental;

  const progresoPorUnidad = Object.fromEntries(unidadesVisibles.map(unidad => {
    const temasDeLaUnidad = unidad.esCampamento ? temasSinUnidad : temasDeUnidad(temas, unidad.id);
    return [unidad.id, calcularProgresoUnidad({
      temas: temasDeLaUnidad,
      evaluaciones,
      tareas,
      calificaciones,
      entregas: misEntregas
    })];
  }));

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 DERIVADOS DE FILTRO PARA VISTAS LARGAS (MOCHILA / PERGAMINOS / BOLETA / LOGROS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // MOCHILA: tareas filtradas y resumen de progreso
  const tareasFiltradas = [...tareas]
    .filter(t => {
      const entrega = misEntregas.find(e => e.tarea_id === t.id);
      if (filtroTareas === 'pendientes') return !entrega;
      if (filtroTareas === 'entregadas') return !!entrega;
      return true;
    })
    .sort((a, b) => {
      const entA = misEntregas.some(e => e.tarea_id === a.id);
      const entB = misEntregas.some(e => e.tarea_id === b.id);
      if (entA && !entB) return 1;
      if (!entA && entB) return -1;
      return 0;
    });

  const resumenTareas = {
    total: tareas.length,
    pendientes: tareas.filter(t => !misEntregas.some(e => e.tarea_id === t.id)).length,
    entregadas: misEntregas.filter(e => e.calificacion != null).length,
  };

  // PERGAMINOS: temas filtrados por búsqueda
  const temasFiltrados = temas.filter(t =>
    t.titulo.toLowerCase().includes(busquedaPergaminos.toLowerCase())
  );

  // BOLETA: rendimiento filtrado por tipo
  const rendimientoFiltrado = boleta?.rendimiento.filter(r =>
    filtroBoleta === 'todas' || r.tipo === filtroBoleta
  ) ?? [];

  // LOGROS: calificaciones filtradas por desempeño
  const calificacionesFiltradas = calificaciones.filter(cal => {
    const aprueba = cal.puntaje >= 60;
    if (filtroLogros === 'aprobados') return aprueba;
    if (filtroLogros === 'reprobados') return !aprueba;
    return true;
  });

  // ==========================================================================
  // 💡 MOVIMIENTO DEL HÉROE Y NAVEGACIÓN ENTRE CIUDADELAS
  // ==========================================================================
  const moverHeroe = (col, fila) => {
    if (!esTileTransitable(terrenoActual, col, fila)) return;
    setCaminando(true);
    setHeroPos({ x: col, y: fila });
    setTimeout(() => setCaminando(false), 180);
  };

  useEffect(() => {
    if (vistaHotbar !== 'mapa' || zonaActivaModal || dialogoAlquimistaAbierto) return undefined;

    const handleKeyDown = (e) => {
      const k = e.key.toLowerCase();
      let dx = 0;
      let dy = 0;

      if (k === 'w' || k === 'arrowup') dy = -1;
      else if (k === 's' || k === 'arrowdown') dy = 1;
      else if (k === 'a' || k === 'arrowleft') dx = -1;
      else if (k === 'd' || k === 'arrowright') dx = 1;
      else return;

      e.preventDefault();
      setHeroPos(prev => {
        const nuevaCol = Math.max(0, Math.min(29, prev.x + dx));
        const nuevaFila = Math.max(0, Math.min(16, prev.y + dy));
        if (!esTileTransitable(terrenoActual, nuevaCol, nuevaFila)) return prev;
        return { x: nuevaCol, y: nuevaFila };
      });
      setCaminando(true);
      setTimeout(() => setCaminando(false), 150);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [vistaHotbar, zonaActivaModal, dialogoAlquimistaAbierto, terrenoActual]);

  const posicionInicial = (terreno) => {
    const punto = puntoInicio(terreno);
    return { x: punto.col, y: punto.fila };
  };

  const entrarUnidad = (unidad, posicion) => {
    setCaminando(true);
    if (posicion) setHeroPos({ x: posicion.x, y: posicion.y });
    setTimeout(() => {
      setCaminando(false);
      setUnidadActiva(unidad);
      setHeroPos(posicionInicial(terrenoDeUnidad(unidad)));
      setZonaActivaModal(null);
    }, 240);
  };

  const salirUnidad = () => {
    setUnidadActiva(null);
    setZonaActivaModal(null);
    setHeroPos(posicionInicial(TERRENOS.continental));
  };

  const abrirTema = (tema, posicion) => {
    if (posicion) {
      setCaminando(true);
      setHeroPos({ x: posicion.x, y: posicion.y });
      setTimeout(() => setCaminando(false), 180);
    }
    setZonaActivaModal({
      titulo: tema.titulo,
      descripcion: tema.descripcion,
      ejemplos: tema.ejemplos || [],
      evaluaciones: evaluaciones.filter(ev => ev.tema_id === tema.id)
    });
  };

  const abrirJefeUnidad = (evals) => {
    const nombreUnidad = unidadActiva?.esCampamento ? 'zona' : 'Unidad ' + (unidadActiva?.numero ?? '');
    setZonaActivaModal({
      titulo: 'Jefe de la ' + nombreUnidad,
      descripcion: 'El guardián de la Ciudadela aguarda al final del sendero. Derrota a este jefe para cerrar la Unidad.',
      ejemplos: [],
      evaluaciones: evals
    });
  };

  // 💡 FUNCIÓN: Consultar al Bot AI del Sabio Alquimista
  const consultarSabioAlquimista = async (e) => {
    e.preventDefault();
    if (!preguntaAlquimista.trim()) return;
    setCargandoAlquimista(true);
    try {
      const titulosTemas = temas.map(t => t.titulo).join(', ');
      const res = await fetch(`${API_URL}/api/ia/asistente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: preguntaAlquimista.trim(),
          modo: 'alquimista',
          contexto: `Biomas del mapa: ${titulosTemas}`
        })
      });
      const data = await res.json();
      if (res.ok) setRespuestaAlquimista(data.resultado);
    } catch {
      setRespuestaAlquimista('🦉 El Sabio Alquimista medita sobre tu consulta... intenta nuevamente.');
    } finally {
      setCargandoAlquimista(false);
    }
  };

  // ==========================================================================
  // 💡 CÁLCULOS DEL HUD (ESTADÍSTICAS DEL JUGADOR Y CLIMA)
  // ==========================================================================
  const xpActual = user?.xp || 150;
  const nivelActual = user?.nivel || 1;
  const xpEnNivel = xpActual % 250;

  const examenesPendientes = evaluaciones.filter(ev => !calificaciones.some(c => c.evaluacion_id === ev.id));
  const tareasPendientes = tareas.filter(t => !misEntregas.some(e => e.tarea_id === t.id));
  
  const energiaActual = Math.max(35, 100 - (examenesPendientes.length * 10));
  const hpActual = Math.min(100, 60 + nivelActual * 5);
  const hayTormenta = examenesPendientes.length > 0 || tareasPendientes.length > 0;
  const estadoHeroe = energiaActual <= 35 ? 'energia-baja' : (hayTormenta ? 'combate' : 'normal');

  return (
    <div className={`panel-page panel-page--student ${vistaHotbar === 'mapa' ? 'mapa-activa' : ''}`}>
      <PageBackdrop variant="student" />
      <div className="container page-shell" style={{ maxWidth: '1220px' }}>
      
      {/* =====================================================================
          1. HUD SUPERIOR UNIFICADO (AVATAR + BARRAS XP/EN/HP + TABLÓN + RUNA)
         ===================================================================== */}
      <GameHud
        user={user}
        nivelActual={nivelActual}
        xpEnNivel={xpEnNivel}
        xpMaximo={250}
        energiaActual={energiaActual}
        hpActual={hpActual}
        examenesPendientes={examenesPendientes.length}
        tareasPendientes={tareasPendientes.length}
        hayTormenta={hayTormenta}
        rachaActual={rachaResumen?.racha?.actual ?? 0}
        metaDiariaCumplida={rachaResumen?.racha?.meta_diaria?.cumplida ?? false}
        onHablarAlquimista={() => setDialogoAlquimistaAbierto(true)}
      />

            {vistaHotbar === 'mapa' && (
        <div ref={wrapperMapaRef} className="mapa-wrapper flex w-full justify-center overflow-x-auto">
          <div className="relative w-full sm:w-auto">
            {!unidadActiva ? (
              <MapaGeneral
                unidades={unidadesVisibles}
                terreno={TERRENOS.continental}
                heroPos={heroPos}
                escala={escalaMapa}
                caminando={caminando}
                progresoPorUnidad={progresoPorUnidad}
                claseHeroe={user?.clase_rpg || 'Arquera Lógica'}
                estadoHeroe={estadoHeroe}
                esMovil={esMovil}
                onMoverHeroe={moverHeroe}
                onEntrarUnidad={entrarUnidad}
              />
            ) : (
              <MapaUnidad
                unidad={unidadActiva}
                temas={temasUnidadActiva}
                terreno={terrenoActual}
                heroPos={heroPos}
                escala={escalaMapa}
                caminando={caminando}
                claseHeroe={user?.clase_rpg || 'Arquera Lógica'}
                estadoHeroe={estadoHeroe}
                evaluaciones={evaluaciones}
                tareas={tareas}
                calificaciones={calificaciones}
                entregas={misEntregas}
                esMovil={esMovil}
                onVolver={salirUnidad}
                onMoverHeroe={moverHeroe}
                onTemaClick={abrirTema}
                onJefeClick={abrirJefeUnidad}
              />
            )}
          </div>

          {zonaActivaModal && (
            <ModalTema
              zona={zonaActivaModal}
              calificaciones={calificaciones}
              onClose={() => setZonaActivaModal(null)}
              onIniciarEvaluacion={(ev) => navigate(`/evaluacion/${ev.id}`)}
            />
          )}

          {/* 💡 MODAL DEL MENTOR AI (Chat con el Sabio Alquimista) */}
          {dialogoAlquimistaAbierto && (
            <div className="rpg-modal" role="dialog" aria-modal="true" aria-label="Sabio Alquimista AI">
              <div className="rpg-modal__head">
                <div className="role-card__id">
                  <span className="alchemist-bubble__sprite"><AlchemistWizard16Bit /></span>
                  <div>
                    <span className="hud-eyebrow hud-eyebrow--gold">MENTOR ARCANO IA</span>
                    <h3 className="rpg-modal__title">Sabio Alquimista AI</h3>
                  </div>
                </div>
                <button onClick={() => setDialogoAlquimistaAbierto(false)} className="btn-danger btn-sm">✕ Cerrar</button>
              </div>

              <div className="rpg-modal__body rpg-modal__body--column">
                <div className="ai-dialogue">
                  <MarkdownLite className="md-alquimista">
                    {respuestaAlquimista || `🧙‍♂️ "¡Saludos, ${user?.nombre || 'Aventurero'}! Escribe cualquier duda sobre Cálculo, Programación o Estadística y te guiaré antes de que cruces la puerta de la mazmorra."`}
                  </MarkdownLite>
                </div>

                <form onSubmit={consultarSabioAlquimista} className="ai-ask">
                  <input type="text" className="input-pro" placeholder="Pregúntale al Sabio Alquimista..." value={preguntaAlquimista} onChange={(e) => setPreguntaAlquimista(e.target.value)} />
                  <button type="submit" disabled={cargandoAlquimista} className="btn-pro btn-pro-ai">
                    <Send size={16} /> {cargandoAlquimista ? 'Consultando...' : 'Consultar'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

{/* =====================================================================
          3. SUB-VISTAS DE LA BARRA INFERIOR (INVENTARIO, PERGAMINOS, GREMIO, LOGROS)
         ===================================================================== */}
      {vistaHotbar === 'inventario' && (
        <div className="vista-scroll card-pro">
          <h3 className="pixel-font section-title section-title--gold">🎒 INVENTARIO Y MISIONES</h3>

          <div className="vista-resumen">
            <div className="vista-resumen__item">
              <span className="vista-resumen__valor">{resumenTareas.total}</span>
              <span className="vista-resumen__etiqueta">Tareas totales</span>
            </div>
            <div className="vista-resumen__item">
              <span className="vista-resumen__valor">{resumenTareas.pendientes}</span>
              <span className="vista-resumen__etiqueta">Pendientes</span>
            </div>
            <div className="vista-resumen__item">
              <span className="vista-resumen__valor">{resumenTareas.entregadas}</span>
              <span className="vista-resumen__etiqueta">Calificadas</span>
            </div>
          </div>

          <div className="filtro-tareas">
            <button
              type="button"
              className={`filtro-chip ${filtroTareas === 'todas' ? 'is-active' : ''} filtro-chip--todas`}
              onClick={() => setFiltroTareas('todas')}
            >
              Todas ({resumenTareas.total})
            </button>
            <button
              type="button"
              className={`filtro-chip ${filtroTareas === 'pendientes' ? 'is-active' : ''} filtro-chip--pendientes`}
              onClick={() => setFiltroTareas('pendientes')}
            >
              Pendientes ({resumenTareas.pendientes})
            </button>
            <button
              type="button"
              className={`filtro-chip ${filtroTareas === 'entregadas' ? 'is-active' : ''} filtro-chip--entregadas`}
              onClick={() => setFiltroTareas('entregadas')}
            >
              Entregadas ({resumenTareas.entregadas})
            </button>
          </div>

          {avisoEntrega && (
            <p className="perfil-mensaje is-success" role="status">✅ {avisoEntrega}</p>
          )}

          {tareasFiltradas.length === 0 && (
            <p className="rpg-empty">No hay misiones con este filtro.</p>
          )}
          {tareasFiltradas.map(tar => {
            const entrega = misEntregas.find(e => e.tarea_id === tar.id);
            const expandida = !!questCardExpandida[tar.id];
            return (
              <div
                key={tar.id}
                className={`quest-card ${expandida ? '' : 'quest-card--compact'}`}
                onClick={() => setQuestCardExpandida(prev => ({ ...prev, [tar.id]: !expandida }))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setQuestCardExpandida(prev => ({ ...prev, [tar.id]: !expandida }))}
              >
                <div className="quest-card__head">
                  <h4 className="quest-card__title">
                    ⚔️ {tar.titulo}
                    <span className="text-muted">({tar.tema_titulo})</span>
                  </h4>
                  <span className={`badge ${entrega ? 'badge-success' : 'badge-danger'}`}>
                    {entrega ? 'Entregada' : 'Pendiente'}
                  </span>
                </div>

                <div className="quest-card__resumen">
                  <span>
                    📚 {tar.puntos_max ?? 10} pts
                    {entrega?.calificacion != null && ` • ${entrega.calificacion}%`}
                  </span>
                  {expandida && (
                    <span className="ui-px" style={{ fontSize: '7px' }}>
                      {expandida ? '▲ comprimir' : '▼ expandir'}
                    </span>
                  )}
                </div>

                {expandida && (
                  <>
                    <p className="quest-card__desc" style={{ marginTop: '0.5rem' }}>{tar.descripcion}</p>

                    <span className="quest-card__meta text-xp" style={{ marginTop: '0.25rem' }}>
                      📚 Vale {tar.puntos_max ?? 10} de 100 pts de la materia
                      {entrega?.calificacion != null && (
                        <> • Tu nota: {entrega.calificacion}% = <strong>{entrega.puntos_ganados ?? '—'} pts</strong></>
                      )}
                      {entrega && entrega.calificacion == null && <> • Esperando calificación del Game Master</>}
                    </span>

                    {tar.archivo_adjunto && (
                      <a
                        href={tar.archivo_adjunto}
                        download={`Guia_Mision_${tar.titulo.replace(/\s+/g, '_')}`}
                        className="quest-file"
                        style={{ marginTop: '0.3rem' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        📄 Descargar Documento Adjunto
                      </a>
                    )}

                    {entrega && (
                      <div className="entrega-resumen">
                        <div className="entrega-resumen__head">
                          <span className="entrega-resumen__titulo">TU ENTREGA</span>
                          {entrega.calificacion != null ? (
                            <span className="badge badge-success">
                              {entrega.calificacion}% · {entrega.puntos_ganados ?? '—'} pts
                            </span>
                          ) : (
                            <span className="badge badge--gold">En revisión</span>
                          )}
                        </div>

                        {entrega.contenido && (
                          <p className="entrega-resumen__texto">{entrega.contenido}</p>
                        )}

                        {entrega.archivo_ruta && (
                          <a
                            href={urlArchivo(entrega.archivo_ruta)}
                            download={entrega.archivo_nombre || `Entrega_${tar.titulo.replace(/\s+/g, '_')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="quest-file"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText size={14} /> {entrega.archivo_nombre || 'Archivo enviado'}
                          </a>
                        )}

                        {entrega.retroalimentacion && (
                          <p className="entrega-feedback">
                            <strong>Game Master:</strong> {entrega.retroalimentacion}
                          </p>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTareaEnEntrega(tar);
                      }}
                      className="btn-pro btn-pro-primary btn-block quest-card__entrega"
                    >
                      <FileText size={15} /> {entrega ? 'Revisar o actualizar entrega' : 'Adjuntar archivo y entregar'}
                    </button>
                  </>
                )}
              </div>
            );
          })}

          {tareaEnEntrega && (
            <ModalEntrega
              tarea={tareaEnEntrega}
              entrega={misEntregas.find(e => e.tarea_id === tareaEnEntrega.id)}
              estudianteId={user?.id}
              onClose={() => setTareaEnEntrega(null)}
              onEnviada={(mensaje) => {
                setTareaEnEntrega(null);
                setAvisoEntrega(mensaje || '¡Misión entregada con éxito!');
                cargarDatos();
              }}
            />
          )}
        </div>
      )}

      {vistaHotbar === 'pergaminos' && (
        <div className="vista-scroll card-pro">
          <h3 className="pixel-font section-title section-title--xp">📜 PERGAMINOS DE TEORÍA</h3>

          <div className="vista-resumen">
            <div className="vista-resumen__item">
              <span className="vista-resumen__valor">{temasFiltrados.length}</span>
              <span className="vista-resumen__etiqueta">Pergamínos disponibles</span>
            </div>
          </div>

          <input
            type="text"
            className="input-pro busqueda-pergaminos"
            placeholder="Buscar pergamino por título..."
            value={busquedaPergaminos}
            onChange={(e) => setBusquedaPergaminos(e.target.value)}
          />

          {temasFiltrados.length === 0 && (
            <p className="rpg-empty">No se encontraron pergamínos con ese título.</p>
          )}
          {temasFiltrados.map(t => {
            const expandida = !!questCardExpandida[`pergamino-${t.id}`];
            return (
              <div
                key={t.id}
                className={`scroll-entry ${expandida ? '' : 'scroll-entry--colapsado'}`}
                onClick={() => setQuestCardExpandida(prev => ({ ...prev, [`pergamino-${t.id}`]: !expandida }))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setQuestCardExpandida(prev => ({ ...prev, [`pergamino-${t.id}`]: !expandida }))}
              >
                <h4 className="scroll-entry__title">{t.titulo}</h4>
                {!expandida && <p className="scroll-entry__desc">{t.descripcion}</p>}
                {expandida && (
                  <>
                    <p className="scroll-entry__desc">{t.descripcion}</p>
                    <span className="codigo-colapsable-toggle" style={{ display: 'inline-block', marginTop: '0.3rem' }}>
                      {expandida ? '▲ comprimir ejemplos' : '▼ ver ejemplos de código'}
                    </span>
                    {t.ejemplos?.map(ej => (
                      <pre key={ej.id} className="rpg-code">
                        <strong>// {ej.titulo}</strong>{'\n'}{ej.contenido}
                      </pre>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {vistaHotbar === 'gremio' && (
        <div className="card-pro">
          <h3 className="pixel-font section-title section-title--teacher">🛡️ TABLA DEL GREMIO</h3>
          <div className="rpg-table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Aventurero</th><th>Clase</th><th>Nivel</th><th>XP</th></tr>
              </thead>
              <tbody>
                {gremio.map((m, i) => (
                  <tr key={m.id}>
                    <td>{i + 1}</td>
                    <td className="text-strong">{m.nombre}</td>
                    <td className="text-student">{m.clase_rpg}</td>
                    <td>Nvl {m.nivel || 1}</td>
                    <td className="text-xp">{m.xp || 150} XP</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {gremio.length === 0 && <p className="rpg-empty">El gremio aún no tiene aventureros registrados.</p>}
        </div>
      )}

      {vistaHotbar === 'boleta' && (
        <div className="vista-scroll card-pro">
          <h3 className="pixel-font section-title section-title--gold">🎓 BOLETA DE LA MATERIA</h3>

          {!boleta ? (
            <p className="rpg-empty">Cargando boleta académica...</p>
          ) : (
            <>
              <div className="achievement-row" style={{ alignItems: 'flex-start' }}>
                <div>
                  <strong className="achievement-row__title">NOTA ACTUAL</strong>
                  <span className="achievement-row__meta">
                    Escala de la materia: 0 a {boleta.nota_max} puntos • {boleta.puntos_ganados} ganados • {boleta.puntos_restantes_materia} por ganar
                  </span>
                </div>
                <span className={`achievement-score ${boleta.nota_materia >= 60 ? 'is-pass' : 'is-fail'}`}>
                  {boleta.nota_materia} / {boleta.nota_max}
                </span>
              </div>

              <StatBar
                label={`★ NOTA DE LA MATERIA (${boleta.puntos_ganados} / ${boleta.nota_max} PTS)`}
                value={boleta.nota_materia}
                max={boleta.nota_max}
                color="xp"
                suffix=" pts"
                showPercent={false}
              />

              <p className="section-sub">
                📖 Cada actividad vale unos puntos de la materia. Tu nota es la suma de los puntos que has ganado
                (nunca supera {boleta.nota_max}). La XP y el nivel son progresión de tu héroe y <strong>no afectan la nota</strong>.
              </p>

              <div className="filtro-boleta">
                <button
                  type="button"
                  className={`filtro-chip ${filtroBoleta === 'todas' ? 'is-active' : ''} filtro-chip--todas`}
                  onClick={() => setFiltroBoleta('todas')}
                >
                  Todas ({boleta.rendimiento.length})
                </button>
                <button
                  type="button"
                  className={`filtro-chip ${filtroBoleta === 'examen' ? 'is-active' : ''} filtro-chip--pendientes`}
                  onClick={() => setFiltroBoleta('examen')}
                >
                  Exámenes ({boleta.rendimiento.filter(r => r.tipo === 'examen').length})
                </button>
                <button
                  type="button"
                  className={`filtro-chip ${filtroBoleta === 'mision' ? 'is-active' : ''} filtro-chip--entregadas`}
                  onClick={() => setFiltroBoleta('mision')}
                >
                  Misiones ({boleta.rendimiento.filter(r => r.tipo !== 'examen').length})
                </button>
              </div>

              <h4 className="zone-column__title">📜 ACTIVIDADES CALIFICADAS ({rendimientoFiltrado.length})</h4>
              {rendimientoFiltrado.length === 0 && (
                <p className="rpg-empty">No hay actividades con este filtro.</p>
              )}
              {rendimientoFiltrado.length > 0 && (
                <div className="rpg-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Actividad</th>
                        <th>Tipo</th>
                        <th>Tema</th>
                        <th>Puntos</th>
                        <th>Desempeño</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rendimientoFiltrado.map((r) => (
                        <tr key={`${r.tipo}-${r.registro_id}`}>
                          <td className="text-strong">{r.actividad}</td>
                          <td>{r.tipo === 'examen' ? '⚔️ Examen' : '🎒 Misión'}</td>
                          <td className="text-student">{r.tema_titulo}</td>
                          <td className="text-xp is-strong">{r.puntos_ganados} / {r.puntos_max} pts</td>
                          <td className={r.porcentaje >= 60 ? 'badge badge-success' : 'badge badge-danger'}>
                            {r.porcentaje}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h4 className="zone-column__title" style={{ marginTop: '1rem' }}>⏳ PUNTOS PENDIENTES ({boleta.pendientes.length})</h4>
              {boleta.pendientes.length === 0 ? (
                <p className="rpg-empty">¡Completaste todas las actividades de la materia!</p>
              ) : (
                boleta.pendientes.map((p) => (
                  <div key={`${p.tipo}-${p.actividad_id}`} className="achievement-row">
                    <div>
                      <strong className="achievement-row__title">{p.actividad}</strong>
                      <span className="achievement-row__meta">
                        {p.tipo === 'examen' ? '⚔️ Examen' : '🎒 Misión'} • Tema: {p.tema_titulo}
                      </span>
                    </div>
                    <span className="achievement-score is-fail">{p.puntos_max} pts en juego</span>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}

      {vistaHotbar === 'entrenamiento' && (
        <CampoEntrenamiento
          estudianteId={user?.id}
          onActividadRegistrada={() => {
            cargarRacha();
            refrescarEstudiante();
          }}
        />
      )}

      {vistaHotbar === 'perfil' && <PerfilEstudiante />}

      {vistaHotbar === 'logros' && (
        <div className="vista-scroll card-pro">
          <h3 className="pixel-font section-title section-title--gold">🏆 LOGROS Y RESULTADOS</h3>

          <div className="vista-resumen">
            <div className="vista-resumen__item">
              <span className="vista-resumen__valor">{calificaciones.length}</span>
              <span className="vista-resumen__etiqueta">Actividades</span>
            </div>
            <div className="vista-resumen__item">
              <span className="vista-resumen__valor">
                {calificaciones.filter(c => c.puntaje >= 60).length}
              </span>
              <span className="vista-resumen__etiqueta">Aprobadas</span>
            </div>
            <div className="vista-resumen__item">
              <span className="vista-resumen__valor">
                {calificaciones.length > 0
                  ? Math.round((calificaciones.filter(c => c.puntaje >= 60).length / calificaciones.length) * 100)
                  : 0}%
              </span>
              <span className="vista-resumen__etiqueta">Tasa de éxito</span>
            </div>
          </div>

          <div className="filtro-tareas">
            <button
              type="button"
              className={`filtro-chip ${filtroLogros === 'todas' ? 'is-active' : ''} filtro-chip--todas`}
              onClick={() => setFiltroLogros('todas')}
            >
              Todas ({calificaciones.length})
            </button>
            <button
              type="button"
              className={`filtro-chip ${filtroLogros === 'aprobados' ? 'is-active' : ''} filtro-chip--entregadas`}
              onClick={() => setFiltroLogros('aprobados')}
            >
              Aprobadas ({calificaciones.filter(c => c.puntaje >= 60).length})
            </button>
            <button
              type="button"
              className={`filtro-chip ${filtroLogros === 'reprobados' ? 'is-active' : ''} filtro-chip--pendientes`}
              onClick={() => setFiltroLogros('reprobados')}
            >
              Reprobadas ({calificaciones.filter(c => c.puntaje < 60).length})
            </button>
          </div>

          <p className="section-sub">
            📚 Escala de la materia: 0 a {NOTA_MAX} puntos. Tu nota actual es <strong>{boleta?.nota_materia ?? 0} / {NOTA_MAX} pts</strong>.
            La XP y el nivel no afectan la nota.
          </p>

          {calificacionesFiltradas.length === 0 && (
            <p className="rpg-empty">
              {filtroLogros !== 'todas'
                ? `No hay actividades ${filtroLogros === 'aprobados' ? 'aprobadas' : 'reprobadas'} aún.`
                : 'Todavía no has librado ningún combate. ¡Entra a un bioma y desafía a su Jefe!'
              }
            </p>
          )}
          {calificacionesFiltradas.map(cal => (
            <div key={cal.id} className="achievement-row">
              <div>
                <strong className="achievement-row__title">{cal.evaluacion_titulo}</strong>
                <span className="achievement-row__meta">
                  Tema: {cal.tema_titulo || '—'} • +{cal.xp_ganada || 150} XP • {cal.aciertos}/{cal.total_preguntas} aciertos • 📚 {cal.puntos_ganados ?? '—'}/{cal.puntos_max ?? '—'} pts
                </span>
              </div>
              <span className={`achievement-score ${cal.puntaje >= 60 ? 'is-pass' : 'is-fail'}`}>{cal.puntaje}%</span>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================
          4. BOTTOM HUD (HOTBAR DE INVENTARIO CLÁSICA)
         ===================================================================== */}
      <GameHotbar activa={vistaHotbar} onChange={setVistaHotbar} />

      {/* 📍 Botón flotante "subir al inicio" (solo aparece tras scrollear) */}
      {scrollY > 200 && (
        <button
          type="button"
          className="btn-subir is-visible"
          onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
          aria-label="Subir al inicio de la página"
        >
          ↑
        </button>
      )}

    </div>
    </div>
  );
}