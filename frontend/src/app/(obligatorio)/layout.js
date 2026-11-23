'use client';

import { ProveedorToast } from '@/componentes/toast/ContextoToast.js';

export default function LayoutObligatorio({ children }) {
  return <ProveedorToast>{children}</ProveedorToast>;
}
