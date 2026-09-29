import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /*
   * SIGMA es un monorepo (npm workspaces): ademas de este package.json hay
   * uno en la raiz, otro en backend/ y otro en pruebas/, cada uno con su
   * propio package-lock.json. Turbopack solo resuelve modulos dentro de la
   * carpeta que toma como raiz del proyecto, y al ver varios lockfiles no
   * siempre adivina la correcta.
   *
   * Sin esto, no encuentra paquetes que quedan en el node_modules de la raiz
   * del repo (como @tailwindcss/postcss) y tira "Cannot find module" al
   * levantar el servidor de desarrollo.
   *
   * https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
   */
  turbopack: {
    root: path.join(__dirname, '..'),
  },
};

export default nextConfig;
