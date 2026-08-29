'use client';

/**
 * /areas - listado de areas funcionales (HU-3).
 */
import { useEffect, useState } from 'react';
import {
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import { Cargando, SinDatos } from '@/componentes/EstadoTabla.js';
import { listarAreas, eliminarArea } from '@/servicios/areas.js';

export default function PantallaAreas() {
  const [areas, setAreas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Se suma 1 para volver a pedir la lista (por ejemplo, despues de una baja).
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    // Si la pantalla se cierra mientras la API responde, no se toca el estado.
    let vigente = true;

    async function pedir() {
      try {
        const filas = await listarAreas();
        if (!vigente) return;
        setAreas(filas);
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
  }, [recarga]);

  async function confirmarBaja() {
    setEliminando(true);
    setError('');

    try {
      await eliminarArea(aEliminar.idArea);
      setExito(`Se elimino el area "${aEliminar.nombre}".`);
      setAEliminar(null);
      setRecarga((numero) => numero + 1);
    } catch (fallo) {
      setError(fallo.message);
      setAEliminar(null);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Areas"
        descripcion="Las unidades organizacionales de la facultad. Cada ticket se carga desde un area."
        accion={{ texto: 'Agregar area', direccion: '/areas/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />
      <Aviso mensaje={exito} color="success" onCerrar={() => setExito('')} />

      <CCard>
        <CCardBody>
          {cargando ? (
            <Cargando texto="Cargando areas..." />
          ) : areas.length === 0 ? (
            <SinDatos texto="Todavia no hay areas cargadas." />
          ) : (
            <CTable hover responsive align="middle" className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Nombre</CTableHeaderCell>
                  <CTableHeaderCell>Espacio</CTableHeaderCell>
                  <CTableHeaderCell>Edificio</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {areas.map((area) => (
                  <CTableRow key={area.idArea}>
                    <CTableDataCell className="fw-semibold">{area.nombre}</CTableDataCell>
                    <CTableDataCell className="text-body-secondary">
                      {area.nombreEspacio}
                    </CTableDataCell>
                    <CTableDataCell className="text-body-secondary">
                      {area.nombreEdificio}
                    </CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CButtonGroup size="sm">
                        <BotonEnlace
                          href={`/areas/${area.idArea}/editar`}
                          color="primary"
                          variante="outline"
                          title="Editar"
                          >
                          <CIcon icon={cilPencil} />
                          </BotonEnlace>
                        <CButton
                          color="danger"
                          variant="outline"
                          onClick={() => setAEliminar(area)}
                          title="Eliminar"
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CButtonGroup>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      <DialogoEliminar
        visible={Boolean(aEliminar)}
        eliminando={eliminando}
        onConfirmar={confirmarBaja}
        onCancelar={() => setAEliminar(null)}
      >
        <p className="mb-0">
          Se va a eliminar el area <strong>{aEliminar?.nombre}</strong>.
        </p>
      </DialogoEliminar>
    </>
  );
}
