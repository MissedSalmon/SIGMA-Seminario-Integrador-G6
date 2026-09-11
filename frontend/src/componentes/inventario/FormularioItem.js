'use client';

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
  CFormTextarea,
  CRow,
} from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarTiposInventario } from '@/servicios/inventario.js';

export default function FormularioItem({ item = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(item);
  const [codigo, setCodigo] = useState(item?.codigo ?? '');
  const [nombre, setNombre] = useState(item?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(item?.descripcion ?? '');
  const [clase, setClase] = useState(item?.clase ?? 'Material');
  const [idTipo, setIdTipo] = useState(item?.idTipo ?? '');
  const [stockMinimo, setStockMinimo] = useState(item?.stockMinimo ?? '');
  const [fechaVencimiento, setFechaVencimiento] = useState(item?.fechaVencimiento?.slice(0, 10) ?? '');
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [validado, setValidado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarTiposInventario(clase)
      .then(setTipos)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [clase]);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setValidado(true);
    setError('');
    if (!codigo.trim() || !nombre.trim() || !idTipo || (clase === 'Material' && stockMinimo === '')) return;
    setGuardando(true);
    try {
      await onGuardar({
        codigo: codigo.trim(), nombre: nombre.trim(), descripcion, clase, idTipo: Number(idTipo),
        stockMinimo: clase === 'Material' ? Number(stockMinimo) : null,
        fechaVencimiento: clase === 'Material' ? fechaVencimiento || null : null,
      });
      mostrarToast({ tipo: 'exito', mensaje: editando ? `Se guardaron los cambios de "${codigo}".` : `Se agrego el item "${codigo}".` });
      router.push('/inventario');
      router.refresh();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />
        <CForm noValidate validated={validado} onSubmit={manejarEnvio}>
          <CRow className="g-3">
            <CCol xs={12} md={4}>
              <CFormLabel htmlFor="codigo" className="sigma-obligatorio">Codigo</CFormLabel>
              <CFormInput id="codigo" value={codigo} onChange={(evento) => setCodigo(evento.target.value)} required maxLength={50} disabled={editando} />
              <CFormFeedback invalid>El codigo es obligatorio y no puede repetirse.</CFormFeedback>
            </CCol>
            <CCol xs={12} md={8}>
              <CFormLabel htmlFor="nombre" className="sigma-obligatorio">Nombre</CFormLabel>
              <CFormInput id="nombre" value={nombre} onChange={(evento) => setNombre(evento.target.value)} required maxLength={150} />
              <CFormFeedback invalid>El nombre es obligatorio.</CFormFeedback>
            </CCol>
            <CCol xs={12}>
              <CFormLabel htmlFor="descripcion">Descripcion</CFormLabel>
              <CFormTextarea id="descripcion" rows={3} value={descripcion} onChange={(evento) => setDescripcion(evento.target.value)} />
            </CCol>
            <CCol xs={12} md={4}>
              <CFormLabel htmlFor="clase" className="sigma-obligatorio">Clase</CFormLabel>
              <CFormSelect id="clase" value={clase} onChange={(evento) => { setClase(evento.target.value); setIdTipo(''); }} disabled={editando} required>
                <option value="Material">Material</option>
                <option value="Herramienta">Herramienta</option>
              </CFormSelect>
            </CCol>
            <CCol xs={12} md={4}>
              <CFormLabel htmlFor="tipo" className="sigma-obligatorio">Tipo</CFormLabel>
              <CFormSelect id="tipo" value={idTipo} onChange={(evento) => setIdTipo(evento.target.value)} disabled={cargando} required>
                <option value="">Seleccionar tipo</option>
                {tipos.map((tipo) => <option key={tipo.idTipo} value={tipo.idTipo}>{tipo.nombre}</option>)}
              </CFormSelect>
              <CFormFeedback invalid>El tipo es obligatorio.</CFormFeedback>
            </CCol>
            <CCol xs={12} md={4}>
              <CFormLabel htmlFor="estado">Estado</CFormLabel>
              <CFormInput id="estado" value="Disponible" readOnly disabled={clase !== 'Herramienta'} />
            </CCol>
            {clase === 'Material' && (
              <>
                <CCol xs={12} md={4}>
                  <CFormLabel htmlFor="stockMinimo" className="sigma-obligatorio">Stock minimo</CFormLabel>
                  <CFormInput id="stockMinimo" type="number" min="0" value={stockMinimo} onChange={(evento) => setStockMinimo(evento.target.value)} required />
                  <CFormFeedback invalid>Indica el stock minimo.</CFormFeedback>
                </CCol>
                <CCol xs={12} md={4}>
                  <CFormLabel htmlFor="fechaVencimiento">Fecha de vencimiento</CFormLabel>
                  <CFormInput id="fechaVencimiento" type="date" value={fechaVencimiento} onChange={(evento) => setFechaVencimiento(evento.target.value)} />
                </CCol>
              </>
            )}
          </CRow>
          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar item'}</CButton>
            <BotonEnlace href="/inventario" color="secondary" variante="outline">Cancelar</BotonEnlace>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
}
