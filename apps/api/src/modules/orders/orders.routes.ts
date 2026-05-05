import { Router } from 'express';
import { orderController } from './orders.controller.js';
import { validate } from '../../middleware/index.js';
import { createOrderSchema, updateOrderSchema, updateStatusSchema, orderQuerySchema } from './orders.validation.js';

const router = Router();

router.get('/', validate(orderQuerySchema, 'query'), orderController.list);
router.get('/:id', orderController.getById);
router.post('/', validate(createOrderSchema), orderController.create);
router.put('/:id', validate(updateOrderSchema), orderController.update);
router.patch('/:id/status', validate(updateStatusSchema), orderController.updateStatus);
router.delete('/:id', orderController.delete);

export const orderRoutes = router;
