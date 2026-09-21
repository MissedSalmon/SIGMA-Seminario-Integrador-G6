/**
 * Las reglas de DNI, CUIL y telefono del lado de la API.
 *
 * Son las mismas que las de frontend/src/utils/validaciones.js. Estan repetidas
 * a proposito: la pantalla avisa mientras se escribe, pero a la API se le puede
 * pegar directo (con Postman, con un script, desde otra pantalla que todavia no
 * exista) y ahi no hay pantalla que avise. Si se cambia una regla en un lado,
 * hay que cambiarla en el otro.
 *
 * Lo unico que no esta aca es completar el CUIL a partir del DNI: eso es una
 * comodidad de la pantalla mientras se escribe, no una regla del dato.
 *
 * COMO SE GUARDA. El dato se guarda ya ordenado, como se lee: el CUIL con
 * guiones (20-34567883-4) y el telefono con la caracteristica separada
 * (362 4123456). Las funciones `normalizar*` lo dejan asi venga como venga, de
 * manera que dos personas nunca queden cargadas con el mismo numero escrito de
 * dos formas distintas (importa porque DNI y CUIL son UNIQUE en la base).
 */

/** Deja solo los digitos, sin importar puntos, espacios ni guiones. */
export function soloDigitos(texto) {
  return String(texto ?? '').replace(/\D/g, '');
}

/* ---------------------------------------------------------------- EMAIL --- */

/**
 * Si un email existe o no solo se sabe mandandole un correo. Lo que si se puede
 * es descartar los que estan mal escritos: algo antes del @, algo despues, y un
 * punto con al menos dos letras al final. Asi no pasa un "juan@".
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

export function validarDni(texto) {
  const digitos = soloDigitos(texto);
  if (!digitos) return '';
  if (digitos.length !== LARGO_DNI) return `El DNI tiene que tener ${LARGO_DNI} dígitos.`;
  return '';
}

export function normalizarDni(texto) {
  return soloDigitos(texto) || null;
}

/* ----------------------------------------------------------------- CUIL --- */

/**
 * El CUIL son 11 digitos: 2 de prefijo, los 8 del DNI y el digito verificador,
 * que sale de una cuenta con los otros 10 (ver el archivo del frontend, que lo
 * explica largo). Rehacer esa cuenta es lo que permite darse cuenta de un CUIL
 * mal tipeado sin consultar a nadie.
 */
export const LARGO_CUIL = 11;

const PESOS_CUIL = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/** El verificador de los 10 primeros digitos. Devuelve 10 si ese CUIL no existe. */
function digitoVerificador(diezDigitos) {
  const suma = PESOS_CUIL.reduce((total, peso, i) => total + peso * Number(diezDigitos[i]), 0);
  const resultado = 11 - (suma % 11);
  return resultado === 11 ? 0 : resultado;
}

export function validarCuil(texto, dni = '') {
  const digitos = soloDigitos(texto);
  if (!digitos) return '';

  if (digitos.length !== LARGO_CUIL) return `El CUIL tiene que tener ${LARGO_CUIL} dígitos.`;

  if (digitoVerificador(digitos.slice(0, 10)) !== Number(digitos[10])) {
    return 'El CUIL no es válido: no coincide el dígito verificador.';
  }

  const digitosDni = soloDigitos(dni);
  if (digitosDni.length === LARGO_DNI && digitos.slice(2, 10) !== digitosDni) {
    return 'El CUIL no coincide con el DNI.';
  }

  return '';
}

export function normalizarCuil(texto) {
  const digitos = soloDigitos(texto);
  if (!digitos) return null;
  if (digitos.length !== LARGO_CUIL) return digitos;
  return `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`;
}

/* ------------------------------------------------------------- TELEFONO --- */

/**
 * Un telefono argentino son 10 digitos: la caracteristica del lugar y despues
 * el numero, sin el 0 de adelante ni el 15 de los celulares. La caracteristica
 * ocupa 2 digitos en Buenos Aires, 3 en las ciudades grandes (362 es
 * Resistencia) y 4 en el resto.
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
 * Saca el 0 y el 15, que son para discar y no son parte del numero: el
 * telefono se puede mandar como 0362 15 4123456 y se guarda 362 4123456.
 *
 * Una caracteristica nunca empieza con 0, asi que ese siempre sobra. El 15 solo
 * se saca si quedan digitos de mas, para no romper los numeros que justo
 * empiezan con 15.
 */
function sacarDigitosDeDiscado(digitos) {
  const sinCero = digitos.startsWith('0') ? digitos.slice(1) : digitos;

  const largo = largoCaracteristica(sinCero);
  if (sinCero.length > LARGO_TELEFONO && sinCero.slice(largo, largo + 2) === '15') {
    return sinCero.slice(0, largo) + sinCero.slice(largo + 2);
  }

  return sinCero;
}

export function validarTelefono(texto) {
  const digitos = sacarDigitosDeDiscado(soloDigitos(texto));
  if (!digitos) return '';

  if (digitos.length !== LARGO_TELEFONO) {
    return `El teléfono tiene que tener ${LARGO_TELEFONO} dígitos: la característica y el número.`;
  }

  return '';
}

export function normalizarTelefono(texto) {
  const digitos = sacarDigitosDeDiscado(soloDigitos(texto));
  if (!digitos) return null;
  if (digitos.length !== LARGO_TELEFONO) return digitos;

  const largo = largoCaracteristica(digitos);
  return `${digitos.slice(0, largo)} ${digitos.slice(largo)}`;
}
