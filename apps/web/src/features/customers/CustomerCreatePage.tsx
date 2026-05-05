import { Form, Input, Button, Card, message, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import VietnamAddressSelect from '@/components/common/VietnamAddressSelect';

export default function CustomerCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const createMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => api.post('/customers', values),
    onSuccess: () => {
      message.success(t('customers.create_success'));
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: { code?: string } } } };
      if (error.response?.data?.error?.code === 'CUSTOMER_PHONE_EXISTS') {
        message.error(t('customers.phone_exists'));
      } else {
        message.error(t('errors.unknown'));
      }
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Button onClick={() => navigate('/customers')}>{t('common.back')}</Button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{t('customers.create')}</h1>
      </div>

      <Card style={{ maxWidth: 640 }}>
        <Form form={form} layout="vertical" onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item name="name" label={t('customers.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="phone"
            label={t('customers.phone')}
            rules={[
              { required: true },
              { pattern: /^0\d{9}$/, message: t('errors.validation.phone_invalid') },
            ]}
          >
            <Input maxLength={10} />
          </Form.Item>

          <Form.Item name="email" label={t('customers.email')}>
            <Input type="email" />
          </Form.Item>

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
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                {t('common.save')}
              </Button>
              <Button onClick={() => navigate('/customers')}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
