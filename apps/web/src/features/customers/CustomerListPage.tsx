import { useState } from 'react';
import { Table, Button, Tag, Input, Space, App } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { CUSTOMER_TIER } from '@turboorder/shared';
import type { Customer, PaginatedResponse, CustomerTier } from '@turboorder/shared';
import type { ColumnsType } from 'antd/es/table';

export default function CustomerListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      const { data } = await api.get<{ success: boolean; data: PaginatedResponse<Customer> }>('/customers', { params });
      return data.data;
    },
  });

  const bulkDeleteMut = useMutation({
    mutationFn: (ids: string[]) => api.post<{ success: boolean; data: { deleted: number; skipped: number } }>('/customers/bulk-delete', { ids }),
    onSuccess: (res) => {
      const { deleted, skipped } = res.data.data;
      if (skipped > 0) {
        message.warning(t('customers.bulk_delete_partial', { deleted, skipped }));
      } else {
        message.success(t('customers.bulk_delete_success', { count: deleted }));
      }
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => message.error(t('errors.unknown')),
  });

  const handleBulkDelete = () => {
    modal.confirm({
      title: t('customers.bulk_delete_confirm_title'),
      icon: <ExclamationCircleFilled />,
      content: t('customers.bulk_delete_confirm_content', { count: selectedRowKeys.length }),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: () => bulkDeleteMut.mutateAsync(selectedRowKeys as string[]),
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    const formatAddress = (addr?: Customer['address']) => {
      if (!addr) return '—';
      const { street, location, ward, district, city } = addr;
      const parts = [
        street,
        location?.ward || ward,
        location?.district || district,
        location?.city || city,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : '—';
    };

    const columns: ColumnsType<Customer> = [
    {
      title: t('customers.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: t('customers.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: t('customers.address'),
      key: 'address',
      render: (_: unknown, record: Customer) => (
        <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>{formatAddress(record.address)}</span>
      ),
    },
    {
      title: t('customers.total_orders'),
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      sorter: true,
      align: 'center',
      width: 100,
    },
    {
      title: t('customers.total_spent'),
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      sorter: true,
      align: 'right',
      render: (value: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(value)}</span>
      ),
    },
    {
      title: t('customers.tier.label'),
      dataIndex: 'tier',
      key: 'tier',
      width: 100,
      render: (tier: CustomerTier) => {
        const config = CUSTOMER_TIER[tier];
        return <Tag color={config.color}>{t(config.label)}</Tag>;
      },
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_: unknown, record: Customer) => (
        <Button type="link" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); navigate(`/customers/${record._id}/edit`); }} />
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{t('customers.title')}</h1>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleBulkDelete}
              loading={bulkDeleteMut.isPending}
            >
              {t('common.delete')} ({selectedRowKeys.length})
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/customers/new')}>
            {t('customers.create')}
          </Button>
        </Space>
      </div>

      <Input
        prefix={<SearchOutlined />}
        placeholder={t('common.search')}
        allowClear
        style={{ width: 300, marginBottom: 16 }}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
      />

      <Table<Customer>
        columns={columns}
        dataSource={data?.items}
        loading={isLoading}
        rowKey="_id"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.pagination.total,
          showTotal: (total) => `${total} ${t('customers.title').toLowerCase()}`,
          onChange: setPage,
        }}
      />
    </div>
  );
}
