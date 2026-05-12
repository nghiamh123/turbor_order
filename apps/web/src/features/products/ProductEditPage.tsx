import { Form, Input, InputNumber, Select, Button, Card, message, Space, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Product, Category } from '@turboorder/shared';

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Product }>(`/products/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Category[] }>('/categories');
      return data.data;
    },
  });

  const updateMut = useMutation({
    mutationFn: (values: Record<string, unknown>) => api.put(`/products/${id}`, values),
    onSuccess: () => {
      message.success(t('products.update_success'));
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      navigate('/products');
    },
    onError: () => message.error(t('errors.unknown')),
  });

  if (isLoading || !product) return <Spin style={{ display: 'block', margin: '100px auto' }} size="large" />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Button onClick={() => navigate('/products')}>{t('common.back')}</Button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{t('common.edit')} — {product.name}</h1>
      </div>
      <Card style={{ maxWidth: 640 }}>
        <Form form={form} layout="vertical" onFinish={(v) => updateMut.mutate(v)} initialValues={{
          name: product.name, sku: product.sku, category: (product.category as Category)?._id,
          costPrice: product.costPrice, retailPrice: product.retailPrice, wholesalePrice: product.wholesalePrice,
          stock: product.stock, unit: product.unit, description: product.description,
        }}>
          <Form.Item name="name" label={t('products.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="sku" label={t('products.sku')}><Input disabled /></Form.Item>
          <Form.Item name="category" label={t('products.category')}>
            <Select allowClear placeholder={t('products.category')}>
              {categories?.map(c => <Select.Option key={c._id} value={c._id}>{c.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Space size={16} wrap>
            <Form.Item name="costPrice" label={t('products.cost_price')}>
              <InputNumber min={0} style={{ width: 180 }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="₫" />
            </Form.Item>
            <Form.Item name="retailPrice" label={t('products.retail_price')} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: 180 }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="₫" />
            </Form.Item>
            <Form.Item name="wholesalePrice" label={t('products.wholesale_price')} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: 180 }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="₫" />
            </Form.Item>
          </Space>
          <Space size={16}>
            <Form.Item name="stock" label={t('products.stock.label')} rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="unit" label={t('products.unit')}><Input style={{ width: 150 }} /></Form.Item>
          </Space>
          <Form.Item name="description" label={t('products.description')}>
            <Input.TextArea rows={3} maxLength={2000} showCount />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={updateMut.isPending}>{t('common.save')}</Button>
              <Button onClick={() => navigate('/products')}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
