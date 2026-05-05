import { Form, Input, Button, Card, Space, Spin, Tag, Statistic, Row, Col, App, Typography } from 'antd';
const { Text } = Typography;
import { DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { CUSTOMER_TIER } from '@turboorder/shared';
import type { Customer } from '@turboorder/shared';
import VietnamAddressSelect from '@/components/common/VietnamAddressSelect';

export default function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();
  const [form] = Form.useForm();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Customer }>(`/customers/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const updateMut = useMutation({
    mutationFn: (values: Record<string, unknown>) => api.put(`/customers/${id}`, values),
    onSuccess: () => {
      message.success(t('customers.update_success'));
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { code?: string } } } };
      if (e.response?.data?.error?.code === 'CUSTOMER_PHONE_EXISTS') {
        message.error(t('customers.phone_exists'));
      } else { message.error(t('errors.unknown')); }
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/customers/${id}`),
    onSuccess: () => {
      message.success(t('customers.delete_success'));
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { code?: string } } } };
      if (e.response?.data?.error?.code === 'CUSTOMER_HAS_ACTIVE_ORDERS') {
        message.error(t('customers.has_active_orders'));
      } else { message.error(t('errors.unknown')); }
    },
  });

  const handleDelete = () => {
    modal.confirm({
      title: t('customers.delete_confirm_title'),
      icon: <ExclamationCircleFilled />,
      content: t('customers.delete_confirm_content', { name: customer?.name }),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: () => deleteMut.mutateAsync(),
    });
  };

  const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

  if (isLoading || !customer) return <Spin style={{ display: 'block', margin: '100px auto' }} size="large" />;

  const tierCfg = CUSTOMER_TIER[customer.tier];

  // Build initial values — support both old format (city/district/ward as strings)
  // and new format (location object with codes)
  const addr = customer.address || {} as Record<string, unknown>;
  const initialAddress: Record<string, unknown> = {
    street: (addr as { street?: string }).street || '',
  };

  // If location data exists (new format), use it
  const loc = (addr as { location?: Record<string, unknown> }).location;
  if (loc) {
    initialAddress.location = loc;
  }

  const formatAddress = (addr?: Customer['address']) => {
    if (!addr) return null;
    const { street, location, ward, district, city } = addr;
    const parts = [
      street,
      location?.ward || ward,
      location?.district || district,
      location?.city || city,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const currentAddress = formatAddress(customer.address);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Space direction="vertical" size={0}>
          <Space>
            <Button onClick={() => navigate('/customers')}>{t('common.back')}</Button>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{customer.name}</h1>
            <Tag color={tierCfg.color}>{t(tierCfg.label)}</Tag>
          </Space>
          {currentAddress && (
            <Text type="secondary" style={{ marginLeft: 64, marginTop: 4, display: 'block' }}>
              {currentAddress}
            </Text>
          )}
        </Space>
        <Button danger type="text" icon={<DeleteOutlined />} onClick={handleDelete} loading={deleteMut.isPending}>
          {t('common.delete')}
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}><Card><Statistic title={t('customers.total_orders')} value={customer.totalOrders} /></Card></Col>
        <Col span={8}><Card><Statistic title={t('customers.total_spent')} value={customer.totalSpent} formatter={(v) => fmt(v as number)} /></Card></Col>
        <Col span={8}><Card><Statistic title={t('customers.tier.label')} valueRender={() => <Tag color={tierCfg.color} style={{ fontSize: 16 }}>{t(tierCfg.label)}</Tag>} /></Card></Col>
      </Row>

      <Card title={t('common.edit')} style={{ maxWidth: 640 }}>
        <Form form={form} layout="vertical" onFinish={(v) => updateMut.mutate(v)} initialValues={{
          name: customer.name, phone: customer.phone, email: customer.email || '',
          address: initialAddress, note: customer.note || '',
        }}>
          <Form.Item name="name" label={t('customers.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label={t('customers.phone')} rules={[{ required: true }, { pattern: /^0\d{9}$/, message: t('errors.validation.phone_invalid') }]}>
            <Input maxLength={10} />
          </Form.Item>
          <Form.Item name="email" label={t('customers.email')}><Input type="email" /></Form.Item>
          <Form.Item label={t('customers.address')}>
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <Form.Item name={['address', 'location']} noStyle>
                <VietnamAddressSelect direction="vertical" />
              </Form.Item>
              <Form.Item name={['address', 'street']} noStyle>
                <Input placeholder={t('address.street_placeholder', 'Số nhà, tên đường')} />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="note" label={t('customers.note')}>
            <Input.TextArea rows={2} maxLength={500} showCount />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={updateMut.isPending}>{t('common.save')}</Button>
              <Button onClick={() => navigate('/customers')}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

