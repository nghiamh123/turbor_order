import type { Request, Response, NextFunction } from 'express';
import { productService } from './products.service.js';

export const productController = {
  /** GET /products */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.list(req.parsedQuery as never);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  /** GET /products/:id */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getById(req.params.id);
      res.json({ success: true, data: product });
    } catch (error) { next(error); }
  },

  /** POST /products */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.create(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error) { next(error); }
  },

  /** PUT /products/:id */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.update(req.params.id, req.body);
      res.json({ success: true, data: product });
    } catch (error) { next(error); }
  },

  /** PATCH /products/:id/status */
  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.toggleStatus(req.params.id);
      res.json({ success: true, data: product });
    } catch (error) { next(error); }
  },

  /** POST /products/bulk-delete */
  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.bulkDelete(req.body.ids);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },
};
