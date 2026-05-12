import { useState } from 'react';
import { Table, Button, Tag, Input, Segmented, Space, DatePicker } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ORDER_STATUS } from '@turboorder/shared';
import type { Order, OrderStatus, PaginatedResponse } from '@turboorder/shared';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

/**
 * Order list page with search, status filter, date range, and sortable table.
 */
export default function OrderListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, statusFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await api.get<{ success: boolean; data: PaginatedResponse<Order> }>('/orders', { params });
      return data.data;
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const columns: ColumnsType<Order> = [
    {
      title: t('orders.order_number'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      sorter: true,
      render: (text: string) => <a style={{ fontWeight: 500 }}>{text}</a>,
    },
    {
      title: t('orders.customer'),
      dataIndex: ['customer', 'name'],
      key: 'customer',
      render: (_: unknown, record: Order) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.customer.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{record.customer.phone}</div>
        </div>
      ),
    },
    {
      title: t('orders.order_value'),
      key: 'orderValue',
      align: 'right',
      render: (_, record: Order) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(record.total - (record.shippingFee || 0))}
        </span>
      ),
    },
    {
      title: t('orders.shipping_fee'),
      dataIndex: 'shippingFee',
      key: 'shippingFee',
      align: 'right',
      render: (value: number) => (
        <span style={{ color: 'rgba(0,0,0,0.45)', fontVariantNumeric: 'tabular-nums' }}>
          {value ? formatCurrency(value) : '-'}
        </span>
      ),
    },
    {
      title: t('orders.total'),
      dataIndex: 'total',
      key: 'total',
      sorter: true,
      align: 'right',
      render: (value: number) => (
        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      title: t('orders.status.label'),
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => {
        const config = ORDER_STATUS[status];
        return <Tag color={config.color}>{t(config.label)}</Tag>;
      },
    },
    {
      title: t('orders.date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
  ];

  const statusOptions = [
    { label: t('common.all'), value: 'all' },
    ...Object.entries(ORDER_STATUS).map(([key, val]) => ({
      label: t(val.label),
      value: key,
    })),
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{t('orders.title')}</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/orders/new')}>
          {t('orders.create')}
        </Button>
      </div>

      {/* Filters */}
      <Space direction="vertical" size={16} style={{ width: '100%', marginBottom: 16 }}>
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder={t('common.search')}
            allowClear
            style={{ width: 300 }}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <RangePicker />
        </Space>
        <Segmented options={statusOptions} value={statusFilter} onChange={(v) => { setStatusFilter(v as string); setPage(1); }} />
      </Space>

      {/* Table */}
      <Table<Order>
        columns={columns}
        dataSource={data?.items}
        loading={isLoading}
        rowKey="_id"
        onRow={(record) => ({
          onClick: () => navigate(`/orders/${record._id}`),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.pagination.total,
          showTotal: (total) => `${total} ${t('orders.title').toLowerCase()}`,
          onChange: setPage,
        }}
      />
    </div>
  );
}
