import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Select } from 'antd';
import { LockOutlined, MailOutlined, GlobalOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { changeLanguage } from '@/i18n';
import api from '@/lib/api';

const { Title, Text } = Typography;

/**
 * Login page — centered card with email/password form.
 * Sets JWT in memory on success, redirect to dashboard.
 */
export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', values);
      setAuth(data.data.accessToken, data.data.user);
      message.success(t('auth.login_success'));
      navigate('/');
    } catch {
      message.error(t('auth.login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          borderRadius: 12,
        }}
        styles={{ body: { padding: 32 } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
          <Title level={3} style={{ margin: 0 }}>TurboOrder</Title>
          <Text type="secondary">{t('app.tagline')}</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('errors.validation.email_invalid') },
              { type: 'email', message: t('errors.validation.email_invalid') },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder={t('auth.email')}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('errors.validation.password_min') }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth.password')}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('auth.login')}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Select
            value={i18n.language}
            onChange={(val) => changeLanguage(val as 'vi' | 'en')}
            variant="borderless"
            suffixIcon={<GlobalOutlined />}
            options={[
              { value: 'vi', label: '🇻🇳 Tiếng Việt' },
              { value: 'en', label: '🇺🇸 English' },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}
