import mongoose from 'mongoose';
import { Customer, Order } from '../../models/index.js';
import { AppError } from '../../middleware/index.js';
import type { CreateCustomerRequest, UpdateCustomerRequest, CustomerQueryParams } from '@turboorder/shared';
import type { FilterQuery } from 'mongoose';
import type { ICustomer } from '../../models/Customer.js';
import { CUSTOMER_TIER } from '@turboorder/shared';

export const customerService = {
  async list(query: CustomerQueryParams) {
    const { page = 1, limit = 20, search, tier, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const filter: FilterQuery<ICustomer> = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (tier) {
      filter.tier = tier;
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      Customer.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Customer.countDocuments(filter),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    const customer = await Customer.findById(id).lean();
    if (!customer) {
      throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'errors.customers.not_found');
    }
    return customer;
  },

  async create(data: CreateCustomerRequest) {
    // Check for duplicate phone
    const existing = await Customer.findOne({ phone: data.phone });
    if (existing) {
      throw new AppError(409, 'CUSTOMER_PHONE_EXISTS', 'errors.customers.phone_exists');
    }

    const customer = await Customer.create(data);
    return customer.toObject();
  },

  async update(id: string, data: UpdateCustomerRequest) {
    const customer = await Customer.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
    if (!customer) {
      throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'errors.customers.not_found');
    }
    return customer;
  },

  /**
   * Delete a customer.
   * Blocks deletion if the customer has any active (non-cancelled, non-completed) orders.
   */
  async delete(id: string) {
    const customer = await Customer.findById(id);
    if (!customer) {
      throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'errors.customers.not_found');
    }

    // Check for active orders
    const activeOrderCount = await Order.countDocuments({
      'customer._id': customer._id,
      status: { $in: ['new', 'confirmed', 'shipping'] },
    });

    if (activeOrderCount > 0) {
      throw new AppError(422, 'CUSTOMER_HAS_ACTIVE_ORDERS', 'errors.customers.has_active_orders');
    }

    await Customer.findByIdAndDelete(id);
  },

  /**
   * Bulk delete customers.
   * Skips customers with active orders.
   */
  async bulkDelete(ids: string[]) {
    const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));

    // Find customers with active orders
    const activeOrders = await Order.aggregate([
      { $match: { 'customer._id': { $in: objectIds }, status: { $in: ['new', 'confirmed', 'shipping'] } } },
      { $group: { _id: '$customer._id' } },
    ]);

    const blockedIds = new Set(activeOrders.map((o: { _id: mongoose.Types.ObjectId }) => o._id.toString()));
    const deletableIds = ids.filter(id => !blockedIds.has(id));

    if (deletableIds.length > 0) {
      await Customer.deleteMany({ _id: { $in: deletableIds } });
    }

    return { deleted: deletableIds.length, skipped: blockedIds.size };
  },

  /** Auto-compute customer tier based on total orders */
  computeTier(totalOrders: number): 'new' | 'regular' | 'vip' {
    if (totalOrders >= CUSTOMER_TIER.vip.minOrders) return 'vip';
    if (totalOrders >= CUSTOMER_TIER.regular.minOrders) return 'regular';
    return 'new';
  },
};
