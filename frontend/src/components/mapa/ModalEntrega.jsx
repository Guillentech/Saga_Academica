import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Send, UploadCloud, X } from 'lucide-react';
import { API_URL, urlArchivo } from '../../config';

const MAX_ARCHIVO_BYTES = 10 * 1024 * 1024;
const EXTENSIONES_PERMITIDAS = ['.pdf', '.doc', '.docx'];

const extensionDe = (nombre = '') => {
  const punto = nombre.lastIndexOf('.');
  return punto >= 0 ? nombre.slice(punto).toLowerCase() : '';
};

const formatearTamano = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function ModalEntrega({ tarea, entrega, estudianteId, onClose, onEnviada }) {
  const [contenido, setContenido] = useState(entrega?.contenido || '');
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const inputArchivoRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    modalRef.current?.focus();
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, []);

  useEffect(() => {
    const alPresionarTecla = (evento) => {
      if (evento.key === 'Escape' && !enviando) {
        evento.stopPropagation();
        onClose?.();
      }
    };
    window.addEventListener('keydown', alPresionarTecla);
    return () => window.removeEventListener('keydown', alPresionarTecla);
  }, [enviando, onClose]);

  if (!tarea) return null;

  const archivoActual = entrega?.archivo_ruta
    ? {
        nombre: entrega.archivo_nombre || 'Documento adjunto',
        url: urlArchivo(entrega.archivo_ruta)
      }
    : null;

  const cerrar = () => {
    if (!enviando) onClose?.();
  };

  const validarArchivo = (seleccionado) => {
    if (!EXTENSIONES_PERMITIDAS.includes(extensionDe(seleccionado.name))) {
      setError('Solo se permiten archivos PDF, DOC o DOCX.');
      return false;
    }
    if (seleccionado.size > MAX_ARCHIVO_BYTES) {
      setError('El archivo supera el tamaño máximo permitido de 10 MB.');
      return false;
    }
    if (seleccionado.size === 0) {
      setError('El archivo seleccionado está vacío.');
      return false;
    }
    return true;
  };

  const seleccionarArchivo = (seleccionado) => {
    if (!seleccionado || enviando) return;
    if (!validarArchivo(seleccionado)) {
      if (inputArchivoRef.current) inputArchivoRef.current.value = '';
      return;
    }
    setArchivo(seleccionado);
    setError('');
  };

  const handleArchivo = (evento) => {
    seleccionarArchivo(evento.target.files?.[0]);
    evento.target.value = '';
  };

  const handleDragOver = (evento) => {
    evento.preventDefault();
    evento.stopPropagation();
    if (!enviando) setArrastrando(true);
  };

  const handleDragLeave = (evento) => {
    evento.preventDefault();
    evento.stopPropagation();
    setArrastrando(false);
  };

  const handleDrop = (evento) => {
    evento.preventDefault();
    evento.stopPropagation();
    setArrastrando(false);
    seleccionarArchivo(evento.dataTransfer.files?.[0]);
  };

  const quitarArchivo = () => {
    setArchivo(null);
    if (inputArchivoRef.current) inputArchivoRef.current.value = '';
    setError('');
  };

  const enviarEntrega = async (evento) => {
    evento.preventDefault();
    if (!contenido.trim() && !archivo) {
      setError('Adjunta un archivo o redacta el pergamino de tu entrega.');
      return;
    }

    setEnviando(true);
    setError('');
    try {
      const datos = new FormData();
      datos.append('tarea_id', tarea.id);
      datos.append('estudiante_id', estudianteId);
      datos.append('contenido', contenido.trim());
      if (archivo) datos.append('archivo', archivo);

      const res = await fetch(`${API_URL}/api/entregas`, {
        method: 'POST',
        body: datos
      });
      const respuesta = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(respuesta.error || 'No se pudo enviar la misión.');
      }

      onEnviada?.(respuesta.mensaje || '¡Misión entregada con éxito!');
    } catch (err) {
      setError(err.message || 'Error al enviar la misión.');
    } finally {
      setEnviando(false);
    }
  };

  return createPortal(
    <div
      className="entrega-overlay"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) cerrar();
      }}
    >
      <div
        ref={modalRef}
        className="rpg-modal entrega-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entrega-modal-titulo"
        aria-describedby="entrega-modal-descripcion"
        tabIndex={-1}
      >
        <div className="rpg-modal__head">
          <div>
            <span className="hud-eyebrow hud-eyebrow--xp">MISIÓN DE LABORATORIO</span>
            <h3 className="rpg-modal__title" id="entrega-modal-titulo">{tarea.titulo}</h3>
            <span className="entrega-modal__meta">
              📚 Vale {tarea.puntos_max ?? 10} de 100 pts
              {tarea.fecha_limite ? ` · 📅 ${tarea.fecha_limite}` : ''}
            </span>
          </div>
          <button type="button" onClick={cerrar} className="btn-danger btn-sm" aria-label="Cerrar" disabled={enviando}>
            <X size={16} /> Cerrar
          </button>
        </div>

        <form className="entrega-modal__form" onSubmit={enviarEntrega}>
          <div className="rpg-modal__body rpg-modal__body--column">
            <p className="section-sub" id="entrega-modal-descripcion">{tarea.descripcion}</p>

            {entrega?.calificacion != null && (
              <div className="entrega-modal__estado">
                <span className="badge badge-success">Calificada: {entrega.calificacion}%</span>
                {entrega.puntos_ganados != null && (
                  <span className="badge badge--gold">{entrega.puntos_ganados} pts</span>
                )}
              </div>
            )}

            {archivoActual && (
              <div className="entrega-modal__archivo">
                <FileText size={16} />
                <div className="entrega-modal__archivo-texto">
                  <span>Archivo actual</span>
                  <a
                    href={archivoActual.url}
                    download={archivoActual.nombre}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {archivoActual.nombre}
                  </a>
                </div>
              </div>
            )}

            {entrega?.retroalimentacion && (
              <div className="entrega-modal__feedback">
                <strong>Retroalimentación del Game Master</strong>
                <p>{entrega.retroalimentacion}</p>
              </div>
            )}

            <label className="entrega-modal__label" htmlFor="entrega-contenido">
              Pergamino de respuesta
              <span>Opcional si adjuntas un archivo</span>
            </label>
            <textarea
              id="entrega-contenido"
              className="input-pro"
              rows="5"
              placeholder="Escribe aquí tu código, comentario o respuesta de la misión..."
              value={contenido}
              onChange={(evento) => setContenido(evento.target.value)}
              disabled={enviando}
            />

            <div
              className={`entrega-drop ${arrastrando ? 'is-dragging' : ''} ${archivo ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={inputArchivoRef}
                id="archivo-entrega"
                type="file"
                className="entrega-drop__input"
                accept=".pdf,.doc,.docx"
                onChange={handleArchivo}
                disabled={enviando}
              />
              <label htmlFor="archivo-entrega" className="entrega-drop__label">
                <UploadCloud size={24} className="entrega-drop__icon" />
                <span className="entrega-drop__texto">
                  <strong>{archivo ? 'Cambiar archivo' : 'Arrastra tu PDF, DOC o DOCX aquí'}</strong>
                  <span>o haz clic para seleccionar · máximo 10 MB</span>
                </span>
              </label>

              {archivo && (
                <div className="entrega-drop__file">
                  <FileText size={16} />
                  <span>{archivo.name} · {formatearTamano(archivo.size)}</span>
                  <button
                    type="button"
                    className="entrega-drop__quitar"
                    onClick={quitarArchivo}
                    aria-label="Quitar archivo seleccionado"
                    disabled={enviando}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <p className="entrega-modal__nota">
              Solo hay una entrega por misión. Si subes un archivo nuevo, reemplazará al anterior.
            </p>

            {error && <p className="perfil-mensaje is-error" role="alert">{error}</p>}
          </div>

          <div className="entrega-modal__acciones">
            <button type="button" className="btn-pro" onClick={cerrar} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="btn-pro btn-pro-primary" disabled={enviando}>
              <Send size={15} /> {enviando ? 'Enviando...' : entrega ? 'Actualizar entrega' : 'Enviar misión'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
