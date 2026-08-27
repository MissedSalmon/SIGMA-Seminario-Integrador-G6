import './globals.css';

export const metadata = {
  title: 'SIGMA',
  description: 'Sistema Integral de Gestion de Mantenimiento de Activos - UTN FRRe',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
