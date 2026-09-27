/*
  PostCSS existe aca por un solo motivo: HeroUI v3 esta escrito con Tailwind v4
  y su CSS viene sin compilar (usa @apply), asi que alguien tiene que
  compilarlo. Lo unico que se compila es src/app/heroui.css.

  El resto de SIGMA sigue siendo CoreUI + globals.css, sin Tailwind. Ver el
  comentario de src/app/heroui.css para por que el reset de Tailwind queda
  afuera.
*/
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
