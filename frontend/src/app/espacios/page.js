'use client';

/**
 * /espacios - listado de espacios (HU-2).
 *
 * Tiene un filtro por edificio, porque la facultad tiene muchos espacios y en
 * la practica siempre se busca dentro de un edificio.
 */
import { useEffect, useState } from 'react';
import { CButton, CButtonGroup, CCard, CCardBody, CFormSelect } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import EtiquetaTipo from '@/componentes/EtiquetaTipo.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarEdificios } from '@/servicios/edificios.js';
import { listarEspacios, eliminarEspacio } from '@/servicios/espacios.js';

export default function PantallaEspacios() {
  const { mostrarToast } = useToast();

  const [espacios, setEspacios] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [filtroEdificio, setFiltroEdificio] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Los edificios se cargan una sola vez: son los del desplegable del filtro.
  useEffect(() => {
    listarEdificios()
      .then(setEdificios)
      .catch((fallo) => setError(fallo.message));
  }, []);

  // Se suma 1 para volver a pedir la lista (por ejemplo, despues de una baja).
  const [recarga, setRecarga] = useState(0);

  // Se vuelve a pedir la lista cada vez que cambia el filtro.
  useEffect(() => {
    // Si el filtro cambia de nuevo antes de que llegue la respuesta anterior,
    // esa respuesta vieja se descarta y no pisa a la nueva.
    let vigente = true;

    async function pedir() {
      try {
        const filas = await listarEspacios(filtroEdificio ? Number(filtroEdificio) : null);
        if (!vigente) return;
        setEspacios(filas);
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
  }, [filtroEdificio, recarga]);

  async function confirmarBaja() {
    setEliminando(true);
    setError('');

    try {
      await eliminarEspacio(aEliminar.idEspacio);
      mostrarToast({ tipo: 'exito', mensaje: `Se elimino el espacio "${aEliminar.nombre}".` });
      setAEliminar(null);
      setRecarga((numero) => numero + 1);
    } catch (fallo) {
      setError(fallo.message);
      setAEliminar(null);
    } finally {
      setEliminando(false);
    }
  }

  const columnas = [
    {
      clave: 'nombre',
      encabezado: 'Nombre',
      render: (espacio) => <span className="fw-semibold">{espacio.nombre}</span>,
    },
    {
      clave: 'edificio',
      encabezado: 'Edificio',
      render: (espacio) => <span className="text-body-secondary">{espacio.nombreEdificio}</span>,
    },
    {
      clave: 'tipo',
      encabezado: 'Tipo',
      render: (espacio) => <EtiquetaTipo texto={espacio.tipo} />,
    },
    {
      clave: 'piso',
      encabezado: 'Piso',
      render: (espacio) => <span className="text-body-secondary">{espacio.piso ?? '-'}</span>,
    },
    {
      clave: 'numero',
      encabezado: 'Numero',
      render: (espacio) => <span className="text-body-secondary">{espacio.numero ?? '-'}</span>,
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (espacio) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/espacios/${espacio.idEspacio}/editar`}
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
            onClick={() => setAEliminar(espacio)}
            title="Eliminar"
          >
            <CIcon icon={cilTrash} />
          </CButton>
        </CButtonGroup>
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina
        titulo="Espacios"
        descripcion="Aulas, laboratorios, oficinas y pasillos de cada edificio."
        accion={{ texto: 'Agregar espacio', direccion: '/espacios/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={espacios}
            claveFila={(espacio) => espacio.idEspacio}
            columnas={columnas}
            buscarPor={['nombre', 'nombreEdificio', 'tipo', 'piso', 'numero']}
            placeholderBusqueda="Buscar por nombre, tipo, piso..."
            filtros={
              <CFormSelect
                value={filtroEdificio}
                onChange={(evento) => setFiltroEdificio(evento.target.value)}
                aria-label="Filtrar por edificio"
                style={{ maxWidth: '14rem' }}
              >
                <option value="">Todos los edificios</option>
                {edificios.map((edificio) => (
                  <option key={edificio.idEdificio} value={edificio.idEdificio}>
                    {edificio.nombre}
                  </option>
                ))}
              </CFormSelect>
            }
            cargando={cargando}
            textoVacio={
              filtroEdificio
                ? 'Ese edificio todavia no tiene espacios cargados.'
                : 'Todavia no hay espacios cargados.'
            }
            accionVacio={filtroEdificio ? undefined : { texto: 'Agregar espacio', direccion: '/espacios/agregar' }}
          />
        </CCardBody>
      </CCard>

      <DialogoEliminar
        visible={Boolean(aEliminar)}
        eliminando={eliminando}
        onConfirmar={confirmarBaja}
        onCancelar={() => setAEliminar(null)}
      >
        <p className="mb-0">
          Se va a eliminar el espacio <strong>{aEliminar?.nombre}</strong> del edificio{' '}
          <strong>{aEliminar?.nombreEdificio}</strong>.
        </p>
        <p className="text-body-secondary mt-2 mb-0">
          Solo se puede eliminar si no tiene areas asociadas.
        </p>
      </DialogoEliminar>
    </>
  );
}
