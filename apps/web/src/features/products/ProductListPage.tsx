import { useState } from 'react';
import { Table, Button, Tag, Input, Space, App } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Product, PaginatedResponse } from '@turboorder/shared';
import type { ColumnsType } from 'antd/es/table';

export default function ProductListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      const { data } = await api.get<{ success: boolean; data: PaginatedResponse<Product> }>('/products', { params });
      return data.data;
    },
  });

  const bulkDeleteMut = useMutation({
    mutationFn: (ids: string[]) => api.post<{ success: boolean; data: { deleted: number } }>('/products/bulk-delete', { ids }),
    onSuccess: (res) => {
      const { deleted } = res.data.data;
      message.success(t('products.bulk_delete_success', { count: deleted }));
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => message.error(t('errors.unknown')),
  });

  const handleBulkDelete = () => {
    modal.confirm({
      title: t('products.bulk_delete_confirm_title'),
      icon: <ExclamationCircleFilled />,
      content: t('products.bulk_delete_confirm_content', { count: selectedRowKeys.length }),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: () => bulkDeleteMut.mutateAsync(selectedRowKeys as string[]),
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const getStockTag = (product: Product) => {
    if (product.stock === 0) return <Tag color="red">{t('products.stock.out_of_stock')}</Tag>;
    if (product.stock <= product.lowStockThreshold) return <Tag color="orange">{t('products.stock.low_stock')}</Tag>;
    return <Tag color="green">{t('products.stock.in_stock')}</Tag>;
  };

  const columns: ColumnsType<Product> = [
    {
      title: t('products.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: t('products.sku'),
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
    },
    {
      title: t('products.category'),
      dataIndex: ['category', 'name'],
      key: 'category',
    },
    {
      title: t('products.retail_price'),
      dataIndex: 'retailPrice',
      key: 'retailPrice',
      sorter: true,
      align: 'right',
      render: (value: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(value)}</span>
      ),
    },
    {
      title: t('products.wholesale_price'),
      dataIndex: 'wholesalePrice',
      key: 'wholesalePrice',
      sorter: true,
      align: 'right',
      render: (value: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(value)}</span>
      ),
    },
    {
      title: t('products.stock.label'),
      dataIndex: 'stock',
      key: 'stock',
      sorter: true,
      align: 'center',
      render: (_: unknown, record: Product) => (
        <Space>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{record.stock}</span>
          {getStockTag(record)}
        </Space>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_: unknown, record: Product) => (
        <Button type="link" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); navigate(`/products/${record._id}/edit`); }} />
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{t('products.title')}</h1>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products/new')}>
            {t('products.create')}
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

      <Table<Product>
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
          showTotal: (total) => `${total} ${t('products.title').toLowerCase()}`,
          onChange: setPage,
        }}
      />
    </div>
  );
}
