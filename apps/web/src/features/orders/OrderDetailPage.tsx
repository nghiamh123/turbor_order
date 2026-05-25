import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Typography, Timeline, Modal, Input, App, Spin, Row, Col, Steps, Divider, Descriptions } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, CarOutlined, TrophyOutlined, CloseCircleOutlined, ClockCircleOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ORDER_STATUS, ORDER_STATUS_TRANSITIONS } from '@turboorder/shared';
import type { Order, OrderStatus } from '@turboorder/shared';
import dayjs from 'dayjs';
import TrackingTimeline from './components/TrackingTimeline';

const { Title, Text } = Typography;
const STATUS_STEPS = ['new', 'confirmed', 'shipping', 'completed'] as const;
const STATUS_ICONS: Record<string, React.ReactNode> = {
  new: <ClockCircleOutlined />, confirmed: <CheckOutlined />,
  shipping: <CarOutlined />, completed: <TrophyOutlined />,
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { modal, message } = App.useApp();
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelNote, setCancelNote] = useState('');
  const [shippingModal, setShippingModal] = useState(false);
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingFee, setShippingFee] = useState<number>(0);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Order }>(`/orders/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (order && shippingModal) {
      setShippingCarrier(order.shippingCarrier || '');
      setTrackingNumber(order.trackingNumber || '');
      setShippingFee(order.shippingFee || 0);
    }
  }, [order, shippingModal]);

  const statusMut = useMutation({
    mutationFn: (data: { status: OrderStatus; note?: string; shippingCarrier?: string; trackingNumber?: string; shippingFee?: number }) =>
      api.patch(`/orders/${id}/status`, data),
    onSuccess: () => {
      message.success(t('orders.status_updated'));
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShippingModal(false);
    },
    onError: () => message.error(t('errors.unknown')),
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/orders/${id}`),
    onSuccess: () => {
      message.success(t('orders.delete_success'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/orders');
    },
    onError: () => message.error(t('errors.unknown')),
  });

  const handleDelete = () => {
    modal.confirm({
      title: t('orders.delete_confirm_title'),
      icon: <ExclamationCircleFilled />,
      content: t('orders.delete_confirm_content', { orderNumber: order?.orderNumber }),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: () => deleteMut.mutateAsync(),
    });
  };

  const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

  if (isLoading || !order) return <Spin style={{ display: 'block', margin: '100px auto' }} size="large" />;

  const allowed = ORDER_STATUS_TRANSITIONS[order.status] || [];
  const stepIdx = STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]);
  const isCancelled = order.status === 'cancelled';
  const isEditable = order.status === 'new';

  const formatAddress = (addr?: Order['shippingAddress']) => {
    if (!addr) return null;
    const { street, location, ward, district, city } = addr;
    
    // Support both new location-based and old string-based address
    const parts = [
      street,
      location?.ward || ward,
      location?.district || district,
      location?.city || city,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : null;
  };

  const shippingAddr = formatAddress(order.shippingAddress);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')} />
          <Title level={4} style={{ margin: 0 }}>{order.orderNumber}</Title>
          <Tag color={ORDER_STATUS[order.status].color} style={{ fontSize: 14, padding: '2px 12px' }}>
            {t(ORDER_STATUS[order.status].label)}
          </Tag>
        </Space>
        <Space>
          {/* Edit button — only for 'new' orders */}
          {isEditable && (
            <Button icon={<EditOutlined />} onClick={() => navigate(`/orders/${id}/edit`)}>
              {t('common.edit')}
            </Button>
          )}
          {/* Status transition buttons */}
          {allowed.filter(s => s !== 'cancelled').map(s => (
            <Button 
              key={s} 
              type="primary" 
              icon={STATUS_ICONS[s]} 
              onClick={() => {
                if (s === 'shipping') {
                  setShippingModal(true);
                } else {
                  statusMut.mutate({ status: s as OrderStatus });
                }
              }} 
              loading={statusMut.isPending}
            >
              {t(ORDER_STATUS[s as OrderStatus].label)}
            </Button>
          ))}
          {allowed.includes('cancelled') && (
            <Button danger icon={<CloseCircleOutlined />} onClick={() => setCancelModal(true)}>
              {t('orders.status.cancelled')}
            </Button>
          )}
          {/* Delete button */}
          <Button danger type="text" icon={<DeleteOutlined />} onClick={handleDelete} loading={deleteMut.isPending}>
            {t('common.delete')}
          </Button>
        </Space>
      </div>

      {!isCancelled && (
        <Card style={{ marginBottom: 16 }}>
          <Steps current={stepIdx} items={STATUS_STEPS.map(s => ({ title: t(ORDER_STATUS[s].label), icon: STATUS_ICONS[s] }))} />
        </Card>
      )}
      {isCancelled && (
        <Card style={{ marginBottom: 16, background: '#FFF2F0', borderColor: '#FFCCC7' }}>
          <Space><CloseCircleOutlined style={{ color: '#FF4D4F', fontSize: 20 }} />
            <div><Text strong style={{ color: '#FF4D4F' }}>{t('orders.cancelled_title')}</Text>
              {order.statusHistory.find(h => h.to === 'cancelled')?.note && (
                <div><Text type="secondary">{t('orders.cancel_reason_label')}: {order.statusHistory.find(h => h.to === 'cancelled')!.note}</Text></div>
              )}
            </div>
          </Space>
        </Card>
      )}

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title={t('orders.items')} style={{ marginBottom: 16 }}>
            <Table dataSource={order.items} pagination={false} rowKey="sku" size="small" columns={[
              { title: t('products.name'), key: 'p', render: (_: unknown, r: Order['items'][0]) => (<div><div style={{ fontWeight: 500 }}>{r.productName}</div><Text type="secondary" style={{ fontSize: 12 }}>{r.sku}</Text></div>) },
              { title: t('orders.unit_price'), dataIndex: 'unitPrice', align: 'right', render: (v: number) => fmt(v) },
              { title: t('orders.quantity'), dataIndex: 'quantity', align: 'center' },
              { title: t('orders.subtotal'), dataIndex: 'subtotal', align: 'right', render: (v: number) => <Text strong>{fmt(v)}</Text> },
            ]} />
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ maxWidth: 300, marginLeft: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text type="secondary">{t('orders.subtotal')}</Text><Text>{fmt(order.subtotal)}</Text>
              </div>
              {order.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text type="secondary">{t('orders.discount')}</Text><Text style={{ color: '#FF4D4F' }}>-{fmt(order.discountAmount)}</Text>
                </div>
              )}
              {(order.shippingFee || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text type="secondary">{t('orders.shipping_fee')}</Text><Text>{fmt(order.shippingFee!)}</Text>
                </div>
              )}
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Title level={5} style={{ margin: 0 }}>{t('orders.total')}</Title>
                <Title level={5} style={{ margin: 0, color: '#1677FF' }}>{fmt(order.total)}</Title>
              </div>
            </div>
          </Card>

          {/* Tracking */}
          {order.trackingNumber && (
            <Card title={t('tracking.title')} style={{ marginBottom: 16 }}>
              <TrackingTimeline order={order} />
            </Card>
          )}
        </Col>
        <Col xs={24} lg={8}>
          <Card title={t('orders.customer')} style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t('customers.name')}><Text strong>{order.customer.name}</Text></Descriptions.Item>
              <Descriptions.Item label={t('customers.phone')}>{order.customer.phone}</Descriptions.Item>
              <Descriptions.Item label={t('customers.address')}>
                {shippingAddr || <Text type="secondary" italic>{t('common.not_updated', 'Chưa cập nhật')}</Text>}
              </Descriptions.Item>
              {order.shippingCarrier && (
                <Descriptions.Item label={t('orders.carrier')}>
                  <Tag color="blue">{order.shippingCarrier}</Tag>
                </Descriptions.Item>
              )}
              {order.trackingNumber && (
                <Descriptions.Item label={t('orders.tracking_number')}>
                  <Text copyable>{order.trackingNumber}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t('orders.date')}>{dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
              {order.note && <Descriptions.Item label={t('orders.note')}>{order.note}</Descriptions.Item>}
            </Descriptions>
          </Card>
          <Card title={t('orders.status_history')}>
            <Timeline items={order.statusHistory.map(h => ({
              color: ORDER_STATUS[h.to as OrderStatus]?.color || '#1677FF',
              children: (<div><Tag color={ORDER_STATUS[h.to as OrderStatus]?.color}>{t(ORDER_STATUS[h.to as OrderStatus]?.label)}</Tag>
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>{dayjs(h.changedAt).format('DD/MM/YYYY HH:mm:ss')}</div>
                {h.note && <div style={{ fontSize: 12, marginTop: 2 }}>{h.note}</div>}</div>),
            }))} />
          </Card>
        </Col>
      </Row>

      <Modal title={t('orders.cancel_confirm')} open={cancelModal} onOk={() => { if (!cancelNote.trim()) { message.warning(t('orders.cancel_reason')); return; } statusMut.mutate({ status: 'cancelled', note: cancelNote }); setCancelModal(false); }} onCancel={() => setCancelModal(false)} okText={t('common.confirm')} cancelText={t('common.cancel')} okButtonProps={{ danger: true }}>
        <Input.TextArea rows={3} placeholder={t('orders.cancel_reason')} value={cancelNote} onChange={e => setCancelNote(e.target.value)} />
      </Modal>

      <Modal 
        title={<Space><CarOutlined /><span>{t('orders.shipping_info')}</span></Space>}
        open={shippingModal} 
        onOk={() => {
          statusMut.mutate({ 
            status: 'shipping', 
            shippingCarrier, 
            trackingNumber, 
            shippingFee 
          });
        }} 
        onCancel={() => setShippingModal(false)}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        confirmLoading={statusMut.isPending}
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
          <div>
            <div style={{ marginBottom: 4 }}><Text type="secondary">{t('orders.carrier')}</Text></div>
            <div style={{ width: '100%' }}>
              <Card size="small" style={{ marginBottom: 8, padding: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 0' }}>
                  {['GHTK', 'GHN', 'Viettel Post', 'VNPost', 'J&T Express', 'Ninja Van', 'GrabExpress', 'Ahamove'].map(c => (
                    <Tag.CheckableTag 
                      key={c} 
                      checked={shippingCarrier === c} 
                      onChange={checked => checked && setShippingCarrier(c)}
                      style={{ border: '1px solid #d9d9d9', borderRadius: 4, margin: 0 }}
                    >
                      {c}
                    </Tag.CheckableTag>
                  ))}
                </div>
              </Card>
              <Input 
                placeholder="Hoặc nhập đơn vị khác..." 
                value={shippingCarrier} 
                onChange={e => setShippingCarrier(e.target.value)} 
              />
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 4 }}><Text type="secondary">{t('orders.tracking_number')}</Text></div>
            <Input 
              prefix={<ClockCircleOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
              placeholder={t('orders.tracking_number')} 
              value={trackingNumber} 
              onChange={e => setTrackingNumber(e.target.value)} 
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}><Text type="secondary">{t('orders.shipping_fee')}</Text></div>
            <Input 
              type="number" 
              prefix={<Text type="secondary">₫</Text>}
              placeholder="0" 
              value={shippingFee} 
              onChange={e => setShippingFee(Number(e.target.value))} 
            />
          </div>
          <Card size="small" style={{ background: '#f5f5f5', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>{t('orders.new_total')}:</Text>
              <Text strong style={{ fontSize: 20, color: '#1677FF' }}>
                {fmt(order.subtotal - order.discountAmount + (shippingFee || 0))}
              </Text>
            </div>
          </Card>
        </div>
      </Modal>
    </div>
  );
}
