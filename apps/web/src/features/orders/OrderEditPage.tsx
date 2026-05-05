import { useState, useMemo, useEffect } from 'react';
import {
  Card, Form, Button, Select, InputNumber, Input, Table, Space, Typography,
  Divider, message, Row, Col, Tag, Empty, Spin,
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Customer, Product, Order, PaginatedResponse } from '@turboorder/shared';

const { Title, Text } = Typography;

interface OrderItemRow {
  key: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  stock: number;
  quantity: number;
  subtotal: number;
}

/**
 * Order edit page — only available for orders with 'new' status.
 * Reuses same layout as OrderCreatePage.
 */
export default function OrderEditPage() {
  const { id } = useParams<{ id: string }>();
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
  const [initialized, setInitialized] = useState(false);

  // ─── Fetch existing order ───
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Order }>(`/orders/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

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

  // ─── Initialize form with existing order data ───
  useEffect(() => {
    if (order && !initialized) {
      // Redirect if order is not editable
      if (order.status !== 'new') {
        message.error(t('orders.not_editable'));
        navigate(`/orders/${id}`);
        return;
      }

      form.setFieldsValue({
        customerId: order.customer._id,
        note: order.note || '',
      });

      setItems(order.items.map(item => ({
        key: item.product,
        productId: item.product,
        productName: item.productName,
        sku: item.sku,
        unitPrice: item.unitPrice,
        stock: 999, // Will be refreshed when products load
        quantity: item.quantity,
        subtotal: item.subtotal,
      })));

      setDiscountType(order.discountType);
      setDiscountValue(order.discountValue);
      setInitialized(true);
    }
  }, [order, initialized, form, navigate, id, t]);

  // Update stock numbers when products are loaded
  useEffect(() => {
    if (products && items.length > 0 && order) {
      setItems(prev => prev.map(item => {
        const product = products.find(p => p._id === item.productId);
        if (product) {
          // Add back the quantity from this order since it will be restored on save
          const origItem = order.items.find(i => i.product === item.productId);
          const reservedQty = origItem ? origItem.quantity : 0;
          return { ...item, stock: product.stock + reservedQty };
        }
        return item;
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

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
      message.warning('Sản phẩm đã có trong đơn');
      return;
    }

    const product = products?.find((p) => p._id === selectedProductId);
    if (!product) return;

    // Check stock (add back reserved quantity for this order's original items)
    const origItem = order?.items.find(i => i.product === selectedProductId);
    const availableStock = product.stock + (origItem ? origItem.quantity : 0);

    if (availableStock <= 0) {
      message.error('Sản phẩm đã hết hàng');
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        key: product._id,
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        unitPrice: product.sellingPrice,
        stock: availableStock,
        quantity: 1,
        subtotal: product.sellingPrice,
      },
    ]);
    setSelectedProductId(null);
  };

  // ─── Update quantity ───
  const handleQuantityChange = (key: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, quantity, subtotal: item.unitPrice * quantity }
          : item
      )
    );
  };

  // ─── Remove item ───
  const handleRemoveItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  // ─── Submit ───
  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.put(`/orders/${id}`, payload),
    onSuccess: () => {
      message.success(t('orders.update_success'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(`/orders/${id}`);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: { code?: string } } } };
      const code = error.response?.data?.error?.code;
      if (code === 'INSUFFICIENT_STOCK') {
        message.error('Không đủ tồn kho cho sản phẩm trong đơn');
      } else if (code === 'ORDER_NOT_EDITABLE') {
        message.error(t('orders.not_editable'));
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

    updateMutation.mutate({
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

  if (orderLoading || !order) {
    return <Spin style={{ display: 'block', margin: '100px auto' }} size="large" />;
  }

  if (order.status !== 'new') {
    return null; // Will redirect via useEffect
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Button onClick={() => navigate(`/orders/${id}`)}>{t('common.back')}</Button>
        <Title level={4} style={{ margin: 0 }}>{t('orders.edit')} — {order.orderNumber}</Title>
        <Tag color="#1677FF">{t('orders.status.new')}</Tag>
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
                  options={products?.filter(p => {
                    // Show products not already in the order, or out of stock
                    const origItem = order.items.find(i => i.product === p._id);
                    const availableStock = p.stock + (origItem ? origItem.quantity : 0);
                    return availableStock > 0;
                  }).map((p) => ({
                    value: p._id,
                    label: `${p.name} — ${formatCurrency(p.sellingPrice)} (${p.stock})`,
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
                icon={<SaveOutlined />}
                onClick={handleSubmit}
                loading={updateMutation.isPending}
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
                {t('orders.save_changes')} ({items.length} {t('orders.items').toLowerCase()})
              </Button>
            </Card>
          </Form>
        </Col>
      </Row>
    </div>
  );
}
