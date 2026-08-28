import * as edificiosServicio from '../servicios/edificios.servicio.js';

/**
 * GET /api/edificios
 */
export const listar = async (req, res, next) => {
  try {
    const edificios = await edificiosServicio.obtenerTodos();
    res.json({
      ok: true,
      datos: edificios
    });
  } catch (error) {
    next(error); // Pasa el error al middleware de errores
  }
};

/**
 * POST /api/edificios
 */
export const crear = async (req, res, next) => {
  try {
    const { nombre, direccion } = req.body;
    
    // Validación básica
    if (!nombre) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El nombre del edificio es obligatorio.'
      });
    }

    const nuevoEdificio = await edificiosServicio.crear({ nombre, direccion });
    
    res.status(201).json({
      ok: true,
      datos: nuevoEdificio
    });
  } catch (error) {
    next(error);
  }
};
