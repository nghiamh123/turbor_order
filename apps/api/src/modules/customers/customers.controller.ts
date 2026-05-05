import type { Request, Response, NextFunction } from 'express';
import { customerService } from './customers.service.js';

export const customerController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.list(req.parsedQuery as never);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.getById(req.params.id);
      res.json({ success: true, data: customer });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.create(req.body);
      res.status(201).json({ success: true, data: customer });
    } catch (error) { next(error); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.update(req.params.id, req.body);
      res.json({ success: true, data: customer });
    } catch (error) { next(error); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await customerService.delete(req.params.id);
      res.json({ success: true, data: null });
    } catch (error) { next(error); }
  },

  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.bulkDelete(req.body.ids);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },
};
