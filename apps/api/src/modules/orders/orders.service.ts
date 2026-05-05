import mongoose from 'mongoose';
import { Order, Product, Customer } from '../../models/index.js';
import { AppError } from '../../middleware/index.js';
import { ORDER_STATUS_TRANSITIONS } from '@turboorder/shared';
import { customerService } from '../customers/customers.service.js';
import type { CreateOrderRequest, OrderQueryParams, OrderStatus, UpdateOrderStatusRequest } from '@turboorder/shared';
import type { FilterQuery } from 'mongoose';
import type { IOrder } from '../../models/Order.js';

export const orderService = {
  /** List orders with filters, search, pagination */
  async list(query: OrderQueryParams) {
    const { page = 1, limit = 20, search, status, sortBy = 'createdAt', sortOrder = 'desc', from, to } = query;

    const filter: FilterQuery<IOrder> = {};

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      const statuses = status.split(',');
      filter.status = { $in: statuses };
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      Order.find(filter)
        .select('-statusHistory')
        .sort(sort).skip(skip).limit(limit).lean()
        .then(orders => orders.map(o => ({ ...o, itemCount: o.items.length }))),
      Order.countDocuments(filter),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  /** Get full order details */
  async getById(id: string) {
    const order = await Order.findById(id).lean();
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'errors.orders.not_found');
    }

    // Fallback for older orders that don't have shippingAddress snapshot
    if (!order.shippingAddress) {
      const customer = await Customer.findById(order.customer._id).select('address').lean();
      if (customer?.address) {
        order.shippingAddress = customer.address;
      }
    }

    return order;
  },

  /**
   * Create a new order.
   * Uses MongoDB transaction for atomic stock deduction + order creation.
   */
  async create(data: CreateOrderRequest) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Validate customer exists
      const customer = await Customer.findById(data.customerId).session(session);
      if (!customer) {
        throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'errors.customers.not_found');
      }

      // 2. Validate and fetch all products
      const productIds = data.items.map(i => i.productId);
      const products = await Product.find({ _id: { $in: productIds }, isActive: true }).session(session);

      if (products.length !== productIds.length) {
        throw new AppError(422, 'PRODUCT_INVALID', 'errors.orders.product_invalid');
      }

      // 3. Build order items with price snapshots and validate stock
      const orderItems = data.items.map(item => {
        const product = products.find(p => p._id.toString() === item.productId)!;

        if (product.stock < item.quantity) {
          throw new AppError(422, 'INSUFFICIENT_STOCK', 'errors.orders.insufficient_stock');
        }

        return {
          product: product._id,
          productName: product.name,
          sku: product.sku,
          unitPrice: product.sellingPrice,
          costPrice: product.costPrice,
          quantity: item.quantity,
          subtotal: product.sellingPrice * item.quantity,
        };
      });

      // 4. Calculate totals
      const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
      let discountAmount = 0;

      if (data.discountType === 'percentage' && data.discountValue) {
        discountAmount = Math.round(subtotal * (data.discountValue / 100));
      } else if (data.discountType === 'fixed' && data.discountValue) {
        discountAmount = Math.min(data.discountValue, subtotal);
      }

      const total = subtotal - discountAmount;

      // 5. Generate order number
      const orderNumber = await this.generateOrderNumber();

      // 6. Create order
      const [order] = await Order.create([{
        orderNumber,
        customer: {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
        },
        shippingAddress: customer.address,
        items: orderItems,
        subtotal,
        discountType: data.discountType || null,
        discountValue: data.discountValue || 0,
        discountAmount,
        total,
        status: 'new',
        statusHistory: [{
          from: null,
          to: 'new',
          changedAt: new Date(),
          note: '',
        }],
        note: data.note,
      }], { session });

      // 7. Deduct stock for each product
      for (const item of data.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { session }
        );
      }

      // 8. Update customer counters
      const newTotalOrders = customer.totalOrders + 1;
      await Customer.findByIdAndUpdate(customer._id, {
        $inc: { totalOrders: 1, totalSpent: total },
        $set: {
          lastOrderAt: new Date(),
          tier: customerService.computeTier(newTotalOrders),
        },
      }, { session });

      await session.commitTransaction();

      return { _id: order._id, orderNumber: order.orderNumber };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  /** Update order status with state machine validation */
  async updateStatus(id: string, data: UpdateOrderStatusRequest) {
    const { status: newStatus, note = '', trackingNumber, shippingCarrier, shippingFee } = data;

    const order = await Order.findById(id);
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'errors.orders.not_found');
    }

    // Validate transition
    const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new AppError(422, 'INVALID_STATUS_TRANSITION', 'errors.orders.invalid_status_transition');
    }

    // If cancelling, restore stock
    if (newStatus === 'cancelled') {
      if (!note) {
        throw new AppError(422, 'CANCEL_REASON_REQUIRED', 'errors.orders.cancel_reason_required');
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Restore stock for all items
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } },
            { session }
          );
        }

        // Update order
        order.statusHistory.push({ from: order.status, to: newStatus, changedAt: new Date(), note });
        order.status = newStatus;
        await order.save({ session });

        // Revert customer counters
        await Customer.findByIdAndUpdate(order.customer._id, {
          $inc: { totalOrders: -1, totalSpent: -order.total },
        }, { session });

        await session.commitTransaction();
        session.endSession();
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } else {
      // Handle shipping info if provided
      if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
      if (shippingCarrier !== undefined) order.shippingCarrier = shippingCarrier;
      
      if (shippingFee !== undefined && shippingFee !== order.shippingFee) {
        const feeDiff = shippingFee - (order.shippingFee || 0);
        order.shippingFee = shippingFee;
        order.total += feeDiff;

        // Update customer totalSpent
        await Customer.findByIdAndUpdate(order.customer._id, {
          $inc: { totalSpent: feeDiff },
        });
      }

      order.statusHistory.push({ from: order.status, to: newStatus, changedAt: new Date(), note });
      order.status = newStatus;
      await order.save();
    }

    return order.toObject();
  },

  /**
   * Update an existing order (only allowed when status is 'new').
   * Restores old stock, validates new items, deducts new stock.
   */
  async update(id: string, data: CreateOrderRequest) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findById(id).session(session);
      if (!order) {
        throw new AppError(404, 'ORDER_NOT_FOUND', 'errors.orders.not_found');
      }

      if (order.status !== 'new') {
        throw new AppError(422, 'ORDER_NOT_EDITABLE', 'errors.orders.not_editable');
      }

      // 1. Restore stock from old items
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { session }
        );
      }

      // 2. Validate new customer
      const customer = await Customer.findById(data.customerId).session(session);
      if (!customer) {
        throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'errors.customers.not_found');
      }

      // 3. Validate and fetch all new products
      const productIds = data.items.map(i => i.productId);
      const products = await Product.find({ _id: { $in: productIds }, isActive: true }).session(session);

      if (products.length !== productIds.length) {
        throw new AppError(422, 'PRODUCT_INVALID', 'errors.orders.product_invalid');
      }

      // 4. Build new order items with price snapshots and validate stock
      const orderItems = data.items.map(item => {
        const product = products.find(p => p._id.toString() === item.productId)!;

        if (product.stock < item.quantity) {
          throw new AppError(422, 'INSUFFICIENT_STOCK', 'errors.orders.insufficient_stock');
        }

        return {
          product: product._id,
          productName: product.name,
          sku: product.sku,
          unitPrice: product.sellingPrice,
          costPrice: product.costPrice,
          quantity: item.quantity,
          subtotal: product.sellingPrice * item.quantity,
        };
      });

      // 5. Calculate new totals
      const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
      let discountAmount = 0;

      if (data.discountType === 'percentage' && data.discountValue) {
        discountAmount = Math.round(subtotal * (data.discountValue / 100));
      } else if (data.discountType === 'fixed' && data.discountValue) {
        discountAmount = Math.min(data.discountValue, subtotal);
      }

      const total = subtotal - discountAmount;

      // 6. Update customer counters (revert old, apply new)
      const oldCustomerId = order.customer._id.toString();
      const newCustomerId = data.customerId;

      if (oldCustomerId !== newCustomerId) {
        // Revert old customer
        await Customer.findByIdAndUpdate(oldCustomerId, {
          $inc: { totalOrders: -1, totalSpent: -order.total },
        }, { session });

        // Update new customer
        const newTotalOrders = customer.totalOrders + 1;
        await Customer.findByIdAndUpdate(newCustomerId, {
          $inc: { totalOrders: 1, totalSpent: total },
          $set: {
            lastOrderAt: new Date(),
            tier: customerService.computeTier(newTotalOrders),
          },
        }, { session });
      } else {
        // Same customer, just adjust totalSpent
        await Customer.findByIdAndUpdate(oldCustomerId, {
          $inc: { totalSpent: total - order.total },
        }, { session });
      }

      // 7. Deduct stock for new items
      for (const item of data.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { session }
        );
      }

      // 8. Update order
      order.customer = {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
      };

      if (oldCustomerId !== newCustomerId) {
        order.shippingAddress = customer.address;
      }
      
      order.items = orderItems as typeof order.items;
      order.subtotal = subtotal;
      order.discountType = data.discountType || null;
      order.discountValue = data.discountValue || 0;
      order.discountAmount = discountAmount;
      order.total = total;
      order.note = data.note;

      await order.save({ session });

      await session.commitTransaction();

      return order.toObject();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Delete an order.
   * Restores stock and reverts customer counters if order was not cancelled.
   */
  async delete(id: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findById(id).session(session);
      if (!order) {
        throw new AppError(404, 'ORDER_NOT_FOUND', 'errors.orders.not_found');
      }

      // Only restore stock if order was not already cancelled (stock was already restored on cancel)
      if (order.status !== 'cancelled') {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } },
            { session }
          );
        }

        // Revert customer counters
        await Customer.findByIdAndUpdate(order.customer._id, {
          $inc: { totalOrders: -1, totalSpent: -order.total },
        }, { session });
      }

      await Order.findByIdAndDelete(id).session(session);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  /** Generate order number: TO-YYYYMMDD-XXXX */
  async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `TO-${dateStr}-`;

    const lastOrder = await Order.findOne(
      { orderNumber: { $regex: `^${prefix}` } },
      { orderNumber: 1 }
    ).sort({ orderNumber: -1 }).lean();

    if (!lastOrder) {
      return `${prefix}0001`;
    }

    const lastNum = parseInt(lastOrder.orderNumber.replace(prefix, ''), 10);
    return `${prefix}${String(lastNum + 1).padStart(4, '0')}`;
  },
};
