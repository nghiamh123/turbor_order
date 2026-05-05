import { Router } from 'express';
import { productController } from './products.controller.js';
import { validate } from '../../middleware/index.js';
import { createProductSchema, updateProductSchema, productQuerySchema } from './products.validation.js';

const router = Router();

router.get('/', validate(productQuerySchema, 'query'), productController.list);
router.get('/:id', productController.getById);
router.post('/', validate(createProductSchema), productController.create);
router.put('/:id', validate(updateProductSchema), productController.update);
router.patch('/:id/status', productController.toggleStatus);
router.post('/bulk-delete', productController.bulkDelete);

export const productRoutes = router;
