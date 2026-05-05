import { Router } from 'express';
import { customerController } from './customers.controller.js';
import { validate } from '../../middleware/index.js';
import { createCustomerSchema, updateCustomerSchema, customerQuerySchema } from './customers.validation.js';

const router = Router();

router.get('/', validate(customerQuerySchema, 'query'), customerController.list);
router.get('/:id', customerController.getById);
router.post('/', validate(createCustomerSchema), customerController.create);
router.put('/:id', validate(updateCustomerSchema), customerController.update);
router.delete('/:id', customerController.delete);
router.post('/bulk-delete', customerController.bulkDelete);

export const customerRoutes = router;
