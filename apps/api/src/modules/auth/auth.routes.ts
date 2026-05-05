import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/index.js';
import { loginSchema } from './auth.validation.js';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export const authRoutes = router;
