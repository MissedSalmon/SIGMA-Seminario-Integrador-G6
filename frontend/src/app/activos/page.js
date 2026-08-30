'use client';

/**
 * /activos - inventario de activos (HU-7).
 *
 * Se puede filtrar por espacio, por tipo y por estado, y los tres se combinan.
 * El buscador de arriba busca por codigo, descripcion y tipo.
 *
 * Dar de baja no borra: pasa el activo a Retirado y lo deja en la lista, para
 * conservar su historial de intervenciones.
 */
import { useEffect, useState } from 'react';
import { CButton, CButtonGroup, CCard, CCardBody, CFormSelect } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarEspacios } from '@/servicios/espacios.js';
import { listarTiposActivos } from '@/servicios/tiposActivos.js';
import { listarActivos, darDeBajaActivo } from '@/servicios/activos.js';

const ESTADOS = ['Operativo', 'En mantenimiento', 'Fuera de servicio', 'Retirado'];

export default function PantallaActivos() {
  const { mostrarToast } = useToast();

  const [activos, setActivos] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [tipos, setTipos] = useState([]);

  // El espacio se guarda como "edificio|numero" porque su clave son dos datos.
  const [filtroEspacio, setFiltroEspacio] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [aDarDeBaja, setADarDeBaja] = useState(null);
  const [dandoDeBaja, setDandoDeBaja] = useState(false);

  // Los espacios y los tipos se cargan una sola vez: son los desplegables.
  useEffect(() => {
    Promise.all([listarEspacios(), listarTiposActivos()])
      .then(([listaEspacios, listaTipos]) => {
        setEspacios(listaEspacios);
        setTipos(listaTipos);
      })
      .catch((fallo) => setError(fallo.message));
  }, []);

  // Se suma 1 para volver a pedir la lista (por ejemplo, despues de una baja).
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let vigente = true;

    async function pedir() {
      const [idEdificio, espacioNum] = filtroEspacio ? filtroEspacio.split('|') : [];

      try {
        const filas = await listarActivos({
          idEdificio: idEdificio || null,
          espacioNum: espacioNum || null,
          idTipoActivo: filtroTipo || null,
          estado: filtroEstado || null,
        });
        if (!vigente) return;
        setActivos(filas);
        setError('');
      } catch (fallo) {
        if (vigente) setError(fallo.message);
      } finally {
        if (vigente) setCargando(false);
      }
    }

    pedir();

    return () => {
      vigente = false;
    };
  }, [filtroEspacio, filtroTipo, filtroEstado, recarga]);

  async function confirmarBaja() {
    setDandoDeBaja(true);
    setError('');

    try {
      await darDeBajaActivo(aDarDeBaja.codigo);
      mostrarToast({
        tipo: 'exito',
        mensaje: `Se dio de baja el activo "${aDarDeBaja.codigo}". Queda como Retirado.`,
      });
      setADarDeBaja(null);
      setRecarga((numero) => numero + 1);
    } catch (fallo) {
      setError(fallo.message);
      setADarDeBaja(null);
    } finally {
      setDandoDeBaja(false);
    }
  }

  const hayFiltros = Boolean(filtroEspacio || filtroTipo || filtroEstado);

  const columnas = [
    {
      clave: 'codigo',
      encabezado: 'Codigo',
      render: (activo) => <span className="fw-semibold">{activo.codigo}</span>,
    },
    {
      clave: 'descripcion',
      encabezado: 'Descripcion',
      render: (activo) => (
        <span className="text-body-secondary">{activo.descripcion || '-'}</span>
      ),
    },
    {
      clave: 'tipo',
      encabezado: 'Tipo',
      render: (activo) => <span className="text-body-secondary">{activo.nombreTipo}</span>,
    },
    {
      clave: 'ubicacion',
      encabezado: 'Ubicacion',
      render: (activo) => (
        <span className="text-body-secondary">
          {activo.nombreEdificio} — {activo.nombreEspacio}
        </span>
      ),
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      render: (activo) => <span className="text-body-secondary">{activo.estado}</span>,
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (activo) => (
        <CButtonGroup size="sm">
          {/* Un activo retirado se conserva como historial: ya no se toca. */}
          {activo.estado !== 'Retirado' && (
            <>
              <BotonEnlace
                href={`/activos/${encodeURIComponent(activo.codigo)}/editar`}
                variante="ghost"
                className="btn-icono"
                title="Editar"
              >
                <CIcon icon={cilPencil} />
              </BotonEnlace>
              <CButton
                variant="ghost"
                color="danger"
                className="btn-icono"
                onClick={() => setADarDeBaja(activo)}
                title="Dar de baja"
              >
                <CIcon icon={cilTrash} />
              </CButton>
            </>
          )}
        </CButtonGroup>
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina
        titulo="Activos"
        descripcion="El inventario de la facultad: que hay, donde esta y en que estado."
        accion={{ texto: 'Agregar activo', direccion: '/activos/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={activos}
            claveFila={(activo) => activo.codigo}
            columnas={columnas}
            buscarPor={['codigo', 'descripcion', 'nombreTipo']}
            placeholderBusqueda="Buscar por codigo, descripcion o tipo..."
            filtros={
              <>
                <CFormSelect
                  value={filtroEspacio}
                  onChange={(evento) => setFiltroEspacio(evento.target.value)}
                  aria-label="Filtrar por espacio"
                  style={{ maxWidth: '16rem' }}
                >
                  <option value="">Todos los espacios</option>
                  {espacios.map((espacio) => (
                    <option
                      key={`${espacio.idEdificio}|${espacio.espacioNum}`}
                      value={`${espacio.idEdificio}|${espacio.espacioNum}`}
                    >
                      {espacio.nombreEdificio} — {espacio.nombre || espacio.espacioNum}
                    </option>
                  ))}
                </CFormSelect>

                <CFormSelect
                  value={filtroTipo}
                  onChange={(evento) => setFiltroTipo(evento.target.value)}
                  aria-label="Filtrar por tipo de activo"
                  style={{ maxWidth: '14rem' }}
                >
                  <option value="">Todos los tipos</option>
                  {tipos.map((tipo) => (
                    <option key={tipo.idTipoActivo} value={tipo.idTipoActivo}>
                      {tipo.nombre}
                    </option>
                  ))}
                </CFormSelect>

                <CFormSelect
                  value={filtroEstado}
                  onChange={(evento) => setFiltroEstado(evento.target.value)}
                  aria-label="Filtrar por estado"
                  style={{ maxWidth: '13rem' }}
                >
                  <option value="">Todos los estados</option>
                  {ESTADOS.map((unEstado) => (
                    <option key={unEstado} value={unEstado}>
                      {unEstado}
                    </option>
                  ))}
                </CFormSelect>
              </>
            }
            cargando={cargando}
            textoVacio={
              hayFiltros
                ? 'No hay activos que cumplan con esos filtros.'
                : 'Todavia no hay activos cargados.'
            }
            accionVacio={
              hayFiltros ? undefined : { texto: 'Agregar activo', direccion: '/activos/agregar' }
            }
          />
        </CCardBody>
      </CCard>

      <DialogoEliminar
        visible={Boolean(aDarDeBaja)}
        titulo="Confirmar la baja"
        eliminando={dandoDeBaja}
        onConfirmar={confirmarBaja}
        onCancelar={() => setADarDeBaja(null)}
      >
        <p className="mb-0">
          Se va a dar de baja el activo <strong>{aDarDeBaja?.codigo}</strong>
          {aDarDeBaja?.descripcion ? ` (${aDarDeBaja.descripcion})` : ''}.
        </p>
        <p className="text-body-secondary mt-2 mb-0">
          Pasa a estado <strong>Retirado</strong> y deja de estar disponible, pero no se elimina:
          se conserva su historial de intervenciones.
        </p>
      </DialogoEliminar>
    </>
  );
}
