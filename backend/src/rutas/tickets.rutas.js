import { Router } from 'express';
import * as tickets from '../controladores/tickets.controlador.js';

const router = Router();

router.post('/', tickets.crear);

export default router;
