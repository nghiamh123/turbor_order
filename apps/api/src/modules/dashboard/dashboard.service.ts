import { Order, Customer } from '../../models/index.js';
import type { DashboardPeriod } from '@turboorder/shared';

export const dashboardService = {
  /** Get KPI overview with period comparison */
  async getOverview(period: DashboardPeriod = 'month', startDate?: string, endDate?: string) {
    const { current, previous } = this.getDateRange(period, startDate, endDate);

    const [currentData, previousData, newCustomersCurrent, newCustomersPrevious] = await Promise.all([
      this.aggregateOrders(current.start, current.end),
      this.aggregateOrders(previous.start, previous.end),
      Customer.countDocuments({ createdAt: { $gte: current.start, $lte: current.end } }),
      Customer.countDocuments({ createdAt: { $gte: previous.start, $lte: previous.end } }),
    ]);

    return {
      revenue: {
        current: currentData.revenue,
        previous: previousData.revenue,
        changePercent: this.calcPercent(currentData.revenue, previousData.revenue),
      },
      profit: {
        current: currentData.profit,
        previous: previousData.profit,
        changePercent: this.calcPercent(currentData.profit, previousData.profit),
      },
      newOrders: {
        current: currentData.orderCount,
        previous: previousData.orderCount,
        changePercent: this.calcPercent(currentData.orderCount, previousData.orderCount),
      },
      itemsSold: {
        current: currentData.itemsSold,
        previous: previousData.itemsSold,
        changePercent: this.calcPercent(currentData.itemsSold, previousData.itemsSold),
      },
      newCustomers: {
        current: newCustomersCurrent,
        previous: newCustomersPrevious,
        changePercent: this.calcPercent(newCustomersCurrent, newCustomersPrevious),
      },
    };
  },

  /** Aggregate order data for a date range */
  async aggregateOrders(start: Date, end: Date) {
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $project: {
          total: 1,
          itemsCount: { $sum: '$items.quantity' },
          cost: {
            $reduce: {
              input: '$items',
              initialValue: 0,
              in: { $add: ['$$value', { $multiply: ['$$this.costPrice', '$$this.quantity'] }] },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' },
          cost: { $sum: '$cost' },
          orderCount: { $sum: 1 },
          itemsSold: { $sum: '$itemsCount' },
        },
      },
      {
        $project: {
          _id: 0,
          revenue: 1,
          orderCount: 1,
          itemsSold: 1,
          profit: { $subtract: ['$revenue', '$cost'] },
        },
      },
    ]);

    return result[0] || { revenue: 0, profit: 0, orderCount: 0, itemsSold: 0 };
  },

  /** Calculate percentage change */
  calcPercent(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 10000) / 100;
  },

  /** Get current and previous period date ranges */
  getDateRange(period: DashboardPeriod, startDate?: string, endDate?: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    if (period === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const duration = end.getTime() - start.getTime();

      const prevStart = new Date(start.getTime() - duration);
      const prevEnd = new Date(start);

      return {
        current: { start, end },
        previous: { start: prevStart, end: prevEnd },
      };
    }

    switch (period) {
      case 'today': {
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        return {
          current: { start: todayStart, end: todayEnd },
          previous: { start: yesterdayStart, end: todayStart },
        };
      }
      case 'week': {
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
        const prevWeekStart = new Date(weekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        return {
          current: { start: weekStart, end: todayEnd },
          previous: { start: prevWeekStart, end: weekStart },
        };
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
          current: { start: monthStart, end: todayEnd },
          previous: { start: prevMonthStart, end: monthStart },
        };
      }
      case 'year': {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
        return {
          current: { start: yearStart, end: todayEnd },
          previous: { start: prevYearStart, end: yearStart },
        };
      }
    }
  },
};
