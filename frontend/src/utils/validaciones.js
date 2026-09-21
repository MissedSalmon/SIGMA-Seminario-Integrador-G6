/**
 * Las reglas de DNI, CUIL y telefono, escritas una sola vez.
 *
 * Antes cada formulario tenia su propia copia y no coincidian entre si: el
 * telefono aceptaba 30 caracteres en una pantalla y 50 en otra, y ninguna de las
 * dos revisaba que fueran numeros.
 *
 * De cada campo hay dos funciones: `formatear*` ordena lo que se escribe
 * mientras se escribe, y `validar*` devuelve el motivo del error, o '' si esta
 * bien. Un campo vacio no da error: si es obligatorio lo decide el formulario.
 *
 * OJO: estas reglas estan repetidas en backend/src/utiles/validaciones.js,
 * porque a la API se le puede pegar sin pasar por la pantalla. Si se cambia una
 * regla aca, hay que cambiarla alla tambien.
 */

/** Deja solo los digitos, sin importar puntos, espacios ni guiones. */
export function soloDigitos(texto) {
  return String(texto ?? '').replace(/\D/g, '');
}

/* ---------------------------------------------------------------- EMAIL --- */

/**
 * Si un email existe o no solo se sabe mandandole un correo. Lo que si se puede
 * es descartar los que estan mal escritos: tiene que haber algo antes del @,
 * algo despues, y terminar en un punto con al menos dos letras. Asi no pasa un
 * "juan@" ni un "juan@gmail".
 */
const FORMA_EMAIL = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export function validarEmail(texto) {
  const limpio = String(texto ?? '').trim();
  if (!limpio) return '';
  if (!FORMA_EMAIL.test(limpio)) return 'El email no es válido.';
  return '';
}

/* ------------------------------------------------------------------ DNI --- */

export const LARGO_DNI = 8;

export function formatearDni(texto) {
  return soloDigitos(texto).slice(0, LARGO_DNI);
}

export function validarDni(texto) {
  const digitos = soloDigitos(texto);
  if (!digitos) return '';
  if (digitos.length !== LARGO_DNI) return `El DNI tiene ${LARGO_DNI} dígitos.`;
  return '';
}

/* ----------------------------------------------------------------- CUIL --- */

/**
 * El CUIL son 11 digitos que se escriben 20-34567883-4: 2 de prefijo, los 8 del
 * DNI y al final el digito verificador, que sale de una cuenta con los otros 10.
 * Rehacer esa cuenta es lo que permite darse cuenta de un CUIL mal tipeado sin
 * tener que consultarlo con nadie.
 */
export const LARGO_CUIL = 11;

const PESOS_CUIL = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/** El verificador que le corresponde a los 10 primeros digitos ("modulo 11"). */
function digitoVerificador(diezDigitos) {
  const suma = PESOS_CUIL.reduce((total, peso, i) => total + peso * Number(diezDigitos[i]), 0);
  const resultado = 11 - (suma % 11);
  return resultado === 11 ? 0 : resultado;
}

/** Pone los guiones mientras se escribe. */
export function formatearCuil(texto) {
  const digitos = soloDigitos(texto).slice(0, LARGO_CUIL);

  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 10) return `${digitos.slice(0, 2)}-${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`;
}

/**
 * Cuenta los digitos y rehace la cuenta del verificador, asi que agarra casi
 * cualquier numero cambiado. Si tambien hay DNI cargado, controla que los 8 del
 * medio sean ese DNI.
 */
export function validarCuil(texto, dni = '') {
  const digitos = soloDigitos(texto);
  if (!digitos) return '';

  if (digitos.length !== LARGO_CUIL) return `El CUIL tiene ${LARGO_CUIL} dígitos.`;

  if (digitoVerificador(digitos.slice(0, 10)) !== Number(digitos[10])) {
    return 'El CUIL no es válido: revisá los números.';
  }

  const digitosDni = soloDigitos(dni);
  if (digitosDni.length === LARGO_DNI && digitos.slice(2, 10) !== digitosDni) {
    return 'El CUIL no coincide con el DNI cargado.';
  }

  return '';
}

/* ------------------------------------------------------------- TELEFONO --- */

/**
 * Un telefono argentino son 10 digitos: la caracteristica del lugar y despues el
 * numero. Lo unico que cambia es cuanto ocupa la caracteristica, y por eso hace
 * falta la lista de abajo: 2 digitos en Buenos Aires, 3 en las ciudades grandes
 * (362 es Resistencia) y 4 en el resto.
 */
export const LARGO_TELEFONO = 10;

/** Las caracteristicas de 3 digitos. El 11 es la unica de 2; todas las demas son de 4. */
const CARACTERISTICAS_DE_3 = [
  '220', '221', '223', '230', '236', '237', '249', '260', '261', '263',
  '264', '266', '280', '291', '297', '299', '341', '342', '343', '345',
  '348', '351', '353', '358', '362', '364', '370', '376', '379', '380',
  '381', '383', '385', '387', '388',
];

function largoCaracteristica(digitos) {
  if (digitos.startsWith('11')) return 2;
  if (CARACTERISTICAS_DE_3.includes(digitos.slice(0, 3))) return 3;
  return 4;
}

/**
 * Saca el 0 y el 15, que son para discar y no son parte del numero: casi todo el
 * mundo escribe 0362 15 4123456. Una caracteristica nunca empieza con 0, asi que
 * ese siempre sobra. El 15 solo se saca si quedan digitos de mas, para no romper
 * los numeros que justo empiezan con 15.
 */
function sacarDigitosDeDiscado(digitos) {
  const sinCero = digitos.startsWith('0') ? digitos.slice(1) : digitos;

  const largo = largoCaracteristica(sinCero);
  if (sinCero.length > LARGO_TELEFONO && sinCero.slice(largo, largo + 2) === '15') {
    return sinCero.slice(0, largo) + sinCero.slice(largo + 2);
  }

  return sinCero;
}

/** Separa la caracteristica del numero con un espacio: 362 4123456. */
export function formatearTelefono(texto) {
  const digitos = sacarDigitosDeDiscado(soloDigitos(texto)).slice(0, LARGO_TELEFONO);
  const largo = largoCaracteristica(digitos);

  if (digitos.length <= largo) return digitos;
  return `${digitos.slice(0, largo)} ${digitos.slice(largo)}`;
}

export function validarTelefono(texto) {
  const digitos = sacarDigitosDeDiscado(soloDigitos(texto));
  if (!digitos) return '';

  if (digitos.length !== LARGO_TELEFONO) {
    return `El teléfono son ${LARGO_TELEFONO} dígitos: la característica y el número.`;
  }

  return '';
}
