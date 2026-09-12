'use client';

/**
 * /plantillas-tareas - listado de las plantillas de tareas (HU-12).
 */
import { useEffect, useState } from 'react';
import { CButton, CButtonGroup, CCard, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import EtiquetaTipo from '@/componentes/EtiquetaTipo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { eliminarPlantilla, listarPlantillas } from '@/servicios/plantillasTareas.js';
import { listarTiposActivos } from '@/servicios/tiposActivos.js';

export default function PantallaPlantillas() {
  const { mostrarToast } = useToast();

  const [plantillas, setPlantillas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    listarTiposActivos()
      .then(setTipos)
      .catch((fallo) => setError(fallo.message));
  }, []);

  useEffect(() => {
    let vigente = true;

    listarPlantillas(filtroTipo || null)
      .then((filas) => {
        if (vigente) setPlantillas(filas);
      })
      .catch((fallo) => {
        if (vigente) setError(fallo.message);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [filtroTipo, recarga]);

  async function confirmarBaja() {
    setEliminando(true);
    setError('');

    try {
      await eliminarPlantilla(aEliminar.idPlantilla);
      mostrarToast({ tipo: 'exito', mensaje: 'Se eliminó la plantilla.' });
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
      clave: 'descripcion',
      encabezado: 'Tarea',
      render: (plantilla) => <span className="fw-semibold">{plantilla.descripcion}</span>,
    },
    {
      clave: 'nombreTipo',
      encabezado: 'Tipo de activo',
      render: (plantilla) => <EtiquetaTipo texto={plantilla.nombreTipo} />,
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (plantilla) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/plantillas-tareas/${plantilla.idPlantilla}/editar`}
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
            onClick={() => setAEliminar(plantilla)}
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
        titulo="Plantillas de tareas"
        accion={{ direccion: '/plantillas-tareas/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={plantillas}
            claveFila={(plantilla) => plantilla.idPlantilla}
            columnas={columnas}
            buscarPor={['descripcion', 'nombreTipo']}
            placeholderBusqueda="Buscar por tarea o tipo de activo..."
            filtros={[
              {
                etiqueta: 'Tipo de activo',
                valor: filtroTipo,
                alCambiar: setFiltroTipo,
                opciones: tipos.map((tipo) => ({ valor: tipo.idTipoActivo, texto: tipo.nombre })),
              },
            ]}
            cargando={cargando}
            textoVacio="Todavia no hay plantillas de tareas cargadas."
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
          Se va a eliminar la plantilla <strong>{aEliminar?.descripcion}</strong>.
        </p>
        <p className="text-body-secondary mt-2 mb-0">
          Las tareas que ya se crearon a partir de ella no se tocan.
        </p>
      </DialogoEliminar>
    </>
  );
}
