import type { Request, Response, NextFunction } from 'express';
import { orderService } from './orders.service.js';

export const orderController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderService.list(req.parsedQuery as never);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getById(req.params.id);
      res.json({ success: true, data: order });
    } catch (error) { next(error); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.create(req.body);
      res.status(201).json({ success: true, data: order });
    } catch (error) { next(error); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.update(req.params.id, req.body);
      res.json({ success: true, data: order });
    } catch (error) { next(error); }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.updateStatus(req.params.id, req.body);
      res.json({ success: true, data: order });
    } catch (error) { next(error); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await orderService.delete(req.params.id);
      res.json({ success: true, data: null });
    } catch (error) { next(error); }
  },
};
