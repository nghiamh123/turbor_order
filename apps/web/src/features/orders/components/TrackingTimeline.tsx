import { useState } from 'react';
import { Timeline, Tag, Button, Spin, Empty, Alert, Typography, Space, Tooltip, Badge } from 'antd';
import {
  SyncOutlined, CheckCircleFilled, ClockCircleFilled, CarFilled,
  EnvironmentOutlined, LinkOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import type { Order, TrackingEvent } from '@turboorder/shared';
import dayjs from 'dayjs';

const { Text } = Typography;

interface TrackingTimelineProps {
  order: Order;
}

/** Color per VTP numeric status */
function getEventColor(status: string): string {
  const code = parseInt(status, 10);
  if (code === 200 || code === 201) return '#52c41a'; // Giao thành công
  if (code === 107 || code === 300) return '#ff4d4f'; // Hoàn hàng
  if (code >= 100 && code < 200) return '#1677ff';   // Đang vận chuyển
  return '#d9d9d9';
}

function getEventIcon(status: string) {
  const code = parseInt(status, 10);
  if (code === 200 || code === 201) return <CheckCircleFilled style={{ color: '#52c41a' }} />;
  if (code === 107 || code === 300) return <ClockCircleFilled style={{ color: '#ff4d4f' }} />;
  if (code >= 100 && code < 200) return <CarFilled style={{ color: '#1677ff' }} />;
  return <ClockCircleFilled style={{ color: '#d9d9d9' }} />;
}

export default function TrackingTimeline({ order }: TrackingTimelineProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [syncResult, setSyncResult] = useState<'idle' | 'success_empty' | 'success_data' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isVTP = order.shippingCarrier?.toLowerCase().includes('viettel');
  const events: TrackingEvent[] = order.trackingEvents ?? [];
  const vtpTrackUrl = `https://viettelpost.vn/tra-cuu-hanh-trinh-don?billNbr=${order.trackingNumber}`;

  const syncMut = useMutation({
    mutationFn: () =>
      api.post<{ success: boolean; data: Order }>(`/orders/${order._id}/sync-tracking`),
    onSuccess: (res) => {
      setErrorMsg(null);
      const newEvents = res.data.data?.trackingEvents ?? [];
      setSyncResult(newEvents.length > 0 ? 'success_data' : 'success_empty');
      queryClient.invalidateQueries({ queryKey: ['order', order._id] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMsg(e.response?.data?.error?.message || t('tracking.sync_error'));
      setSyncResult('error');
    },
  });

  if (!order.trackingNumber) {
    return (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('tracking.no_tracking_number')} />
    );
  }

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Space wrap>
          <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>
            {order.trackingNumber}
          </Tag>
          {order.shippingCarrier && <Tag color="geekblue">{order.shippingCarrier}</Tag>}
          {isVTP && (
            <Tooltip title={t('tracking.open_vtp')}>
              <Button
                type="link" size="small" icon={<LinkOutlined />}
                href={vtpTrackUrl} target="_blank" rel="noopener noreferrer"
                style={{ paddingLeft: 0 }}
              >
                {t('tracking.track_on_vtp')}
              </Button>
            </Tooltip>
          )}
        </Space>

        <Space>
          {order.lastTrackingSync && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {t('tracking.last_sync')}: {dayjs(order.lastTrackingSync).format('DD/MM HH:mm')}
            </Text>
          )}
          {isVTP && (
            <Button
              size="small"
              icon={<SyncOutlined spin={syncMut.isPending} />}
              onClick={() => syncMut.mutate()}
              loading={syncMut.isPending}
            >
              {t('tracking.sync_now')}
            </Button>
          )}
        </Space>
      </div>

      {/* Error */}
      {syncResult === 'error' && errorMsg && (
        <Alert
          type="error" message={errorMsg} showIcon closable
          onClose={() => setSyncResult('idle')}
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Sync ok but no events (test env / bill not in VTP) */}
      {syncResult === 'success_empty' && events.length === 0 && (
        <Alert
          type="warning" showIcon icon={<InfoCircleOutlined />}
          message={t('tracking.no_events_after_sync')}
          description={t('tracking.no_events_after_sync_desc')}
          closable onClose={() => setSyncResult('idle')}
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Loading spinner */}
      {syncMut.isPending && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spin tip={t('tracking.syncing')} />
        </div>
      )}

      {/* Not yet synced & no events */}
      {!syncMut.isPending && events.length === 0 && syncResult === 'idle' && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('tracking.no_events')}>
          {isVTP && (
            <Button type="primary" size="small" icon={<SyncOutlined />} onClick={() => syncMut.mutate()}>
              {t('tracking.sync_now')}
            </Button>
          )}
        </Empty>
      )}

      {/* Timeline */}
      {events.length > 0 && !syncMut.isPending && (
        <>
          {syncResult === 'success_data' && (
            <Alert
              type="success" message={t('tracking.sync_success')} showIcon closable
              onClose={() => setSyncResult('idle')}
              style={{ marginBottom: 12 }}
            />
          )}
          <Timeline
            mode="left"
            items={[...events].reverse().map((event) => ({
              color: getEventColor(event.status),
              dot: getEventIcon(event.status),
              label: (
                <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                  {dayjs(event.timestamp).format('DD/MM/YYYY HH:mm')}
                </Text>
              ),
              children: (
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    <Badge color={getEventColor(event.status)} style={{ marginRight: 6 }} />
                    {event.statusName}
                  </div>
                  {event.location && (
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>
                      <EnvironmentOutlined style={{ marginRight: 4 }} />
                      {event.location}
                    </div>
                  )}
                  {event.note && (
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>
                      {event.note}
                    </div>
                  )}
                </div>
              ),
            }))}
          />
        </>
      )}
    </div>
  );
}
