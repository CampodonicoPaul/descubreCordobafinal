// HACKATHON GRUPO 9 - COMPONENTE DE CHAT REUTILIZABLE
// Se utiliza en el panel del cliente y del administrador.
// El chat se actualiza manualmente, sin WebSockets.

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import api from '../services/api.js';
import { adminApi } from '../services/adminApi.js';

export default function ReservaChat({ idDetalle, esAdmin = false }) {
  // Guardamos los mensajes, el texto y el estado del envío.
  const [mensajes, setMensajes] = useState([]);
  const [contenido, setContenido] = useState('');
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState(null);

  // Elegimos la API según el usuario que usa el chat.
  const cliente = esAdmin ? adminApi : api;
  const url = `/api/mensajes/${esAdmin ? 'admin' : 'cliente'}/${idDetalle}`;

  const mostrarAviso = (texto, tipo = 'exito') => {
    setAviso({ texto, tipo });
  };

  // Ocultamos las notificaciones después de cinco segundos.
  useEffect(() => {
    if (!aviso) return;
    const tiempo = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(tiempo);
  }, [aviso]);

  // Consultamos la conversación al backend.
  async function actualizar() {
    try {
      const r = await cliente.get(url);
      // adminApi devuelve los datos; api devuelve una respuesta con .data.
      const datos = esAdmin ? r : r.data;
      setMensajes(datos.mensajes || []);
      return true;
    } catch (e) {
      mostrarAviso(
        e.response?.data?.mensaje || e.message || 'Error al cargar los mensajes',
        'error'
      );
      return false;
    }
  }

  // Cargamos la conversación cuando cambiamos de reserva.
  useEffect(() => {
    if (idDetalle) actualizar();
  }, [idDetalle, esAdmin]);

  // Enviamos el mensaje y volvemos a consultar la conversación.
  async function enviar(e) {
    e.preventDefault();
    if (!contenido.trim() || cargando) return;

    setCargando(true);
    try {
      await cliente.post(url, { contenido: contenido.trim() });
      setContenido('');
      const actualizado = await actualizar();

      // El envío se completó, aunque el correo se verifica por separado.
      if (actualizado) {
        mostrarAviso(
          esAdmin
            ? 'Mensaje enviado correctamente al cliente.'
            : 'Mensaje enviado correctamente a la agencia.',
          'exito'
        );
      }
    } catch (e) {
      mostrarAviso(
        e.response?.data?.mensaje || e.message || 'No se pudo enviar el mensaje.',
        'error'
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className={`rounded-xl border p-3 ${
      esAdmin
        ? 'border-slate-600 bg-slate-800 text-white'
        : 'border-slate-200 bg-white text-slate-900'
    }`}>
      {/* Encabezado y actualización manual */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="font-bold">Conversación privada</h4>
        <button
          type="button"
          onClick={actualizar}
          className="rounded bg-orange-600 px-3 py-1 text-sm text-white hover:bg-orange-700"
        >
          Actualizar
        </button>
      </div>

      {/* Mensajes de la conversación */}
      <div className="mb-3 max-h-64 space-y-2 overflow-y-auto" aria-live="polite">
        {!mensajes.length && (
          <p className="text-sm opacity-70">
            Todavía no hay mensajes. Podés escribir el primero.
          </p>
        )}
        {mensajes.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg p-3 text-sm ${
              m.emisorTipo === 'ADMIN'
                ? 'bg-orange-100 text-slate-900'
                : 'bg-sky-100 text-slate-900'
            }`}
          >
            <div className="mb-1 text-xs font-bold">
              {m.emisorTipo === 'ADMIN' ? 'Agencia' : 'Cliente'}
              {' · '}
              {new Date(m.fechaEnvio).toLocaleString('es-AR')}
            </div>
            <p className="whitespace-pre-wrap break-words">{m.contenido}</p>
          </div>
        ))}
      </div>
 
      {/* Formulario de envío */}
      <form onSubmit={enviar} className="flex gap-2">
        <input
          aria-label="Escribir mensaje"
          maxLength={2000}
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          placeholder="Escribir mensaje..."
          className="min-w-0 flex-1 rounded border p-2 text-white"
        />
        <button
          type="submit"
          disabled={cargando || !contenido.trim()}
          className="rounded bg-orange-600 px-3 py-2 text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {cargando ? 'Enviando...' : 'Enviar'}
        </button>
      </form>

      {/* Aviso flotante negro y naranja */}
      {aviso && (
        <div
          role={aviso.tipo === 'error' ? 'alert' : 'status'}
          className="fixed left-1/2 top-24 z-[9999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-orange-500 bg-neutral-950 p-5 text-white shadow-2xl"
        >
          <div className="flex items-start gap-3">
            {aviso.tipo === 'error' ? (
              <AlertCircle size={24} className="shrink-0 text-orange-400" />
            ) : (
              <CheckCircle2 size={24} className="shrink-0 text-orange-400" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-orange-400">
                {aviso.tipo === 'error' ? 'Atención' : '¡Listo!'}
              </p>
              <p className="mt-1 break-words text-sm leading-6 text-white">
                {aviso.texto}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAviso(null)}
              aria-label="Cerrar aviso"
              className="shrink-0 rounded-lg bg-orange-500 p-2 text-white transition hover:bg-orange-600"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
