import { useState, useMemo } from 'react';
import {
  Card, Form, Button, Select, InputNumber, Input, Table, Space, Typography,
  Divider, message, Row, Col, Tag, Empty,
} from 'antd';
import { PlusOutlined, DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Customer, Product, PaginatedResponse } from '@turboorder/shared';

const { Title, Text } = Typography;

interface OrderItemRow {
  key: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  stock: number;
  quantity: number;
  subtotal: number;
}

/**
 * Order creation page — full form with:
 * - Customer search/select
 * - Product search with live stock display
 * - Dynamic item table with quantity controls
 * - Real-time subtotal/discount/total calculation
 */
export default function OrderCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [discountType, setDiscountType] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // ─── Data fetching ───
  const { data: customers } = useQuery({
    queryKey: ['customers-select', customerSearch],
    queryFn: async () => {
      const params: Record<string, string | number> = { page: 1, limit: 20 };
      if (customerSearch) params.search = customerSearch;
      const { data } = await api.get<{ success: boolean; data: PaginatedResponse<Customer> }>('/customers', { params });
      return data.data.items;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products-select', productSearch],
    queryFn: async () => {
      const params: Record<string, string | number> = { page: 1, limit: 50 };
      if (productSearch) params.search = productSearch;
      const { data } = await api.get<{ success: boolean; data: PaginatedResponse<Product> }>('/products', { params });
      return data.data.items;
    },
  });

  // ─── Calculations ───
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.subtotal, 0), [items]);

  const discountAmount = useMemo(() => {
    if (!discountType || !discountValue) return 0;
    if (discountType === 'percentage') return Math.round(subtotal * (discountValue / 100));
    return Math.min(discountValue, subtotal);
  }, [subtotal, discountType, discountValue]);

  const total = subtotal - discountAmount;

  // ─── Add product ───
  const handleAddProduct = () => {
    if (!selectedProductId) return;
    if (items.find((item) => item.productId === selectedProductId)) {
      message.warning(t('orders.already_in_order'));
      return;
    }

    const product = products?.find((p) => p._id === selectedProductId);
    if (!product) return;

    if (product.stock <= 0) {
      message.error(t('orders.out_of_stock'));
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        key: product._id,
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        unitPrice: product.retailPrice,
        retailPrice: product.retailPrice,
        wholesalePrice: product.wholesalePrice,
        stock: product.stock,
        quantity: 1,
        subtotal: product.retailPrice,
      },
    ]);
    setSelectedProductId(null);
  };

  // ─── Update quantity ───
  const handleQuantityChange = (key: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          const unitPrice = quantity >= 5 ? item.wholesalePrice : item.retailPrice;
          return { ...item, quantity, unitPrice, subtotal: unitPrice * quantity };
        }
        return item;
      })
    );
  };

  // ─── Remove item ───
  const handleRemoveItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  // ─── Submit ───
  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/orders', payload),
    onSuccess: () => {
      message.success(t('orders.create_success'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/orders');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: { code?: string } } } };
      const code = error.response?.data?.error?.code;
      if (code === 'INSUFFICIENT_STOCK') {
        message.error(t('orders.insufficient_stock'));
      } else if (code === 'CUSTOMER_NOT_FOUND') {
        message.error(t('orders.customer_not_found'));
      } else {
        message.error(t('errors.unknown'));
      }
    },
  });

  const handleSubmit = () => {
    const customerId = form.getFieldValue('customerId');
    if (!customerId) {
      message.warning(t('orders.select_customer'));
      return;
    }
    if (items.length === 0) {
      message.warning(t('orders.add_item'));
      return;
    }

    createMutation.mutate({
      customerId,
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      discountType: discountType || null,
      discountValue: discountValue || 0,
      note: form.getFieldValue('note') || '',
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  // ─── Item table columns ───
  const columns = [
    {
      title: t('products.name'),
      dataIndex: 'productName',
      key: 'productName',
      render: (text: string, record: OrderItemRow) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.sku}</Text>
        </div>
      ),
    },
    {
      title: t('orders.unit_price'),
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 140,
      align: 'right' as const,
      render: (v: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(v)}</span>,
    },
    {
      title: t('products.stock.label'),
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      align: 'center' as const,
      render: (v: number) => <Tag color={v <= 10 ? 'orange' : 'green'}>{v}</Tag>,
    },
    {
      title: t('orders.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center' as const,
      render: (_: unknown, record: OrderItemRow) => (
        <InputNumber
          min={1}
          max={record.stock}
          value={record.quantity}
          onChange={(v) => handleQuantityChange(record.key, v || 1)}
          size="small"
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 140,
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(v)}</span>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 48,
      render: (_: unknown, record: OrderItemRow) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveItem(record.key)} size="small" />
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Button onClick={() => navigate('/orders')}>{t('common.back')}</Button>
        <Title level={4} style={{ margin: 0 }}>{t('orders.create')}</Title>
      </div>

      <Row gutter={24}>
        {/* Left: Items */}
        <Col xs={24} lg={16}>
          <Card
            title={t('orders.items')}
            extra={
              <Space>
                <Select
                  showSearch
                  allowClear
                  placeholder={t('common.search') + ' sản phẩm...'}
                  value={selectedProductId}
                  onChange={setSelectedProductId}
                  onSearch={setProductSearch}
                  filterOption={false}
                  style={{ width: 300 }}
                  options={products?.filter(p => p.stock > 0).map((p) => ({
                    value: p._id,
                    label: `${p.name} — ${formatCurrency(p.retailPrice)} (${t('products.wholesale_tag')}: ${formatCurrency(p.wholesalePrice)}) (${p.stock})`,
                  }))}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProduct} disabled={!selectedProductId}>
                  {t('orders.add_item')}
                </Button>
              </Space>
            }
          >
            {items.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có sản phẩm nào" />
            ) : (
              <Table
                columns={columns}
                dataSource={items}
                pagination={false}
                size="small"
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        <Text strong>{t('orders.subtotal')}:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right">
                        <Text strong style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(subtotal)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} />
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            )}
          </Card>
        </Col>

        {/* Right: Customer + Discount + Summary */}
        <Col xs={24} lg={8}>
          <Form form={form} layout="vertical">
            {/* Customer Selection */}
            <Card title={t('orders.customer')} style={{ marginBottom: 16 }}>
              <Form.Item name="customerId" rules={[{ required: true, message: t('orders.select_customer') }]}>
                <Select
                  showSearch
                  placeholder={t('orders.select_customer')}
                  onSearch={setCustomerSearch}
                  filterOption={false}
                  options={customers?.map((c) => ({
                    value: c._id,
                    label: `${c.name} — ${c.phone}`,
                  }))}
                />
              </Form.Item>
            </Card>

            {/* Discount */}
            <Card title={t('orders.discount')} style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select
                  allowClear
                  placeholder="Loại giảm giá"
                  value={discountType}
                  onChange={(v) => { setDiscountType(v); if (!v) setDiscountValue(0); }}
                  options={[
                    { value: 'percentage', label: '% Phần trăm' },
                    { value: 'fixed', label: '₫ Cố định' },
                  ]}
                  style={{ width: '100%' }}
                />
                {discountType && (
                  <InputNumber
                    min={0}
                    max={discountType === 'percentage' ? 100 : undefined}
                    value={discountValue}
                    onChange={(v) => setDiscountValue(v || 0)}
                    addonAfter={discountType === 'percentage' ? '%' : '₫'}
                    style={{ width: '100%' }}
                    formatter={(v) => discountType === 'fixed' ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : `${v}`}
                  />
                )}
              </Space>
            </Card>

            {/* Note */}
            <Card title={t('orders.note')} style={{ marginBottom: 16 }}>
              <Form.Item name="note" noStyle>
                <Input.TextArea rows={2} maxLength={1000} placeholder="Ghi chú đơn hàng..." />
              </Form.Item>
            </Card>

            {/* Summary */}
            <Card
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                borderRadius: 12,
              }}
              styles={{ body: { padding: 20 } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{t('orders.subtotal')}</Text>
                <Text style={{ color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(subtotal)}</Text>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{t('orders.discount')}</Text>
                  <Text style={{ color: '#FADB14', fontVariantNumeric: 'tabular-nums' }}>-{formatCurrency(discountAmount)}</Text>
                </div>
              )}
              <Divider style={{ borderColor: 'rgba(255,255,255,0.3)', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Title level={4} style={{ color: '#fff', margin: 0 }}>{t('orders.total')}</Title>
                <Title level={4} style={{ color: '#fff', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(total)}
                </Title>
              </div>

              <Button
                type="primary"
                block
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={handleSubmit}
                loading={createMutation.isPending}
                disabled={items.length === 0}
                style={{
                  marginTop: 16,
                  background: 'rgba(255,255,255,0.2)',
                  borderColor: 'rgba(255,255,255,0.5)',
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {t('orders.create')} ({items.length} {t('orders.items').toLowerCase()})
              </Button>
            </Card>
          </Form>
        </Col>
      </Row>
    </div>
  );
}
