import { useState } from 'react';
import { DatePicker, Row, Col, Card, Statistic, Button, Space, Spin, theme } from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TeamOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { TimeRangePickerProps } from 'antd';
import api from '@/lib/api';
import type { DashboardOverview } from '@turboorder/shared';

const { RangePicker } = DatePicker;

/**
 * Dashboard page — KPI overview with date range filter and quick actions.
 */
export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  // Default to last 7 days
  const [dates, setDates] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs(),
  ]);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', dates[0].toISOString(), dates[1].toISOString()],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: DashboardOverview }>('/dashboard/overview', {
        params: {
          period: 'custom',
          startDate: dates[0].startOf('day').toISOString(),
          endDate: dates[1].endOf('day').toISOString(),
        },
      });
      return data.data;
    },
  });

  /** Format currency (VND) */
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const kpiCards = [
    {
      title: t('dashboard.revenue'),
      value: data?.revenue.current ?? 0,
      formatter: formatCurrency,
      change: data?.revenue.changePercent ?? 0,
      icon: <DollarOutlined />,
      color: '#1677FF',
      bgColor: '#E6F4FF',
    },
    {
      title: t('dashboard.profit'),
      value: data?.profit.current ?? 0,
      formatter: formatCurrency,
      change: data?.profit.changePercent ?? 0,
      icon: <DollarOutlined />,
      color: '#EB2F96',
      bgColor: '#FFF0F6',
    },
    {
      title: t('dashboard.shipping_fee'),
      value: data?.shippingFee.current ?? 0,
      formatter: formatCurrency,
      change: data?.shippingFee.changePercent ?? 0,
      icon: <ShoppingCartOutlined />,
      color: '#13C2C2',
      bgColor: '#E6FFFB',
    },
    {
      title: t('dashboard.new_orders'),
      value: data?.newOrders.current ?? 0,
      change: data?.newOrders.changePercent ?? 0,
      icon: <ShoppingCartOutlined />,
      color: '#722ED1',
      bgColor: '#F9F0FF',
    },
    {
      title: t('dashboard.items_sold'),
      value: data?.itemsSold.current ?? 0,
      change: data?.itemsSold.changePercent ?? 0,
      icon: <ShoppingOutlined />,
      color: '#FA8C16',
      bgColor: '#FFF7E6',
    },
    {
      title: t('dashboard.new_customers'),
      value: data?.newCustomers.current ?? 0,
      change: data?.newCustomers.changePercent ?? 0,
      icon: <TeamOutlined />,
      color: '#52C41A',
      bgColor: '#F6FFED',
    },
  ];

  const rangePresets: TimeRangePickerProps['presets'] = [
    { label: t('dashboard.today'), value: [dayjs().startOf('day'), dayjs().endOf('day')] },
    { label: t('dashboard.yesterday'), value: [dayjs().subtract(1, 'd').startOf('day'), dayjs().subtract(1, 'd').endOf('day')] },
    { label: t('dashboard.this_week'), value: [dayjs().startOf('week'), dayjs().endOf('week')] },
    { label: t('dashboard.this_month'), value: [dayjs().startOf('month'), dayjs().endOf('month')] },
    { label: t('dashboard.last_month'), value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
    { label: t('dashboard.3_days_ago'), value: [dayjs().subtract(3, 'd'), dayjs()] },
    { label: t('dashboard.7_days_ago'), value: [dayjs().subtract(7, 'd'), dayjs()] },
    { label: t('dashboard.14_days_ago'), value: [dayjs().subtract(14, 'd'), dayjs()] },
    { label: t('dashboard.30_days_ago'), value: [dayjs().subtract(30, 'd'), dayjs()] },
  ];

  return (
    <Spin spinning={isLoading}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{t('dashboard.title')}</h1>
        <RangePicker
          presets={rangePresets}
          value={dates}
          onChange={(val) => val && setDates(val as [dayjs.Dayjs, dayjs.Dayjs])}
          allowClear={false}
          suffixIcon={<CalendarOutlined style={{ color: token.colorPrimary }} />}
          style={{
            borderRadius: 8,
            padding: '8px 16px',
            border: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: '0 2px 0 rgba(0, 0, 0, 0.02)',
          }}
        />
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {kpiCards.map((card) => (
          <Col xs={24} sm={12} lg={8} key={card.title}>
            <Card hoverable styles={{ body: { padding: 20 } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, marginBottom: 8 }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {card.formatter ? card.formatter(card.value) : card.value.toLocaleString()}
                  </div>
                  <div style={{
                    marginTop: 8,
                    color: card.change >= 0 ? '#52C41A' : '#FF4D4F',
                    fontSize: 14,
                  }}>
                    {card.change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {' '}{Math.abs(card.change)}%
                  </div>
                </div>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: card.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  color: card.color,
                }}>
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quick Actions */}
      <Card title={t('dashboard.quick_actions')} styles={{ body: { padding: 16 } }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/orders/new')}>
            {t('dashboard.create_order')}
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => navigate('/products/new')}>
            {t('dashboard.add_product')}
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => navigate('/customers/new')}>
            {t('dashboard.add_customer')}
          </Button>
        </Space>
      </Card>
    </Spin>
  );
}
