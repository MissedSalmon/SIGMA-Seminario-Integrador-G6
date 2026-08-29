'use client';

/**
 * /espacios - listado de espacios (HU-2).
 *
 * Tiene un filtro por edificio, porque la facultad tiene muchos espacios y en
 * la practica siempre se busca dentro de un edificio.
 */
import { useEffect, useState } from 'react';
import {
  CBadge,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCol,
  CFormSelect,
  CRow,
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
import { listarEdificios } from '@/servicios/edificios.js';
import { listarEspacios, eliminarEspacio } from '@/servicios/espacios.js';

export default function PantallaEspacios() {
  const [espacios, setEspacios] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [filtroEdificio, setFiltroEdificio] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

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
      setExito(`Se elimino el espacio "${aEliminar.nombre}".`);
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
        titulo="Espacios"
        accion={{ texto: 'Agregar espacio', direccion: '/espacios/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />
      <Aviso mensaje={exito} color="success" onCerrar={() => setExito('')} />

      <CCard>
        <CCardBody>
          <CRow className="mb-3">
            <CCol md={4}>
              <CFormSelect
                value={filtroEdificio}
                onChange={(evento) => setFiltroEdificio(evento.target.value)}
                aria-label="Filtrar por edificio"
              >
                <option value="">Todos los edificios</option>
                {edificios.map((edificio) => (
                  <option key={edificio.idEdificio} value={edificio.idEdificio}>
                    {edificio.nombre}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>

          {cargando ? (
            <Cargando texto="Cargando espacios..." />
          ) : espacios.length === 0 ? (
            <SinDatos
              texto={
                filtroEdificio
                  ? 'Ese edificio todavia no tiene espacios cargados.'
                  : 'Todavia no hay espacios cargados.'
              }
            />
          ) : (
            <CTable hover responsive align="middle" className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Nombre</CTableHeaderCell>
                  <CTableHeaderCell>Edificio</CTableHeaderCell>
                  <CTableHeaderCell>Tipo</CTableHeaderCell>
                  <CTableHeaderCell>Piso</CTableHeaderCell>
                  <CTableHeaderCell>Numero</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {espacios.map((espacio) => (
                  <CTableRow key={espacio.idEspacio}>
                    <CTableDataCell className="fw-semibold">{espacio.nombre}</CTableDataCell>
                    <CTableDataCell className="text-body-secondary">
                      {espacio.nombreEdificio}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color="info" shape="rounded-pill">
                        {espacio.tipo}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell className="text-body-secondary">
                      {espacio.piso ?? '-'}
                    </CTableDataCell>
                    <CTableDataCell className="text-body-secondary">
                      {espacio.numero ?? '-'}
                    </CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CButtonGroup size="sm">
                        <BotonEnlace
                          href={`/espacios/${espacio.idEspacio}/editar`}
                          color="primary"
                          variante="outline"
                          title="Editar"
                          >
                          <CIcon icon={cilPencil} />
                          </BotonEnlace>
                        <CButton
                          color="danger"
                          variant="outline"
                          onClick={() => setAEliminar(espacio)}
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
          Se va a eliminar el espacio <strong>{aEliminar?.nombre}</strong> del edificio
          {' '}
          <strong>{aEliminar?.nombreEdificio}</strong>.
        </p>
        <p className="text-body-secondary mt-2 mb-0">
          Solo se puede eliminar si no tiene areas asociadas.
        </p>
      </DialogoEliminar>
    </>
  );
}
