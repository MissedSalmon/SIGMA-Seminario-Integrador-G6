'use client';

/**
 * /inventario/herramientas - catalogo y estado de herramientas del deposito
 * (HU-15 y HU-16). Una herramienta se maneja distinto que un material (no
 * lleva stock, se presta y se devuelve), por eso tiene su propia pantalla en
 * vez de compartir el listado.
 *
 * Muestra el estado de cada herramienta (Disponible, En uso o Fuera de
 * servicio) y, si esta en uso, el tecnico que la tiene.
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
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { eliminarItem, listarItems } from '@/servicios/inventario.js';

const ESTADOS = ['Disponible', 'En uso', 'Fuera de servicio'];

export default function PantallaHerramientas() {
  const { mostrarToast } = useToast();
  const [herramientas, setHerramientas] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [estado, setEstado] = useState('');
  const [tecnico, setTecnico] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    listarItems('Herramienta')
      .then(setHerramientas)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [recarga]);

  async function confirmarBaja() {
    setEliminando(true);
    try {
      await eliminarItem(aEliminar.codigo);
      mostrarToast({ tipo: 'exito', mensaje: `Se eliminó "${aEliminar.nombre}".` });
      setAEliminar(null);
      setRecarga((numero) => numero + 1);
    } catch (fallo) {
      setError(fallo.message);
      setAEliminar(null);
    } finally {
      setEliminando(false);
    }
  }

  const filasVisibles = herramientas
    .filter((fila) => !categoria || fila.nombreTipo === categoria)
    .filter((fila) => !estado || fila.estado === estado)
    .filter((fila) => !tecnico || fila.tecnico === tecnico);

  const categorias = [...new Set(herramientas.map((fila) => fila.nombreTipo).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es')
  );
  // Solo los tecnicos que hoy tienen alguna herramienta prestada, sin repetir.
  const tecnicos = [...new Set(herramientas.map((fila) => fila.tecnico).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es')
  );

  const columnas = [
    {
      clave: 'codigo',
      encabezado: 'Código',
      render: (fila) => <span className="fw-semibold">{fila.codigo}</span>,
    },
    { clave: 'nombre', encabezado: 'Nombre', render: (fila) => fila.nombre },
    {
      clave: 'nombreTipo',
      encabezado: 'Categoría',
      render: (fila) => <span className="text-body-secondary">{fila.nombreTipo || '-'}</span>,
    },
    { clave: 'estado', encabezado: 'Estado', render: (fila) => fila.estado },
    { clave: 'tecnico', encabezado: 'Técnico', render: (fila) => fila.tecnico || '-' },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (fila) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/inventario/herramientas/${encodeURIComponent(fila.codigo)}/editar`}
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
            onClick={() => setAEliminar(fila)}
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
      <EncabezadoPagina titulo="Herramientas" accion={{ direccion: '/inventario/herramientas/agregar' }} />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={filasVisibles}
            claveFila={(fila) => fila.codigo}
            columnas={columnas}
            buscarPor={['codigo', 'nombre', 'descripcion', 'nombreTipo', 'tecnico']}
            placeholderBusqueda="Buscar por código, nombre o categoría"
            filtros={[
              // Solo tiene sentido si ya hay mas de una categoria cargada.
              ...(categorias.length > 1
                ? [
                    {
                      etiqueta: 'Categoría',
                      valor: categoria,
                      alCambiar: setCategoria,
                      opciones: categorias.map((texto) => ({ valor: texto, texto })),
                    },
                  ]
                : []),
              {
                etiqueta: 'Estado',
                valor: estado,
                alCambiar: setEstado,
                opciones: ESTADOS.map((texto) => ({ valor: texto, texto })),
              },
              // Solo tiene sentido cuando hay alguna herramienta prestada.
              ...(tecnicos.length > 0
                ? [
                    {
                      etiqueta: 'Técnico',
                      valor: tecnico,
                      alCambiar: setTecnico,
                      opciones: tecnicos.map((nombre) => ({ valor: nombre, texto: nombre })),
                    },
                  ]
                : []),
            ]}
            alLimpiar={() => {
              setCategoria('');
              setEstado('');
              setTecnico('');
            }}
            cargando={cargando}
            textoVacio="Todavia no hay herramientas cargadas."
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
          Se va a eliminar <strong>{aEliminar?.nombre}</strong>.
        </p>
        <p className="text-body-secondary mt-2 mb-0">
          Solo se puede eliminar si no tiene ingresos ni consumos registrados.
        </p>
      </DialogoEliminar>
    </>
  );
}
