// Renderiza el componente real con el compilador de Next y verifica el escape.
import { jest } from '@jest/globals';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadBindings, transform } from 'next/dist/build/swc/index.js';

jest.unstable_mockModule('@coreui/react', () => ({
  CButton: (props) => React.createElement('button', props),
  CCard: ({ children }) => React.createElement('section', null, children),
  CCardBody: ({ children }) => React.createElement('div', null, children),
  CCardHeader: ({ children }) => React.createElement('h2', null, children),
}));

const archivo = new URL('../../frontend/src/componentes/tareas/ObservacionesTarea.js', import.meta.url);
let fuente = await readFile(archivo, 'utf8');
// Los controles compartidos no forman parte de esta prueba de representación.
fuente = fuente.replace(/import Campo .*;/, 'const Campo = () => null;')
  .replace(/import Aviso .*;/, 'const Aviso = () => null;')
  .replace(/import \{ agregarObservacion \} .*;/, 'const agregarObservacion = async () => {};')
  .replace(/import \{ formatearFechaHora \} .*;/, 'const formatearFechaHora = (fecha) => fecha;');
await loadBindings();
const { code } = await transform(fuente, {
  filename: archivo.pathname,
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
  module: { type: 'es6' },
});
const modulo = new SourceTextModule(code);
await modulo.link(async (nombre) => {
  const exportaciones = await import(nombre);
  return new SyntheticModule(Object.keys(exportaciones), function () {
    for (const clave of Object.keys(exportaciones)) this.setExport(clave, exportaciones[clave]);
  });
});
await modulo.evaluate();
const ObservacionesTarea = modulo.namespace.default;

test('muestra texto, técnico y fecha de múltiples observaciones escapando HTML', () => {
  const html = renderToStaticMarkup(React.createElement(ObservacionesTarea, {
    idOt: 9, idTarea: 2, onGuardado: () => {}, observaciones: [
      { id: 1, autor: 'Ana Pérez', fecha: '2026-10-13T12:00:00Z', texto: '<script>alert(1)</script>' },
      { id: 2, autor: 'Luis Gómez', fecha: '2026-10-13T13:00:00Z', texto: 'Otra actividad' },
    ],
  }));
  expect(html).toContain('Ana Pérez');
  expect(html).toContain('Luis Gómez');
  expect(html).toContain('2026-10-13T12:00:00Z');
  expect(html).toContain('&lt;script&gt;');
  expect(html).not.toContain('<script>');
  expect(html.indexOf('Ana Pérez')).toBeLessThan(html.indexOf('Luis Gómez'));
});
test('el detalle sin observaciones muestra la acción para agregar', () => {
  const html = renderToStaticMarkup(React.createElement(ObservacionesTarea, {
    idOt: 9, idTarea: 2, onGuardado: () => {}, observaciones: [],
  }));
  expect(html).toContain('Todavía no se registraron observaciones.');
  expect(html).toContain('Agregar');
});
