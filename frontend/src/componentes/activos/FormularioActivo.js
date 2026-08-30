'use client';

/**
 * Formulario de alta y de edicion de un activo (HU-7).
 *
 * Tres cosas que conviene saber antes de tocarlo:
 *
 * 1. El codigo de inventario identifica fisicamente al activo, asi que en la
 *    edicion se muestra pero no se puede cambiar.
 * 2. Cambiar el espacio ES reubicar el activo. No hay un boton aparte: se elige
 *    otro espacio y se guarda, y el backend anota la fecha del movimiento.
 * 3. El estado solo aparece en la edicion, porque un activo nuevo siempre nace
 *    Operativo. Y solo se puede elegir entre Operativo y Fuera de servicio:
 *    "En mantenimiento" lo pone la orden de trabajo y "Retirado" se pone dando
 *    de baja desde el listado.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CForm,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormText,
  CFormTextarea,
  CRow,
} from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarEspacios } from '@/servicios/espacios.js';
import { listarTiposActivos } from '@/servicios/tiposActivos.js';

/*
 * Un espacio se identifica con dos datos (el edificio y el numero), pero un
 * <select> maneja un solo valor. Se unen con una barra para el desplegable y se
 * vuelven a separar al guardar.
 */

/** De { idEdificio: 1, espacioNum: '12' } arma "1|12". */
function unirEspacio(idEdificio, espacioNum) {
  if (!idEdificio || !espacioNum) return '';
  return `${idEdificio}|${espacioNum}`;
}

/** De "1|12" saca { idEdificio: 1, espacioNum: '12' }. */
function separarEspacio(valor) {
  const [edificio, numero] = String(valor).split('|');
  return { idEdificio: Number(edificio), espacioNum: numero };
}

