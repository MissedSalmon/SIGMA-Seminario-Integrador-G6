'use client';

import { useEffect, useState } from 'react';
import { CButton, CButtonGroup, CCard, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarEspecialidades, eliminarEspecialidad } from '@/servicios/especialidades.js';

export default function PantallaEspecialidades() {
  const { mostrarToast } = useToast();

  const [especialidades, setEspecialidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let vigente = true;
    async function pedir() {
      try {
        const filas = await listarEspecialidades();
        if (!vigente) return;
        setEspecialidades(filas);
        setError('');
      } catch (fallo) {
        if (vigente) setError(fallo.message);
      } finally {
        if (vigente) setCargando(false);
      }
    }
    pedir();
    return () => (vigente = false);
  }, [recarga]);

  async function confirmarBaja() {
    setEliminando(true);
    setError('');

    try {
      await eliminarEspecialidad(aEliminar.idEspecialidad);
      mostrarToast({ tipo: 'exito', mensaje: `Se elimino la especialidad "${aEliminar.nombre}".` });
      setAEliminar(null);
      setRecarga((n) => n + 1);
    } catch (fallo) {
      setError(fallo.message);
      setAEliminar(null);
    } finally {
      setEliminando(false);
    }
  }

  const columnas = [
    { clave: 'nombre', encabezado: 'Nombre', render: (e) => <span className="fw-semibold">{e.nombre}</span> },
    { clave: 'cantidad', encabezado: 'Técnicos', render: (e) => <span>{e.cantidadTecnicos}</span> },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (e) => (
        <CButtonGroup size="sm">
          <BotonEnlace href={`/especialidades/${e.idEspecialidad}/editar`} variante="ghost" className="btn-icono" title="Editar">
            <CIcon icon={cilPencil} />
          </BotonEnlace>
          <CButton variant="ghost" color="danger" className="btn-icono" onClick={() => setAEliminar(e)} title="Eliminar">
            <CIcon icon={cilTrash} />
          </CButton>
        </CButtonGroup>
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina titulo="Especialidades" accion={{ texto: 'Agregar especialidad', direccion: '/especialidades/agregar' }} />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={especialidades}
            claveFila={(e) => e.idEspecialidad}
            columnas={columnas}
            buscarPor={[ 'nombre' ]}
            placeholderBusqueda="Buscar por nombre..."
            cargando={cargando}
            textoVacio="Todavia no hay especialidades cargadas."
            accionVacio={{ texto: 'Agregar especialidad', direccion: '/especialidades/agregar' }}
          />
        </CCardBody>
      </CCard>

      <DialogoEliminar visible={Boolean(aEliminar)} eliminando={eliminando} onConfirmar={confirmarBaja} onCancelar={() => setAEliminar(null)}>
        <p className="mb-0">Se va a eliminar la especialidad <strong>{aEliminar?.nombre}</strong>.</p>
        <p className="text-body-secondary mt-2 mb-0">No se puede eliminar si tiene técnicos asignados.</p>
      </DialogoEliminar>
    </>
  );
}
