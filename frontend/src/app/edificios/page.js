'use client';

/**
 * /edificios - listado de edificios (HU-1).
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
import { listarEdificios, eliminarEdificio } from '@/servicios/edificios.js';

export default function PantallaEdificios() {
  const [edificios, setEdificios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // El edificio que se esta por eliminar. null = no hay dialogo abierto.
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Se suma 1 para volver a pedir la lista (por ejemplo, despues de una baja).
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    // Si la pantalla se cierra mientras la API responde, no se toca el estado.
    let vigente = true;

    async function pedir() {
      try {
        const filas = await listarEdificios();
        if (!vigente) return;
        setEdificios(filas);
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
      await eliminarEdificio(aEliminar.idEdificio);
      setExito(`Se elimino el edificio "${aEliminar.nombre}".`);
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
        titulo="Edificios"
        accion={{ texto: 'Agregar edificio', direccion: '/edificios/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />
      <Aviso mensaje={exito} color="success" onCerrar={() => setExito('')} />

      <CCard>
        <CCardBody>
          {cargando ? (
            <Cargando texto="Cargando edificios..." />
          ) : edificios.length === 0 ? (
            <SinDatos texto="Todavia no hay edificios cargados." />
          ) : (
            <CTable hover responsive align="middle" className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Nombre</CTableHeaderCell>
                  <CTableHeaderCell>Direccion</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {edificios.map((edificio) => (
                  <CTableRow key={edificio.idEdificio}>
                    <CTableDataCell className="fw-semibold">{edificio.nombre}</CTableDataCell>
                    <CTableDataCell className="text-body-secondary">
                      {edificio.direccion ?? '-'}
                    </CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CButtonGroup size="sm">
                        <BotonEnlace
                          href={`/edificios/${edificio.idEdificio}/editar`}
                          color="primary"
                          variante="outline"
                          title="Editar"
                          >
                          <CIcon icon={cilPencil} />
                          </BotonEnlace>
                        <CButton
                          color="danger"
                          variant="outline"
                          onClick={() => setAEliminar(edificio)}
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
          Se va a eliminar el edificio <strong>{aEliminar?.nombre}</strong>.
        </p>
        <p className="text-body-secondary mt-2 mb-0">
          Solo se puede eliminar si no tiene espacios cargados.
        </p>
      </DialogoEliminar>
    </>
  );
}