/** De "2026-08-30" arma "30/08/2026", que es como se lee una fecha aca. */
function comoFecha(texto) {
  if (!texto) return '';
  const [anio, mes, dia] = String(texto).slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

export default function FormularioActivo({ activo = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(activo);

  const [codigo, setCodigo] = useState(activo?.codigo ?? '');
  const [descripcion, setDescripcion] = useState(activo?.descripcion ?? '');
  const [idTipoActivo, setIdTipoActivo] = useState(activo?.idTipoActivo ?? '');
  const [espacio, setEspacio] = useState(unirEspacio(activo?.idEdificio, activo?.espacioNum));
  const [fechaInstalacion, setFechaInstalacion] = useState(
    activo?.fechaInstalacion ? String(activo.fechaInstalacion).slice(0, 10) : ''
  );
  const [estado, setEstado] = useState(activo?.estado ?? 'Operativo');

  const [tipos, setTipos] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [validado, setValidado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listarTiposActivos(), listarEspacios()])
      .then(([listaTipos, listaEspacios]) => {
        setTipos(listaTipos);
        setEspacios(listaEspacios);
      })
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setValidado(true);
    setError('');

    if (!codigo.trim() || !idTipoActivo || !espacio) return;

    setGuardando(true);

    const { idEdificio, espacioNum } = separarEspacio(espacio);

    try {
      await onGuardar({
        codigo: codigo.trim(),
        descripcion,
        idTipoActivo: Number(idTipoActivo),
        idEdificio,
        espacioNum,
        fechaInstalacion: fechaInstalacion || null,
        ...(editando ? { estado } : {}),
      });

      mostrarToast({
        tipo: 'exito',
        mensaje: editando
          ? `Se guardaron los cambios del activo "${codigo}".`
          : `Se agrego el activo "${codigo}".`,
      });

      router.push('/activos');
      router.refresh();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <CCard>
        <CCardBody>
          <Cargando texto="Cargando el formulario..." />
        </CCardBody>
      </CCard>
    );
  }

  // Sin tipo y sin espacio no se puede cargar un activo: los dos son obligatorios.
  if (tipos.length === 0) {
    return (
      <Aviso
        color="warning"
        mensaje="Primero hay que cargar por lo menos un tipo de activo: todo activo pertenece a uno."
      />
    );
  }

  if (espacios.length === 0) {
    return (
      <Aviso
        color="warning"
        mensaje="Primero hay que cargar por lo menos un espacio: todo activo esta ubicado en uno."
      />
    );
  }

  // Un activo retirado se conserva como historial y no se toca mas.
  if (activo?.estado === 'Retirado') {
    return (
      <>
        <Aviso
          color="warning"
          mensaje={`El activo "${activo.codigo}" esta retirado, asi que no se puede modificar. Se conserva para no perder su historial de intervenciones.`}
        />
        <BotonEnlace href="/activos" color="secondary" variante="outline">
          Volver al listado
        </BotonEnlace>
      </>
    );
  }

  /*
   * El desplegable de estado ofrece los dos que el administrador puede elegir.
   * Si el activo esta En mantenimiento (lo puso una OT), se agrega esa opcion
   * deshabilitada: asi se ve el estado real y no se pisa sin querer al guardar.
   */
  const estadoAutomatico = !['Operativo', 'Fuera de servicio'].includes(estado);

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <h2 className="sigma-seccion-titulo">Datos del activo</h2>

        <CForm noValidate validated={validado} onSubmit={manejarEnvio}>
          <CRow className="g-3">
            <CCol xs={12} md={4}>
              <CFormLabel htmlFor="codigo" className="sigma-obligatorio">
                Codigo de inventario
              </CFormLabel>
              <CFormInput
                id="codigo"
                value={codigo}
                onChange={(evento) => setCodigo(evento.target.value)}
                placeholder="AC-014"
                required
                maxLength={50}
                disabled={editando}
              />
              <CFormFeedback invalid>El codigo de inventario es obligatorio.</CFormFeedback>
              {editando ? (
                <CFormText>El codigo identifica al activo y no se puede cambiar.</CFormText>
              ) : (
                <CFormText>No se puede repetir: identifica al activo.</CFormText>
              )}
            </CCol>

            <CCol xs={12} md={8}>
              <CFormLabel htmlFor="descripcion">Descripcion</CFormLabel>
              <CFormTextarea
                id="descripcion"
                rows={2}
                value={descripcion}
                onChange={(evento) => setDescripcion(evento.target.value)}
                placeholder="Aire acondicionado split 3000 frigorias"
              />
            </CCol>

            <CCol xs={12} md={4}>
              <CFormLabel htmlFor="idTipoActivo" className="sigma-obligatorio">
                Tipo de activo
              </CFormLabel>
              <CFormSelect
                id="idTipoActivo"
                value={idTipoActivo}
                onChange={(evento) => setIdTipoActivo(evento.target.value)}
                required
              >
                <option value="">Elegi el tipo...</option>
                {tipos.map((tipo) => (
                  <option key={tipo.idTipoActivo} value={tipo.idTipoActivo}>
                    {tipo.nombre}
                  </option>
                ))}
              </CFormSelect>
              <CFormFeedback invalid>Hay que elegir el tipo de activo.</CFormFeedback>
            </CCol>

            <CCol xs={12} md={5}>
              <CFormLabel htmlFor="espacio" className="sigma-obligatorio">
                Espacio
              </CFormLabel>
              <CFormSelect
                id="espacio"
                value={espacio}
                onChange={(evento) => setEspacio(evento.target.value)}
                required
              >
                <option value="">Elegi el espacio...</option>
                {espacios.map((unEspacio) => (
                  <option
                    key={unirEspacio(unEspacio.idEdificio, unEspacio.espacioNum)}
                    value={unirEspacio(unEspacio.idEdificio, unEspacio.espacioNum)}
                  >
                    {unEspacio.nombreEdificio} — {unEspacio.nombre || unEspacio.espacioNum}
                  </option>
                ))}
              </CFormSelect>
              <CFormFeedback invalid>Hay que elegir donde esta el activo.</CFormFeedback>
              {editando && (
                <CFormText>
                  {activo.fechaUltimaReubicacion
                    ? `Elegir otro espacio reubica el activo. Ultima reubicacion: ${comoFecha(activo.fechaUltimaReubicacion)}.`
                    : 'Elegir otro espacio reubica el activo y queda registrada la fecha.'}
                </CFormText>
              )}
            </CCol>

            <CCol xs={12} md={3}>
              <CFormLabel htmlFor="fechaInstalacion">Fecha de instalacion</CFormLabel>
              <CFormInput
                id="fechaInstalacion"
                type="date"
                value={fechaInstalacion}
                onChange={(evento) => setFechaInstalacion(evento.target.value)}
              />
            </CCol>

            {editando && (
              <CCol xs={12} md={4}>
                <CFormLabel htmlFor="estado">Estado</CFormLabel>
                <CFormSelect
                  id="estado"
                  value={estado}
                  onChange={(evento) => setEstado(evento.target.value)}
                >
                  <option value="Operativo">Operativo</option>
                  <option value="Fuera de servicio">Fuera de servicio</option>
                  {estadoAutomatico && (
                    <option value={estado} disabled>
                      {estado}
                    </option>
                  )}
                </CFormSelect>
                <CFormText>
                  {estadoAutomatico
                    ? 'Este estado lo maneja la orden de trabajo, no se cambia desde aca.'
                    : 'Para retirar el activo, usa el boton de baja en el listado.'}
                </CFormText>
              </CCol>
            )}
          </CRow>

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar activo'}
            </CButton>
            <BotonEnlace href="/activos" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
}
