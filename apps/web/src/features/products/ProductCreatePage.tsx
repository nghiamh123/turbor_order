import { useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Card, message, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Category } from '@turboorder/shared';

export default function ProductCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Category[] }>('/categories');
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => api.post('/products', values),
    onSuccess: () => {
      message.success(t('products.create_success'));
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/products');
    },
    onError: () => message.error(t('errors.unknown')),
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Button onClick={() => navigate('/products')}>{t('common.back')}</Button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{t('products.create')}</h1>
      </div>

      <Card style={{ maxWidth: 640 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
          initialValues={{ costPrice: 0, stock: 0, lowStockThreshold: 10, unit: 'cái' }}
        >
          <Form.Item name="name" label={t('products.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="sku" label={t('products.sku')}>
            <Input placeholder="Tự động tạo nếu để trống" />
          </Form.Item>

          <Form.Item name="category" label={t('products.category')}>
            <Select allowClear placeholder={t('products.category')}>
              {categories?.map((cat) => (
                <Select.Option key={cat._id} value={cat._id}>{cat.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Space size={16}>
            <Form.Item name="costPrice" label={t('products.cost_price')}>
              <InputNumber
                min={0}
                style={{ width: 200 }}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                addonAfter="₫"
              />
            </Form.Item>

            <Form.Item name="sellingPrice" label={t('products.selling_price')} rules={[{ required: true }]}>
              <InputNumber
                min={0}
                style={{ width: 200 }}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                addonAfter="₫"
              />
            </Form.Item>
          </Space>

          <Space size={16}>
            <Form.Item name="stock" label={t('products.stock.label')} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: 150 }} />
            </Form.Item>

            <Form.Item name="unit" label={t('products.unit')}>
              <Input style={{ width: 150 }} />
            </Form.Item>
          </Space>

          <Form.Item name="description" label={t('products.description')}>
            <Input.TextArea rows={3} maxLength={2000} showCount />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                {t('common.save')}
              </Button>
              <Button onClick={() => navigate('/products')}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
